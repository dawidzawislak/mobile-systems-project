import { Link, useLocation } from "react-router-dom";

const STEPS = [
  { label: "Location", match: (p: string) => p === "/home" },
  {
    label: "Tour time",
    match: (p: string) => p === "/plan" || p.startsWith("/new-day"),
  },
  { label: "Categories", match: (p: string) => p === "/categories" },
];

function Stepper({ current }: { current: number }) {
  return (
    <nav className="px-4 pb-3">
      <ol className="flex items-center gap-2 text-xs font-medium">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.label} className="contents">
              {i > 0 && <span className="flex-1 h-px bg-gray-200" />}
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    done
                      ? "bg-orange-200 text-orange-700"
                      : active
                      ? "bg-orange-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className={active ? "text-gray-800" : "text-gray-400"}>
                  {step.label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const currentStep = STEPS.findIndex((s) => s.match(pathname));

  return (
    <header className="flex-shrink-0 bg-white border-b border-gray-200">
      <div className="h-16 px-4 flex items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
          </span>
          <span className="text-xl font-bold tracking-tight text-gray-700">
            Trip<span className="text-orange-600">Planner</span>
          </span>
        </Link>
      </div>
      {currentStep !== -1 && <Stepper current={currentStep} />}
    </header>
  );
}
