import { useNavigate } from "react-router-dom";
import { Button } from "../components/common";

const steps = [
  {
    icon: "📍",
    title: "Set your base",
    text: "Pick your hotel or apartment on the map. Every day starts and ends there.",
  },
  {
    icon: "🗓️",
    title: "Plan your days",
    text: "Choose sightseeing hours for each day and which meals to include.",
  },
  {
    icon: "💬",
    title: "Tell us what you like",
    text: "Pick categories or just describe your interests and favourite cuisine in your own words.",
  },
  {
    icon: "🗺️",
    title: "Get your itinerary",
    text: "Get a schedule for each day with attractions, restaurants and a walking route on the map.",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto bg-white text-gray-600">
      <div className="min-h-full flex flex-col justify-center gap-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Your personal trip planner
          </h1>
          <p className="mt-2 text-lg">
            Plan a multi-day trip that fits your interests, your schedule and
            your appetite.
          </p>
        </div>

        <ul className="flex flex-col gap-4">
          {steps.map((step) => (
            <li key={step.title} className="flex items-start gap-3">
              <span className="text-2xl leading-none" aria-hidden="true">
                {step.icon}
              </span>
              <div>
                <div className="font-semibold text-gray-800">{step.title}</div>
                <div className="text-sm">{step.text}</div>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-center text-sm">
          We pick places by popularity, distance and opening hours, so every
          day stays realistic.
        </p>

        <Button
          onClick={() => navigate("/home")}
          fullWidth
          variant="primary"
          className="text-xl"
        >
          Start planning
        </Button>
      </div>
    </div>
  );
}
