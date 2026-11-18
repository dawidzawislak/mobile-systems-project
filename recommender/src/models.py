"""
Pydantic models for recommendation API.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class Location(BaseModel):
    """Geographic location."""
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")


class DayRequest(BaseModel):
    """Configuration for a single day of the trip."""
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    start_time: str = Field(..., description="Trip start time for this day in HH:MM format")
    end_time: str = Field(..., description="Trip end time for this day in HH:MM format")
    meals: List[str] = Field(
        default=[],
        description="List of meal types for this day: breakfast, lunch, dinner, supper"
    )


class RecommendRequest(BaseModel):
    """Request model for recommendations."""
    start_location: Location = Field(..., description="Starting location coordinates")
    end_location: Location = Field(..., description="Ending location coordinates")
    days: List[DayRequest] = Field(..., description="Configuration for each day of the trip")
    preferred_categories: List[str] = Field(
        default=[],
        description="Preferred place categories (e.g., 'history', 'architecture', 'art')"
    )
    food_preferences: List[str] = Field(
        default=[],
        description="Preferred food categories (e.g., 'catering.restaurant.italian', 'catering.cafe')"
    )


class Place(BaseModel):
    """Place information in response."""
    id: str = Field(..., description="Unique place identifier")
    name: str = Field(..., description="Place name")
    location: Location = Field(..., description="Place coordinates")
    category: List[str] = Field(..., description="Place categories")
    popularity: Optional[int] = Field(None, description="Popularity score (5-10)")
    visit_duration_min: int = Field(..., description="Recommended visit duration in minutes")
    distance_km: float = Field(..., description="Distance from start/end location in kilometers")
    opening_hours: Optional[str] = Field(None, description="Opening hours string")
    travel_time_min: int = Field(..., description="Estimated travel time to this place in minutes")
    formatted_address: Optional[str] = Field(None, description="Full address")
    geoapify_categories: Optional[List[str]] = Field(None, description="Detailed categories")
    price_level: Optional[int] = Field(None, description="Price level (0=free, 1-3=paid)")


class Restaurant(BaseModel):
    """Restaurant information in response."""
    id: str = Field(..., description="Unique restaurant identifier")
    name: str = Field(..., description="Restaurant name")
    location: Location = Field(..., description="Restaurant coordinates")
    category: List[str] = Field(..., description="Restaurant categories")
    geoapify_categories: Optional[List[str]] = Field(None, description="Detailed categories (e.g., catering.restaurant.italian)")
    popularity: Optional[int] = Field(None, description="Popularity score")
    visit_duration_min: int = Field(..., description="Expected meal duration in minutes")
    distance_km: float = Field(..., description="Distance from current location in kilometers")
    opening_hours: Optional[str] = Field(None, description="Opening hours")
    travel_time_min: int = Field(..., description="Estimated travel time in minutes")
    formatted_address: Optional[str] = Field(None, description="Full address")
    price_level: Optional[int] = Field(None, description="Price level")
    meal_type: str = Field(..., description="breakfast, lunch, dinner, or supper")


class TimelineItem(BaseModel):
    """Single item in the daily timeline."""
    item_type: str = Field(..., description="Type: 'attraction' or 'meal'")
    scheduled_time: str = Field(..., description="Scheduled time in HH:MM format")
    end_time: str = Field(..., description="Expected end time in HH:MM format")
    place: Optional[Place] = Field(None, description="Place details if item_type is 'attraction'")
    restaurant: Optional[Restaurant] = Field(None, description="Restaurant details if item_type is 'meal'")


class DaySchedule(BaseModel):
    """Schedule for a single day."""
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    start_location: Location = Field(..., description="Starting location for this day")
    end_location: Location = Field(..., description="Ending location for this day (usually home)")
    timeline: List[TimelineItem] = Field(..., description="Chronological timeline of attractions and meals")
    total_attractions: int = Field(..., description="Number of attractions in this day")
    total_meals: int = Field(..., description="Number of meals in this day")


class RecommendResponse(BaseModel):
    """Response model for recommendations."""
    schedule: List[DaySchedule] = Field(..., description="Daily schedule for the entire trip")
    total_days: int = Field(..., description="Total number of days in the trip")
    total_attractions: int = Field(..., description="Total number of attractions recommended")
