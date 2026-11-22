import { useNavigate } from "react-router-dom";
import { useRouteCtx } from "../hooks/useRouteCtx";
import { Button } from "../components/common";
import { useEffect } from "react";
import homePageImage from "../assets/hp-img.jpg";

export default function Plan() {
  const { setBackgroundType } = useRouteCtx();
  const navigate = useNavigate();

  useEffect(() => {
    setBackgroundType("default");
  }, [setBackgroundType]);

  return (
    <div className="h-full flex items-center justify-center flex-col gap-8 p-4 bg-white text-xl text-gray-600 text-center">
      <div className="">
        Enrich your ✨ <strong>trip experience</strong> ✨ with places only
        locals know!
      </div>
      <img src={homePageImage} alt="Home Page" className="w-[50%]" />
      <div>
        Let us know about your preferences so we can tailor the best
        recommendations just for you.
      </div>
      <Button
        onClick={() => navigate("/home")}
        fullWidth
        variant="primary"
        className="text-xl"
      >
        Start planning
      </Button>
    </div>
  );
}
