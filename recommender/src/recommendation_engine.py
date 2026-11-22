"""
Recommendation engine for suggesting places to visit.
"""
from typing import List, Dict, Set, Tuple, Optional
from datetime import datetime, timedelta, time
from haversine import haversine, Unit
from pymongo.database import Database

from src.models import Location, DayRequest, Place, Restaurant, DaySchedule, TimelineItem
from src.opening_hours_parser import OpeningHoursParser, calculate_travel_time


class RecommendationEngine:
    """Engine for generating place recommendations."""
    
    # Minimum separation between meals in minutes
    MIN_MEAL_SEPARATION_MINUTES = 120
    
    def __init__(self, db: Database):
        self.db = db
        self.parser = OpeningHoursParser()
    
    def calculate_meal_schedule(
        self,
        meal_types: List[str],
        day_start: datetime,
        day_end: datetime
    ) -> List[Tuple[datetime, str]]:
        """
        Calculate meal times by dividing the day into segments.
        Ensures meals are separated by at least 2 hours.
        
        Args:
            meal_types: List of meal types requested (e.g., ["breakfast", "lunch", "dinner"])
            day_start: Start datetime of the day
            day_end: End datetime of the day
            
        Returns:
            List of tuples (meal_datetime, meal_type) for meals that can be scheduled
        """
        if not meal_types:
            return []
        
        total_minutes = (day_end - day_start).total_seconds() / 60
        num_meals = len(meal_types)
        
        # Need at least 30 min per meal + 120 min separation between meals
        min_required_minutes = (num_meals * 30) + ((num_meals - 1) * self.MIN_MEAL_SEPARATION_MINUTES)
        
        if total_minutes < min_required_minutes:
            # Not enough time for all meals with proper separation
            # Try to fit as many as possible
            scheduled_meals = []
            current_time = day_start
            
            for meal_type in meal_types:
                # Check if we have at least 30 minutes left
                remaining_time = (day_end - current_time).total_seconds() / 60
                
                if remaining_time >= 30:
                    scheduled_meals.append((current_time, meal_type))
                    # Move forward by meal duration (90 min) + separation (120 min)
                    current_time += timedelta(minutes=90 + self.MIN_MEAL_SEPARATION_MINUTES)
                else:
                    # Skip this meal, not enough time
                    break
            
            return scheduled_meals
        
        # Divide the day into segments
        # We have num_meals meals to place across the day
        # Strategy: place meals evenly throughout the day
        
        scheduled_meals = []
        
        # Calculate interval between meals
        # Total time minus meal durations, divided by (num_meals + 1) for spacing
        meal_duration_estimate = 90  # minutes
        available_for_spacing = total_minutes - (num_meals * meal_duration_estimate)
        interval = available_for_spacing / (num_meals + 1)
        
        current_time = day_start + timedelta(minutes=interval)
        
        for i, meal_type in enumerate(meal_types):
            # Check if this meal time is valid (within day bounds)
            if current_time >= day_end:
                break
            
            # Check separation from previous meal (if any)
            if scheduled_meals:
                prev_meal_time = scheduled_meals[-1][0]
                time_since_last_meal = (current_time - prev_meal_time).total_seconds() / 60
                
                if time_since_last_meal < self.MIN_MEAL_SEPARATION_MINUTES:
                    # Try to adjust to minimum separation
                    adjusted_time = prev_meal_time + timedelta(minutes=self.MIN_MEAL_SEPARATION_MINUTES)
                    
                    # Check if adjusted time still fits in the day
                    remaining_after_adjusted = (day_end - adjusted_time).total_seconds() / 60
                    
                    if remaining_after_adjusted >= 30:
                        current_time = adjusted_time
                    else:
                        # Skip this meal
                        continue
            
            scheduled_meals.append((current_time, meal_type))
            
            # Move to next interval
            if i < num_meals - 1:
                current_time += timedelta(minutes=meal_duration_estimate + interval)
        
        return scheduled_meals
    
    def calculate_distance(self, loc1: Location, loc2: Dict[str, float]) -> float:
        """Calculate distance between two locations in kilometers."""
        point1 = (loc1.lat, loc1.lng)
        point2 = (loc2["lat"], loc2["lng"])
        return haversine(point1, point2, unit=Unit.KILOMETERS)
    
    def score_place(
        self,
        place: Dict,
        distance_km: float,
        preferred_categories: List[str]
    ) -> float:
        """
        Calculate score for a place with strong distance weighting.
        Now uses geoapify_categories for matching.
        
        Scoring formula prioritizes proximity:
        - If geoapify_category matches preferences: score = 50 + popularity * 3 - distance_km * 10
        - Otherwise (fallback): score = popularity * 1 - distance_km * 15
        
        This heavily favors nearby places while still respecting user preferences.
        """
        popularity = place.get("popularity", 5)
        place_geoapify_categories = place.get("geoapify_categories", [])
        
        # Check if any geoapify_category matches preferred categories
        # We check for substring match (e.g., "tourism.attraction" matches "tourism")
        category_match = False
        if preferred_categories:
            for pref_cat in preferred_categories:
                for geo_cat in place_geoapify_categories:
                    if pref_cat in geo_cat or geo_cat.startswith(pref_cat):
                        category_match = True
                        break
                if category_match:
                    break
        
        if category_match:
            # Good bonus for preferred categories, but distance is heavily weighted
            score = 100 + (popularity * 3) - (distance_km * 10)
        else:
            # Much weaker score for non-preferred places, distance extremely important
            score = (popularity * 1) - (distance_km * 15)
        
        return score
    
    def is_food_place(self, place: Dict) -> bool:
        """Check if a place is a food/restaurant venue."""
        categories = place.get("categories", [])
        geoapify_categories = place.get("geoapify_categories", [])
        
        # Check if "food" in categories or "catering" in geoapify_categories
        if "food" in categories:
            return True
        
        for geo_cat in geoapify_categories:
            if "catering" in geo_cat:
                return True
        
        return False
    
    def get_candidate_places(
        self,
        current_location: Location,
        date: datetime,
        visited_ids: Set[str],
        preferred_categories: List[str],
        max_distance_km: float = 20.0
    ) -> List[Tuple[Dict, float, float]]:
        """
        Get candidate places based on distance from current location.
        Two-stage recommendation: first from start, then from previous place.
        
        Returns:
            List of tuples (place_dict, distance_km, score)
        """
        candidates = []
        
        # Query all places (we'll filter in memory for simplicity)
        # In production, use MongoDB $geoNear for better performance
        all_places = list(self.db.places.find())
        
        for place in all_places:
            # Skip if already visited
            if place.get("id") in visited_ids:
                continue
            
            # Skip food places (they're handled separately as restaurants)
            if self.is_food_place(place):
                continue
            
            # Check if place has required fields
            if not place.get("lat") or not place.get("lng"):
                continue
            
            # Calculate distance from current location (start or last visited)
            distance_km = self.calculate_distance(
                current_location,
                {"lat": place["lat"], "lng": place["lng"]}
            )
            
            # Skip if too far
            if distance_km > max_distance_km:
                continue
            
            # Check if open at any point during the requested time window
            # We'll check if the place is open at the start time of the day
            # Note: 'date' is a datetime object with the day's start time
            if not self.parser.is_open(place.get("opening_hours"), date):
                continue
            
            # Calculate score
            score = self.score_place(place, distance_km, preferred_categories)
            
            candidates.append((place, distance_km, score))
        
        # Sort by score descending
        candidates.sort(key=lambda x: x[2], reverse=True)
        
        return candidates
    
    def get_restaurant_suggestions(
        self,
        location: Location,
        meal_type: str,
        meal_time: datetime,
        visited_ids: Set[str],
        food_preferences: List[str] = [],
        max_distance_km: float = 5.0,
        limit: int = 5
    ) -> List[Tuple[Dict, float]]:
        """
        Get restaurant suggestions for a specific meal.
        
        Returns:
            List of tuples (restaurant_dict, distance_km)
        """
        suggestions = []
        
        # Default food type preferences by meal type (using startswith logic)
        default_preferences = {
            "breakfast": ["catering.cafe", "catering.bar"],
            "lunch": ["catering.cafe", "catering.bar", "catering.fast_food"],
            "dinner": ["catering.fast_food", "catering.restaurant"],
            "supper": ["catering.restaurant", "catering.pub"]
        }
        
        # Query all places
        all_places = list(self.db.places.find())
        
        for place in all_places:
            # Skip if already visited
            if place.get("id") in visited_ids:
                continue
            
            # Only include food places
            if not self.is_food_place(place):
                continue
            
            # Check if place has required fields
            if not place.get("lat") or not place.get("lng"):
                continue
            
            # Calculate distance
            distance_km = self.calculate_distance(
                location,
                {"lat": place["lat"], "lng": place["lng"]}
            )
            
            # Skip if too far
            if distance_km > max_distance_km:
                continue
            
            # Check if open at meal time
            if not self.parser.is_open(place.get("opening_hours"), meal_time):
                continue
            
            # Check meal suitability
            meal_suitability = self.parser.get_meal_suitability(place.get("opening_hours"))
            
            # Map meal type to suitability key
            suitability_key = {
                "breakfast": "breakfast",
                "lunch": "lunch",
                "dinner": "dinner",
                "supper": "dinner"  # Supper uses dinner suitability
            }.get(meal_type.lower(), "lunch")
            
            if not meal_suitability.get(suitability_key, False):
                continue
            
            place_food_categories = place.get('geoapify_categories', [])
            
            # If user has food preferences, filter strictly by them
            if food_preferences:
                has_preferred_food = any(
                    pref in place_food_categories for pref in food_preferences
                )
                # If user specified preferences but place doesn't match, skip it
                if not has_preferred_food:
                    # Check if it at least matches default preferences for this meal type
                    meal_defaults = default_preferences.get(meal_type.lower(), [])
                    has_default_match = any(
                        any(cat.startswith(default) for default in meal_defaults)
                        for cat in place_food_categories
                    )
                    # Skip if doesn't match user preferences and not a default type
                    if not has_default_match:
                        continue
            
            # Calculate base score
            popularity = place.get('popularity', 5)
            score = (popularity * 2) - (distance_km * 1)
            
            # Highest priority: User's food preferences (if specified)
            if food_preferences:
                if any(pref in place_food_categories for pref in food_preferences):
                    score += 8  # Strong bonus for user preferences
            
            # Secondary priority: Default meal type preferences
            meal_defaults = default_preferences.get(meal_type.lower(), [])
            for cat in place_food_categories:
                for default_pref in meal_defaults:
                    if cat.startswith(default_pref):
                        score += 3  # Moderate bonus for meal type match
                        break
            
            suggestions.append((place, distance_km, score))
        
        # Sort by score descending
        suggestions.sort(key=lambda x: x[2], reverse=True)
        
        # Return top suggestions
        return [(place, dist) for place, dist, score in suggestions[:limit]]
    
    def allocate_places_to_day(
        self,
        candidates: List[Tuple[Dict, float, float]],
        available_minutes: int,
        visited_ids: Set[str]
    ) -> List[Tuple[Dict, float]]:
        """
        Allocate places to a day schedule based on available time.
        
        Returns:
            List of tuples (place_dict, distance_km)
        """
        allocated = []
        remaining_minutes = available_minutes
        
        for place, distance_km, score in candidates:
            # Get visit duration
            visit_duration = self.parser.parse_visit_time(place.get("avg_visit_time"))
            travel_time = calculate_travel_time(distance_km)
            
            total_time_needed = visit_duration + travel_time
            
            # Check if we have enough time
            if total_time_needed <= remaining_minutes:
                allocated.append((place, distance_km))
                visited_ids.add(place.get("id"))
                remaining_minutes -= total_time_needed
                
                # Stop if we have less than 30 minutes left
                if remaining_minutes < 30:
                    break
        
        return allocated
    
    def generate_recommendations(
        self,
        start_location: Location,
        end_location: Location,
        days: List[DayRequest],
        preferred_categories: List[str],
        food_preferences: List[str]
    ) -> List[DaySchedule]:
        """
        Generate complete recommendation schedule.
        Attractions and meals are integrated - meals are inserted when appropriate,
        and subsequent attractions use the meal location as the starting point.
        
        Returns:
            List of DaySchedule objects for each day with timeline
        """
        schedule = []
        visited_ids: Set[str] = set()
        
        for day_request in days:
            # Parse date and times
            try:
                current_date = datetime.strptime(day_request.date, "%Y-%m-%d").date()
                day_start_time = datetime.strptime(day_request.start_time, "%H:%M").time()
                day_end_time = datetime.strptime(day_request.end_time, "%H:%M").time()
            except ValueError:
                continue  # Skip invalid date/time format
            
            day_datetime = datetime.combine(current_date, day_start_time)
            end_of_day = datetime.combine(current_date, day_end_time)
            
            # Calculate meal schedule for the day
            meal_schedule = self.calculate_meal_schedule(
                meal_types=day_request.meals,
                day_start=day_datetime,
                day_end=end_of_day
            )
            
            used_meals = set()
            
            # Generate integrated timeline
            current_location = start_location
            current_time = datetime.combine(current_date, day_start_time)
            
            timeline = []
            
            # Main loop: add attractions and insert meals when appropriate
            while current_time < end_of_day:
                # Check if we should insert a meal now
                should_insert_meal = False
                meal_to_insert = None
                
                for meal_time, meal_type in meal_schedule:
                    if meal_type not in used_meals:
                        # Check if we've reached or passed the scheduled meal time
                        time_diff = (meal_time - current_time).total_seconds() / 60
                        
                        # Insert meal if we're within 30 minutes of the scheduled time
                        # or if we've passed it (to catch up)
                        if -30 <= time_diff <= 30:
                            should_insert_meal = True
                            meal_to_insert = (meal_time, meal_type)
                            break
                
                if should_insert_meal and meal_to_insert:
                    meal_time, meal_type = meal_to_insert
                    
                    # Get restaurant near current location
                    restaurant_tuples = self.get_restaurant_suggestions(
                        location=current_location,
                        meal_type=meal_type,
                        meal_time=current_time,
                        visited_ids=visited_ids,
                        food_preferences=food_preferences,
                        max_distance_km=3.0,
                        limit=1
                    )
                    
                    if restaurant_tuples:
                        rest_dict, distance_km = restaurant_tuples[0]
                        
                        # Calculate meal duration
                        visit_duration = self.parser.adjust_visit_time(
                            rest_dict.get("avg_visit_time"),
                            90,
                            is_food=True
                        )
                        travel_time = calculate_travel_time(distance_km)
                        
                        # Add travel time
                        current_time += timedelta(minutes=travel_time)
                        
                        restaurant = Restaurant(
                            id=rest_dict.get("id", ""),
                            name=rest_dict.get("name", "Unknown"),
                            location=Location(
                                lat=rest_dict.get("lat"),
                                lng=rest_dict.get("lng")
                            ),
                            category=rest_dict.get("categories", []),
                            geoapify_categories=rest_dict.get("geoapify_categories"),
                            popularity=rest_dict.get("popularity"),
                            visit_duration_min=visit_duration,
                            distance_km=round(distance_km, 2),
                            opening_hours=rest_dict.get("opening_hours"),
                            travel_time_min=travel_time,
                            formatted_address=rest_dict.get("formatted_address"),
                            price_level=rest_dict.get("price_level"),
                            meal_type=meal_type
                        )
                        
                        meal_start = current_time.strftime("%H:%M")
                        current_time += timedelta(minutes=visit_duration)
                        meal_end = current_time.strftime("%H:%M")
                        
                        timeline.append(TimelineItem(
                            item_type="meal",
                            scheduled_time=meal_start,
                            end_time=meal_end,
                            place=None,
                            restaurant=restaurant
                        ))
                        
                        visited_ids.add(rest_dict.get("id"))
                        used_meals.add(meal_type)
                        
                        # IMPORTANT: Update location to restaurant for next attraction
                        current_location = Location(
                            lat=rest_dict.get("lat"),
                            lng=rest_dict.get("lng")
                        )
                        continue
                    else:
                        # No restaurant found, mark meal as used
                        used_meals.add(meal_type)
                
                # Try to add an attraction
                time_until_end = (end_of_day - current_time).total_seconds() / 60
                
                # Need at least 45 minutes for an attraction
                if time_until_end < 45:
                    break
                
                # Get candidates based on current location
                candidates = self.get_candidate_places(
                    current_location=current_location,
                    date=day_datetime,
                    visited_ids=visited_ids,
                    preferred_categories=preferred_categories,
                    max_distance_km=20.0
                )
                
                if not candidates:
                    break
                
                # Take the best candidate
                place_dict, distance_km, score = candidates[0]
                travel_time = calculate_travel_time(distance_km)
                
                # Adjust visit duration to fit available time
                visit_duration = self.parser.adjust_visit_time(
                    place_dict.get("avg_visit_time"),
                    int(time_until_end - travel_time),
                    is_food=False
                )
                
                total_time = visit_duration + travel_time
                
                if total_time <= time_until_end:
                    # Add the attraction
                    current_time += timedelta(minutes=travel_time)
                    
                    place = Place(
                        id=place_dict.get("id", ""),
                        name=place_dict.get("name", "Unknown"),
                        location=Location(
                            lat=place_dict.get("lat"),
                            lng=place_dict.get("lng")
                        ),
                        category=place_dict.get("categories", []),
                        popularity=place_dict.get("popularity"),
                        visit_duration_min=visit_duration,
                        distance_km=round(distance_km, 2),
                        opening_hours=place_dict.get("opening_hours"),
                        travel_time_min=travel_time,
                        formatted_address=place_dict.get("formatted_address"),
                        geoapify_categories=place_dict.get("geoapify_categories"),
                        price_level=place_dict.get("price_level")
                    )
                    
                    attraction_start = current_time.strftime("%H:%M")
                    current_time += timedelta(minutes=visit_duration)
                    attraction_end = current_time.strftime("%H:%M")
                    
                    timeline.append(TimelineItem(
                        item_type="attraction",
                        scheduled_time=attraction_start,
                        end_time=attraction_end,
                        place=place,
                        restaurant=None
                    ))
                    
                    visited_ids.add(place_dict.get("id"))
                    
                    # Update location to this place for next iteration
                    current_location = Location(
                        lat=place_dict.get("lat"),
                        lng=place_dict.get("lng")
                    )
                else:
                    break
            
            # Count attractions and meals
            total_attractions = sum(1 for item in timeline if item.item_type == "attraction")
            total_meals = sum(1 for item in timeline if item.item_type == "meal")
            
            # Create day schedule
            day_schedule = DaySchedule(
                date=current_date.strftime("%Y-%m-%d"),
                start_location=start_location,
                end_location=end_location,
                timeline=timeline,
                total_attractions=total_attractions,
                total_meals=total_meals
            )
            
            schedule.append(day_schedule)
        
        return schedule
