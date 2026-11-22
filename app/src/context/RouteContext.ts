import { createContext } from "react";
import type {
  Location,
  PlanDay,
  TourDay,
  DaySchedule,
  BackgroundType,
} from "../types/models";

export interface RouteContextType {
  homeLocation: Location;
  planDays: PlanDay[];
  placeCategories: string[];
  cuisineTypes: string[];
  setHomeLocation: (location: Location) => void;
  setPlanDays: (planDays: PlanDay[]) => void;
  setPlaceCategories: (placeCategories: string[]) => void;
  setCuisineTypes: (cuisineTypes: string[]) => void;
  tourDays: TourDay[];
  setTourDays: (tourDays: TourDay[]) => void;
  schedule: DaySchedule[];
  setSchedule: (schedule: DaySchedule[]) => void;
  backgroundType: BackgroundType;
  setBackgroundType: (type: BackgroundType) => void;
}

export const RouteContext = createContext<RouteContextType | undefined>(
  undefined
);
