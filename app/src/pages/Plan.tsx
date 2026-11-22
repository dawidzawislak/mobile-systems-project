import { useNavigate } from "react-router-dom";
import Content from "../components/common/Content";
import PlanDayCard from "../components/PlanDayCard";
import { useRouteCtx } from "../hooks/useRouteCtx";
import { Button } from "../components/common";
import { PlusIcon } from "../components/icons";
import { useEffect } from "react";

export default function Plan() {
  const { planDays, setBackgroundType, setPlanDays } = useRouteCtx();
  const navigate = useNavigate();

  useEffect(() => {
    setBackgroundType("plan");
  }, [setBackgroundType]);

  return (
    <Content
      header="Tour time"
      sidebar={true}
      buttonNext="Next"
      buttonNextAction={() => navigate("/categories")}
      buttonBack="Back"
      buttonBackAction={() => navigate("/home")}
      className="rounded-tr-3xl"
    >
      <div className="flex flex-col gap-4">
        {planDays.map((plan, index) => (
          <PlanDayCard
            key={index}
            i={index + 1}
            plan={plan}
            onClick={() => navigate(`/new-day/${index}`)}
            onDelete={() => {
              const updatedDays = planDays.filter((_, i) => i !== index);
              setPlanDays(updatedDays);
            }}
          />
        ))}
        {planDays.length === 0 && <p>Click the + button to add a new day.</p>}
        <Button
          variant="secondary"
          fullWidth
          className="border-orange-200 flex justify-center items-center shadow-md hover:bg-orange-50 hover:shadow-lg p-3 text-orange-400 hover:text-orange-500"
          onClick={() => navigate("/new-day/new")}
        >
          <PlusIcon />
        </Button>
      </div>
    </Content>
  );
}
