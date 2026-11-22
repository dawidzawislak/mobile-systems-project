import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface DaySelectorProps {
  currentDay: number;
  totalDays: number;
  date: string;
  onPreviousDay: () => void;
  onNextDay: () => void;
}

export default function DaySelector({
  currentDay,
  totalDays,
  date,
  onPreviousDay,
  onNextDay,
}: DaySelectorProps) {
  const canGoPrevious = currentDay > 0;
  const canGoNext = currentDay < totalDays - 1;

  const formatDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onPreviousDay}
        disabled={!canGoPrevious}
        className={`p-2 rounded-lg transition-colors ${
          canGoPrevious
            ? "hover:bg-gray-100 text-gray-700 cursor-pointer"
            : "text-gray-300 cursor-not-allowed"
        }`}
        aria-label="Previous day"
      >
        <ChevronLeftIcon size={32} />
      </button>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          Day {currentDay + 1}
        </div>
        <div className="text-sm text-gray-600">
          {formatDate(date)}
        </div>
      </div>
      
      <button
        onClick={onNextDay}
        disabled={!canGoNext}
        className={`p-2 rounded-lg transition-colors ${
          canGoNext
            ? "hover:bg-gray-100 text-gray-700 cursor-pointer"
            : "text-gray-300 cursor-not-allowed"
        }`}
        aria-label="Next day"
      >
        <ChevronRightIcon size={32} />
      </button>
    </div>
  );
}
