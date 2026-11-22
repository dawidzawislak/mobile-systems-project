import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TimelineItem from "../components/TimelineItem";
import { Button, Heading, Modal } from "../components/common";
import { useRouteCtx } from "../hooks/useRouteCtx";
import DaySelector from "../components/DaySelector";
import Content from "../components/common/Content";
import type { TimelineItem as TimelineItemType } from "../types/models";

export default function Schedule() {
  const { schedule, setBackgroundType } = useRouteCtx();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDay, setSelectedDay] = useState(
    (location.state as { selectedDay?: number })?.selectedDay ?? 0
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    item: TimelineItemType;
    index: number;
  } | null>(null);

  useEffect(() => {
    setBackgroundType("default");
  }, [setBackgroundType]);

  if (schedule.length === 0) {
    return (
      <div className="h-full flex items-center justify-center flex-col gap-4 p-4 text-center">
        <div className="text-xl text-gray-600">No scheduled days</div>
        <Button onClick={() => navigate("/home")} fullWidth variant="primary">
          Start planning
        </Button>
      </div>
    );
  }

  const currentDaySchedule = schedule[selectedDay];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <Content
      header="Route Schedule"
      sidebar={false}
      buttonNextAction={() => navigate("/map", { state: { selectedDay } })}
      buttonNext="View map"
      buttonBack="Change plan"
      buttonBackAction={() => navigate("/categories")}
    >
      <DaySelector
        currentDay={selectedDay}
        totalDays={schedule.length}
        date={currentDaySchedule.date}
        onPreviousDay={() => setSelectedDay(selectedDay - 1)}
        onNextDay={() => setSelectedDay(selectedDay + 1)}
      />

      <div className="max-w-3xl mx-auto pt-4">
        <Heading level={2} className="mb-6 text-center tracking-wider">
          Plan for {formatDate(currentDaySchedule.date)}
        </Heading>

        {/* Timeline */}
        <div className="relative">
          {/* Start point */}
          <div className="relative flex items-start mb-8">
            <div className="relative flex flex-col items-center mr-4">
              <div className="w-4 h-4 rounded-full bg-transparent border-2 border-white z-10"></div>
              <div className="w-0.5 flex-1 bg-gray-300 mt-1"></div>
            </div>
            <div className="flex-1">
              <div className="bg-green-100 rounded-lg p-4 shadow-sm border-2 border-green-500">
                <div className="font-bold text-lg mb-1">🏠 Start</div>
                {currentDaySchedule.timeline.length > 0 && (
                  <div className="text-sm text-gray-500 mt-2">
                    {currentDaySchedule.timeline[0].scheduled_time} - Start of
                    route
                  </div>
                )}
              </div>
            </div>
          </div>

          {currentDaySchedule.timeline.map((item, index) => (
            <TimelineItem
              key={`${item.scheduled_time}-${index}`}
              item={item}
              isFirst={index === 0}
              isLast={index === currentDaySchedule.timeline.length - 1}
              onClick={() => {
                setSelectedItem({ item, index });
                setModalOpen(true);
              }}
            />
          ))}

          {/* End point */}
          <div className="relative flex items-start mt-4">
            <div className="relative flex flex-col items-center mr-4">
              <div className="w-0.5 h-16 bg-gray-300 -mt-16"></div>
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white z-10"></div>
            </div>
            <div className="flex-1">
              <div className="bg-red-100 rounded-lg p-4 shadow-sm border-2 border-red-500">
                <div className="font-bold text-lg mb-1">🏁 Return home</div>
                {currentDaySchedule.timeline.length > 0 && (
                  <div className="text-sm text-gray-500 mt-2">
                    {
                      currentDaySchedule.timeline[
                        currentDaySchedule.timeline.length - 1
                      ].end_time
                    }{" "}
                    - End of route
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {currentDaySchedule.total_attractions}
              </div>
              <div className="text-sm text-gray-600">Attractions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {currentDaySchedule.total_meals}
              </div>
              <div className="text-sm text-gray-600">Meals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {currentDaySchedule.timeline.length}
              </div>
              <div className="text-sm text-gray-600">Total stops</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for place details */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          selectedItem
            ? selectedItem.item.item_type === "meal"
              ? "Meal Stop"
              : "Attraction"
            : "Details"
        }
      >
        {selectedItem && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-2">
                {selectedItem.item.item_type === "meal"
                  ? selectedItem.item.restaurant?.name
                  : selectedItem.item.place?.name}
              </h3>
              <p className="text-gray-600">
                Stop #{selectedItem.index + 1} of{" "}
                {currentDaySchedule.timeline.length}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Scheduled Time</div>
                <div className="font-semibold">
                  {selectedItem.item.scheduled_time}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">End Time</div>
                <div className="font-semibold">
                  {selectedItem.item.end_time}
                </div>
              </div>
            </div>

            {selectedItem.item.item_type === "meal" &&
              selectedItem.item.restaurant && (
                <>
                  <div>
                    <div className="text-sm text-gray-600">Meal Type</div>
                    <div className="font-semibold capitalize">
                      {selectedItem.item.restaurant.meal_type}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Address</div>
                    <div>
                      {selectedItem.item.restaurant.formatted_address || "N/A"}
                    </div>
                  </div>
                  {selectedItem.item.restaurant.price_level && (
                    <div>
                      <div className="text-sm text-gray-600">Price Level</div>
                      <div>
                        {"$".repeat(selectedItem.item.restaurant.price_level)}
                      </div>
                    </div>
                  )}
                </>
              )}

            {selectedItem.item.item_type === "attraction" &&
              selectedItem.item.place && (
                <>
                  <div>
                    <div className="text-sm text-gray-600">Categories</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedItem.item.place.category.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Address</div>
                    <div>
                      {selectedItem.item.place.formatted_address || "N/A"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">
                        Visit Duration
                      </div>
                      <div className="font-semibold">
                        {selectedItem.item.place.visit_duration_min} min
                      </div>
                    </div>
                  </div>
                </>
              )}

            <div>
              <div className="text-sm text-gray-600">Opening Hours</div>
              <div className="text-sm">
                {selectedItem.item.item_type === "meal"
                  ? selectedItem.item.restaurant?.opening_hours || "N/A"
                  : selectedItem.item.place?.opening_hours || "N/A"}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Content>
  );
}
