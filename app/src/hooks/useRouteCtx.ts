import { useContext } from "react";
import { RouteContext } from "../context/RouteContext";

export const useRouteCtx = () => {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error("useRoute must be used within a RouteProvider");
  }
  return context;
};
