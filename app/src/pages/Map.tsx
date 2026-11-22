import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRouteCtx } from "../hooks/useRouteCtx";
import { Modal } from "../components/common";
import DaySelector from "../components/DaySelector";
import type { TimelineItem } from "../types/models";
import Content from "../components/common/Content";

// Fix for default marker icon in Leaflet
// @ts-expect-error - TS might complain about missing properties on prototype or the delete operator
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY as string;

// Custom icons for different markers
const homeIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function Map() {
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);
  const { schedule } = useRouteCtx();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDay, setSelectedDay] = useState(
    (location.state as { selectedDay?: number })?.selectedDay ?? 0
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    item: TimelineItem;
    index: number;
  } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    if (schedule.length === 0) {
      navigate("/schedule");
      return;
    }

    if (!mapRef.current) {
      const map = L.map("route-map").setView([50.0647, 19.945], 13);
      mapRef.current = map;

      L.tileLayer(
        `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${API_KEY}`,
        {
          attribution: "Powered by Geoapify | © OpenStreetMap contributors",
          maxZoom: 20,
        }
      ).addTo(map);
    }

    // Clear existing markers and route
    if (mapRef.current) {
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.GeoJSON) {
          mapRef.current?.removeLayer(layer);
        }
      });
    }

    renderRouteWithGeoapify();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [selectedDay, schedule]);

  const renderRouteWithGeoapify = async () => {
    if (!mapRef.current || schedule.length === 0) return;

    const currentDaySchedule = schedule[selectedDay];
    const waypoints: string[] = [];

    // Add start location
    const startLatLng = L.latLng(
      currentDaySchedule.start_location.lat,
      currentDaySchedule.start_location.lng
    );
    waypoints.push(
      `${currentDaySchedule.start_location.lat},${currentDaySchedule.start_location.lng}`
    );

    L.marker(startLatLng, { icon: homeIcon }).addTo(mapRef.current);

    // Add timeline items with numbered markers
    currentDaySchedule.timeline.forEach((item, index) => {
      const location =
        item.item_type === "meal"
          ? item.restaurant?.location
          : item.place?.location;

      if (location) {
        waypoints.push(`${location.lat},${location.lng}`);
        const latLng = L.latLng(location.lat, location.lng);

        // Create numbered icon
        const color = item.item_type === "meal" ? "#dc2626" : "#2563eb";
        const numberedIcon = L.divIcon({
          className: "custom-numbered-icon",
          html: `
            <div style="
              position: relative;
              width: 30px;
              height: 30px;
              background-color: ${color};
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
              color: white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
              ${index + 1}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker(latLng, { icon: numberedIcon }).addTo(
          mapRef.current!
        );

        // Make marker clickable to open modal
        marker.on("click", () => {
          setSelectedItem({ item, index });
          setModalOpen(true);
        });
      }
    });

    // Add end location
    const endLatLng = L.latLng(
      currentDaySchedule.end_location.lat,
      currentDaySchedule.end_location.lng
    );
    waypoints.push(
      `${currentDaySchedule.end_location.lat},${currentDaySchedule.end_location.lng}`
    );

    L.marker(endLatLng, { icon: homeIcon }).addTo(mapRef.current);

    // Fetch route from Geoapify
    if (waypoints.length >= 2) {
      try {
        setLoadingRoute(true);
        const waypointsParam = waypoints.join("|");
        const response = await fetch(
          `https://api.geoapify.com/v1/routing?waypoints=${waypointsParam}&mode=walk&apiKey=${API_KEY}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch route");
        }

        const data = await response.json();

        // Remove previous route if exists
        if (routeLayerRef.current) {
          mapRef.current.removeLayer(routeLayerRef.current);
        }

        // Add route to map
        if (data.features && data.features.length > 0) {
          routeLayerRef.current = L.geoJSON(data, {
            style: {
              color: "#f97316",
              weight: 4,
              opacity: 0.8,
            },
          }).addTo(mapRef.current);

          // Fit map to route bounds
          const bounds = routeLayerRef.current.getBounds();
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (error) {
        console.error("Error fetching route:", error);
        // Fallback: draw straight lines if API fails
        const routePoints = waypoints.map((wp) => {
          const [lat, lng] = wp.split(",").map(Number);
          return L.latLng(lat, lng);
        });
        L.polyline(routePoints, {
          color: "#f97316",
          weight: 3,
          opacity: 0.7,
          dashArray: "10, 5",
        }).addTo(mapRef.current!);

        mapRef.current.fitBounds(L.latLngBounds(routePoints), {
          padding: [50, 50],
        });
      } finally {
        setLoadingRoute(false);
      }
    }
  };

  if (schedule.length === 0) {
    return null;
  }

  const currentDaySchedule = schedule[selectedDay];

  return (
    <>
      <Content
        sidebar={false}
        buttonBack="Back to Schedule"
        buttonBackAction={() => navigate("/schedule", { state: { selectedDay } })}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b z-10">
            {/* <div className="flex items-center justify-between mb-4">
              <Heading level={1}>Route Map</Heading>
              <Button onClick={() => navigate("/schedule")} variant="secondary">
                Back to Schedule
              </Button>
            </div> */}

            {/* Day selector */}
            <DaySelector
              currentDay={selectedDay}
              totalDays={schedule.length}
              date={currentDaySchedule.date}
              onPreviousDay={() => setSelectedDay(selectedDay - 1)}
              onNextDay={() => setSelectedDay(selectedDay + 1)}
            />
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <div id="route-map" className="h-full w-full"></div>

            {/* Loading indicator */}
            {loadingRoute && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg z-[1000]">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                  <span className="text-sm">Calculating route...</span>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-[1000]">
              <div className="text-sm font-semibold mb-2">Legend</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Start/End (Home)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Attraction</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Restaurant/Meal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500"></div>
                  <span>Route path</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Content>

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
    </>
  );
}
