"""
Opening hours parser for various formats found in the dataset.
Handles formats like:
- "Mo-Su 10:00-16:00"
- "Tu-Su 09:00-17:00"
- "Mo-Sa 06:30-17:00; Su 07:00-17:30"
- "Apr-Oct Mo-Sa 06:30-18:00; Apr-Oct Su 07:00-18:30"
- "Mo-Sa 08:00-17:00, Su 08:00-15:00"
- "Mo-Su 10:30-18:00; Nov-Mar off"
- null or "closed"
"""
import re
from datetime import datetime, time
from typing import Optional, Dict, List, Tuple

class OpeningHoursParser:
    """Parser for opening hours strings."""
    
    DAYS = {
        'Mo': 0, 'Tu': 1, 'We': 2, 'Th': 3, 'Fr': 4, 'Sa': 5, 'Su': 6
    }
    
    MONTHS = {
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
        'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    }
    
    @classmethod
    def parse_time(cls, time_str: str) -> time:
        """Parse time string like '10:00' or '09:30'."""
        try:
            hours, minutes = map(int, time_str.split(':'))
            return time(hours, minutes)
        except:
            return None
    
    @classmethod
    def parse_day_range(cls, day_str: str) -> List[int]:
        """Parse day range like 'Mo-Fr' or 'Sa' and return list of day numbers."""
        days = []
        
        if '-' in day_str:
            # Range like "Mo-Fr"
            start_day, end_day = day_str.split('-')
            start = cls.DAYS.get(start_day)
            end = cls.DAYS.get(end_day)
            
            if start is not None and end is not None:
                if start <= end:
                    days = list(range(start, end + 1))
                else:
                    # Wrap around week (e.g., Fr-Mo)
                    days = list(range(start, 7)) + list(range(0, end + 1))
        elif ',' in day_str:
            # Multiple days like "Mo,We,Fr"
            for day in day_str.split(','):
                day = day.strip()
                if day in cls.DAYS:
                    days.append(cls.DAYS[day])
        else:
            # Single day
            if day_str in cls.DAYS:
                days = [cls.DAYS[day_str]]
        
        return days
    
    @classmethod
    def parse_month_range(cls, month_str: str) -> Tuple[Optional[int], Optional[int]]:
        """Parse month range like 'Apr-Oct' or 'Nov-Mar'."""
        if '-' in month_str:
            start_month, end_month = month_str.split('-')
            start = cls.MONTHS.get(start_month)
            end = cls.MONTHS.get(end_month)
            return (start, end)
        elif month_str in cls.MONTHS:
            month = cls.MONTHS[month_str]
            return (month, month)
        return (None, None)
    
    @classmethod
    def is_open(cls, opening_hours: Optional[str], check_datetime: datetime) -> bool:
        """
        Check if a place is open at the given datetime.
        
        Args:
            opening_hours: Opening hours string from the dataset
            check_datetime: DateTime to check
            
        Returns:
            True if open, False if closed or unable to parse
        """
        # Handle null or closed
        if not opening_hours or opening_hours == "closed":
            return False
        
        opening_hours = opening_hours.strip()
        
        # Handle special case "24/7"
        if opening_hours == "24/7" or opening_hours == "Mo-Su 00:00-24:00":
            return True
        
        check_day = check_datetime.weekday()
        check_time = check_datetime.time()
        check_month = check_datetime.month
        
        # Split by semicolon or comma for multiple rules
        rules = re.split(r'[;,]', opening_hours)
        
        for rule in rules:
            rule = rule.strip()
            
            if not rule or rule.lower() == 'off':
                continue
            
            # Check if rule contains seasonal information
            month_match = re.match(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:-(\w+))?:?\s*(.+)', rule)
            
            if month_match:
                start_month_str = month_match.group(1)
                end_month_str = month_match.group(2) or start_month_str
                rest_of_rule = month_match.group(3)
                
                start_month = cls.MONTHS.get(start_month_str)
                end_month = cls.MONTHS.get(end_month_str)
                
                if start_month and end_month:
                    # Check if current month is in range
                    in_season = False
                    if start_month <= end_month:
                        in_season = start_month <= check_month <= end_month
                    else:
                        # Wrap around year (e.g., Nov-Mar)
                        in_season = check_month >= start_month or check_month <= end_month
                    
                    if not in_season:
                        continue
                    
                    rule = rest_of_rule
            
            # Parse day and time pattern: "Mo-Fr 08:00-20:00"
            pattern = r'((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:[-,](?:Mo|Tu|We|Th|Fr|Sa|Su))*)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})'
            match = re.search(pattern, rule)
            
            if match:
                day_str = match.group(1)
                start_time_str = match.group(2)
                end_time_str = match.group(3)
                
                days = cls.parse_day_range(day_str)
                
                if check_day in days:
                    start_time = cls.parse_time(start_time_str)
                    end_time = cls.parse_time(end_time_str)
                    
                    if start_time and end_time:
                        # Handle times that cross midnight
                        if end_time < start_time:
                            # e.g., 22:00-02:00
                            if check_time >= start_time or check_time <= end_time:
                                return True
                        else:
                            # Normal case
                            if start_time <= check_time <= end_time:
                                return True
        
        return False
    
    @classmethod
    def get_meal_suitability(cls, opening_hours: Optional[str]) -> Dict[str, bool]:
        """
        Determine which meal times a place is suitable for.
        
        Returns:
            Dict with breakfast, lunch, dinner booleans
        """
        result = {
            "breakfast": False,
            "lunch": False,
            "dinner": False
        }
        
        if not opening_hours or opening_hours == "closed":
            return result
        
        opening_hours = opening_hours.strip()
        
        # Handle 24/7
        if opening_hours == "24/7" or opening_hours == "Mo-Su 00:00-24:00":
            return {"breakfast": True, "lunch": True, "dinner": True}
        
        # Extract all time ranges
        time_pattern = r'(\d{1,2}:\d{2})-(\d{1,2}:\d{2})'
        matches = re.findall(time_pattern, opening_hours)
        
        for start_str, end_str in matches:
            start_time = cls.parse_time(start_str)
            end_time = cls.parse_time(end_str)
            
            if start_time and end_time:
                # Breakfast: opens before 09:00
                if start_time <= time(9, 0):
                    result["breakfast"] = True
                
                # Lunch: open between 11:00-15:00
                lunch_start = time(11, 0)
                lunch_end = time(15, 0)
                if (start_time <= lunch_start and end_time >= lunch_end) or \
                   (start_time <= lunch_end and end_time >= lunch_start):
                    result["lunch"] = True
                
                # Dinner: open between 18:00-23:00
                dinner_start = time(18, 0)
                dinner_end = time(23, 0)
                if (start_time <= dinner_start and end_time >= dinner_end) or \
                   (start_time <= dinner_end and end_time >= dinner_start):
                    result["dinner"] = True
        
        return result
    
    @classmethod
    def parse_visit_time(cls, avg_visit_time: Optional[str]) -> int:
        """
        Parse avg_visit_time string like "60-90 min" and return average in minutes.
        
        Returns:
            Average visit time in minutes, or 60 as default
        """
        if not avg_visit_time:
            return 60  # Default 1 hour
        
        # Extract numbers from string like "60-90 min" or "30-45 min"
        numbers = re.findall(r'\d+', avg_visit_time)
        
        if len(numbers) >= 2:
            # Take average of range
            return (int(numbers[0]) + int(numbers[1])) // 2
        elif len(numbers) == 1:
            return int(numbers[0])
        
        return 60  # Default fallback
    
    @classmethod
    def get_visit_time_range(cls, avg_visit_time: Optional[str], is_food: bool = False) -> Tuple[int, int]:
        """
        Get minimum and maximum visit time from avg_visit_time string.
        
        Args:
            avg_visit_time: String like "60-90 min" from database
            is_food: True if this is a food place, False for attractions
            
        Returns:
            Tuple of (min_minutes, max_minutes)
            
        Defaults:
            - Attractions: 30 min to 120 min
            - Food: 60 min to 120 min
        """
        # Set defaults based on place type
        if is_food:
            default_min, default_max = 60, 120
        else:
            default_min, default_max = 30, 120
        
        if not avg_visit_time:
            return (default_min, default_max)
        
        # Extract numbers from string like "60-90 min" or "30-45 min"
        numbers = re.findall(r'\d+', avg_visit_time)
        
        if len(numbers) >= 2:
            # Use the range from database
            min_time = int(numbers[0])
            max_time = int(numbers[1])
            return (max(min_time, default_min), min(max_time, default_max))
        elif len(numbers) == 1:
            # Single value - use it as midpoint with default range
            midpoint = int(numbers[0])
            return (max(default_min, midpoint - 15), min(default_max, midpoint + 15))
        
        return (default_min, default_max)
    
    @classmethod
    def adjust_visit_time(cls, avg_visit_time: Optional[str], available_minutes: int, is_food: bool = False) -> int:
        """
        Adjust visit time to fit available time while respecting min/max constraints.
        
        Args:
            avg_visit_time: String from database
            available_minutes: Time available in schedule
            is_food: True if food place, False for attraction
            
        Returns:
            Adjusted visit time in minutes
        """
        min_time, max_time = cls.get_visit_time_range(avg_visit_time, is_food)
        
        # Clamp available time to min/max range
        adjusted = max(min_time, min(available_minutes, max_time))
        
        return adjusted


def calculate_travel_time(distance_km: float) -> int:
    """
    Calculate travel time in minutes based on walking speed.
    Assumes 15 minutes per kilometer.
    
    Args:
        distance_km: Distance in kilometers
        
    Returns:
        Travel time in minutes
    """
    return int(distance_km * 15)
