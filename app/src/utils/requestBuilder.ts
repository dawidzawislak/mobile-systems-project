import type { RecommendRequest, DayRequest } from "./api";
import type { PlanDay, Location } from "../types/models";

/**
 * Converts a meals object to an array of meal type strings
 */
export function convertMealsToArray(meals: {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  supper: boolean;
}): string[] {
  const mealTypes: string[] = [];
  if (meals.breakfast) mealTypes.push("breakfast");
  if (meals.lunch) mealTypes.push("lunch");
  if (meals.dinner) mealTypes.push("dinner");
  if (meals.supper) mealTypes.push("supper");
  return mealTypes;
}

/**
 * Converts plan days to API day request format
 */
export function convertPlanDaysToDayRequests(planDays: PlanDay[]): DayRequest[] {
  return planDays.map(day => ({
    date: day.date,
    start_time: day.startHour,
    end_time: day.endHour,
    meals: convertMealsToArray(day.meals),
  }));
}

/**
 * Converts cuisine types to food preference category paths
 */
export function convertCuisineTypesToFoodPreferences(cuisineTypes: string[]): string[] {
  return cuisineTypes.map(cuisine => `catering.restaurant.${cuisine}`);
}

/**
 * Builds a recommendation request from user selections
 */
export function buildRecommendRequest(
  homeLocation: Location,
  planDays: PlanDay[],
  placeCategories: string[],
  cuisineTypes: string[]
): RecommendRequest {
  const days = convertPlanDaysToDayRequests(planDays);
  const foodPreferences = convertCuisineTypesToFoodPreferences(cuisineTypes);

  return {
    start_location: {
      lat: homeLocation.latitude,
      lng: homeLocation.longitude,
    },
    end_location: {
      lat: homeLocation.latitude,
      lng: homeLocation.longitude,
    },
    days,
    preferred_categories: placeCategories,
    food_preferences: foodPreferences,
  };
}
