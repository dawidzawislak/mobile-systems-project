import type { TimelineItem as TimelineItemType } from "../types/models";

interface TimelineItemProps {
  item: TimelineItemType;
  isFirst: boolean;
  isLast: boolean;
  onClick?: () => void;
}

export default function TimelineItem({
  item,
  isFirst,
  isLast,
  onClick,
}: TimelineItemProps) {
  const isMeal = item.item_type === "meal";
  const data = isMeal ? item.restaurant : item.place;

  if (!data) return null;

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM format
  };

  const getMealLabel = () => {
    if (!isMeal || !item.restaurant) return "";
    const mealType = item.restaurant.meal_type;
    const mealLabels: Record<string, string> = {
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
      supper: "Supper",
    };
    return mealLabels[mealType] || mealType;
  };

  return (
    <div className="relative flex items-start">
      {/* Timeline line */}
      <div className="relative flex flex-col items-center mr-4">
        {isFirst ? (
          <>
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white z-10  -mt-14"></div>
            <div className="w-0.5 h-14 bg-gray-300"></div>
          </>
        ) : (
          <div className="w-0.5 h-16 bg-gray-300 -mt-14"></div>
        )}

        {/* Dot */}
        <div className="w-3 h-3 rounded-full bg-gray-600 border-2 border-white z-10"></div>

        {/* Bottom line */}
        {!isLast && <div className="w-0.5 flex-1 bg-gray-300 mt-1"></div>}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        {/* Travel info before this location */}
        {!isFirst && (
          <div className="mb-2 text-sm text-gray-500">
            <div>
              {data.distance_km.toFixed(2)} km • {data.travel_time_min} min
            </div>
          </div>
        )}

        {/* Main card */}
        <div 
          className="bg-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:bg-gray-300 transition-colors"
          onClick={onClick}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">
              {formatTime(item.scheduled_time)}
            </span>
            <span className="text-sm text-gray-600">
              {data.visit_duration_min} min
            </span>
          </div>

          <div className="font-semibold text-base mb-1">{data.name}</div>

          {isMeal && item.restaurant && (
            <div className="text-sm text-gray-700 font-medium">
              {getMealLabel()}
            </div>
          )}

          {!isMeal && item.place && (
            <div className="text-sm text-gray-600 mt-1">
              {item.place.category.join(" • ")}
            </div>
          )}
        </div>

        {/* End time indicator */}
        <div className="mt-1 text-sm text-gray-500">
          End: {formatTime(item.end_time)}
        </div>
      </div>
    </div>
  );
}
