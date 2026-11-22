export interface Location {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  name: string;
  category: string;
  cuisine: string;
  location: Location;
  rating: number;
}

export type BackgroundType = "location" | "categories" | "plan" | "default";

export interface PlanDay {
  date: string;
  startHour: string;
  endHour: string;
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    supper: boolean;
  };
}

export interface TourDay {
  places: Place[];
  date: string;
}

// Schedule/Timeline types
export interface TimelineLocation {
  lat: number;
  lng: number;
}

export interface TimelinePlace {
  id: string;
  name: string;
  location: TimelineLocation;
  category: string[];
  popularity: number;
  visit_duration_min: number;
  distance_km: number;
  opening_hours: string;
  travel_time_min: number;
  formatted_address: string;
  geoapify_categories: string[];
  price_level: number | null;
}

export interface TimelineRestaurant {
  id: string;
  name: string;
  location: TimelineLocation;
  category: string[];
  geoapify_categories: string[];
  popularity: number;
  visit_duration_min: number;
  distance_km: number;
  opening_hours: string;
  travel_time_min: number;
  formatted_address: string;
  price_level: number;
  meal_type: string;
}

export interface TimelineItem {
  item_type: "meal" | "attraction";
  scheduled_time: string;
  end_time: string;
  place: TimelinePlace | null;
  restaurant: TimelineRestaurant | null;
}

export interface DaySchedule {
  date: string;
  start_location: TimelineLocation;
  end_location: TimelineLocation;
  timeline: TimelineItem[];
  total_attractions: number;
  total_meals: number;
}

export interface ScheduleResponse {
  schedule: DaySchedule[];
  total_days: number;
  total_attractions: number;
}
