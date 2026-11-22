import type { PlanDay } from "../types/models";
import { Heading } from "./common";
import { EggIcon, SaladIcon, SandwichIcon, SoupIcon, TrashIcon } from "./icons";

interface PlanDayCardProps {
  i: number;
  plan: PlanDay;
  onClick?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}

export default function PlanDayCard({
  i,
  plan,
  onClick,
  onDelete,
}: PlanDayCardProps) {
  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden flex relative shadow-md cursor-pointer">
      <div
        className="bg-red-400 text-white p-4 flex items-center hover:bg-red-500"
        onClick={onDelete}
      >
        <TrashIcon />
      </div>
      <div className="w-full" onClick={onClick}>
        <div className="p-2">
          <Heading level={2}>Day {i}</Heading>
          <div className="text-lg">{plan.date}</div>
          <div className="text-md">
            {plan.startHour} - {plan.endHour}
          </div>
        </div>
      </div>
      <div className="absolute right-0 p-2 flex gap-1 text-gray-300">
        <span className={plan.meals.breakfast ? "text-orange-400" : ""}>
          <EggIcon />
        </span>
        <span className={plan.meals.lunch ? "text-orange-400" : ""}>
          <SandwichIcon />
        </span>
        <span className={plan.meals.dinner ? "text-orange-400" : ""}>
          <SoupIcon />
        </span>
        <span className={plan.meals.supper ? "text-orange-400" : ""}>
          <SaladIcon />
        </span>
      </div>
    </div>
  );
}
