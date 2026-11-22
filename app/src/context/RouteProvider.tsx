import { useState, type ReactNode } from "react";
import { RouteContext } from "./RouteContext";
import type {
  Location,
  PlanDay,
  TourDay,
  DaySchedule,
  BackgroundType,
} from "../types/models";

export function RouteProvider({ children }: { children: ReactNode }) {
  const [homeLocation, setHomeLocation] = useState<Location>({
    latitude: 0,
    longitude: 0,
  });
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [placeCategories, setPlaceCategories] = useState<string[]>([]);
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [tourDays, setTourDays] = useState<TourDay[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [backgroundType, setBackgroundType] =
    useState<BackgroundType>("default");

  return (
    <RouteContext.Provider
      value={{
        homeLocation,
        planDays,
        placeCategories,
        cuisineTypes,
        setHomeLocation,
        setPlanDays,
        setPlaceCategories,
        setCuisineTypes,
        tourDays,
        setTourDays,
        schedule,
        setSchedule,
        backgroundType,
        setBackgroundType,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
}
