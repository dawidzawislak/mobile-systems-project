import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Content from "../components/common/Content";
import { useRouteCtx } from "../hooks/useRouteCtx";
import type { PlanDay } from "../types/models";

export default function NewDay() {
  const { setPlanDays, planDays, setBackgroundType } = useRouteCtx();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    setBackgroundType("plan");
  }, [setBackgroundType]);

  // Get current date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  // Compute initial form data based on id parameter
  const initialFormData = useMemo(() => {
    if (id && id !== "new") {
      const dayIndex = parseInt(id);
      if (!isNaN(dayIndex) && dayIndex >= 0 && dayIndex < planDays.length) {
        return planDays[dayIndex];
      }
    }
    let defaultDate = today;

    if (planDays.length > 0) {
      const lastDateStr = planDays[planDays.length - 1].date;
      const lastDate = new Date(lastDateStr);
      lastDate.setDate(lastDate.getDate() + 1);
      defaultDate = lastDate.toISOString().split("T")[0];
    }
    return {
      date: defaultDate,
      startHour: "08:00",
      endHour: "19:00",
      meals: {
        breakfast: false,
        lunch: false,
        dinner: false,
        supper: false,
      },
    };
  }, [id, planDays]);

  const [formData, setFormData] = useState(initialFormData);

  // Check if selected date is today
  const isToday = useMemo(
    () => formData.date === today,
    [formData.date, today]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const saveDay = () => {
    if (id === "new" || !id) {
      // Add new day
      setPlanDays([...planDays, formData as PlanDay]);
    } else {
      // Edit existing day
      const dayIndex = parseInt(id);
      if (!isNaN(dayIndex) && dayIndex >= 0 && dayIndex < planDays.length) {
        const updatedPlanDays = [...planDays];
        updatedPlanDays[dayIndex] = formData as PlanDay;
        setPlanDays(updatedPlanDays);
      }
    }
    navigate("/plan");
  };

  const isEditing = id && id !== "new";

  return (
    <Content
      header={isEditing ? "Edit day plan" : "New day plan"}
      sidebar={true}
      buttonNext={isEditing ? "Save" : "Add"}
      buttonNextAction={saveDay}
      buttonBack="Back"
      buttonBackAction={() => navigate("/plan")}
      className="rounded-tr-3xl"
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1 text-xl" htmlFor="date">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            min={today}
            className="w-full p-2 border border-gray-300 rounded-lg text-lg"
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, date: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block mb-1 text-xl" htmlFor="startHour">
            Start Time
          </label>
          <input
            type="time"
            id="startHour"
            className="w-full p-2 border border-gray-300 rounded-lg text-lg"
            value={formData.startHour}
            onChange={(e) => {
              const selectedTime = e.target.value;
              if (isToday) {
                const now = new Date();
                const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                if (selectedTime < currentTime) {
                  return; // Nie pozwalaj na wybór wcześniejszej godziny
                }
              }
              setFormData((prev) => ({
                ...prev,
                startHour: selectedTime,
              }));
            }}
          />
        </div>
        <div>
          <label className="block mb-1 text-xl" htmlFor="endHour">
            End Time
          </label>
          <input
            type="time"
            id="endHour"
            className="w-full p-2 border border-gray-300 rounded-lg text-lg"
            value={formData.endHour}
            onChange={(e) => {
              const selectedTime = e.target.value;
              if (isToday) {
                const now = new Date();
                const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                if (selectedTime < currentTime) {
                  return; // Nie pozwalaj na wybór wcześniejszej godziny
                }
              }
              setFormData((prev) => ({ ...prev, endHour: selectedTime }));
            }}
          />
        </div>
        <div>
          <span className="block mb-1 mt-2 text-xl">Meals</span>
          {["breakfast", "lunch", "dinner", "supper"].map((meal) => (
            <div
              key={meal}
              className="block text-lg flex items-center mb-0.5 pointer-events-none"
            >
              <input
                type="checkbox"
                className="ml-4 w-4 h-4 pointer-events-auto"
                checked={formData.meals[meal as keyof typeof formData.meals]}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    meals: {
                      ...prev.meals,
                      [meal]: e.target.checked,
                    },
                  }))
                }
              />
              <span className="ml-2 select-none">
                {meal.charAt(0).toUpperCase() + meal.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </form>
    </Content>
  );
}
