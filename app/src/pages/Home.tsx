import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRouteCtx } from "../hooks/useRouteCtx";
import { AlertMessage, Spinner } from "../components/common";
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

// Custom icon for apartment
const apartmentIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function Home() {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const { homeLocation, setHomeLocation } = useRouteCtx();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map("home-map").setView([50.0647, 19.945], 13);
      mapRef.current = map;

      L.tileLayer(
        `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${API_KEY}`,
        {
          attribution: "Powered by Geoapify | © OpenStreetMap contributors",
          maxZoom: 20,
        }
      ).addTo(map);

      // If there's already a location stored, show it
      if (homeLocation.latitude !== 0 && homeLocation.longitude !== 0) {
        markerRef.current = L.marker(
          [homeLocation.latitude, homeLocation.longitude],
          { icon: apartmentIcon }
        )
          .bindPopup("Your apartment")
          .addTo(map);
        map.setView([homeLocation.latitude, homeLocation.longitude], 15);
      }

      // Click to set apartment location
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        // Remove previous marker if exists
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }

        // Add new marker
        markerRef.current = L.marker([lat, lng], { icon: apartmentIcon })
          .bindPopup("Your apartment")
          .addTo(map);

        // Store in context
        setHomeLocation({ latitude: lat, longitude: lng });
        setError(null);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setError(null);
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;

        // Remove previous marker if exists
        if (markerRef.current && mapRef.current) {
          mapRef.current.removeLayer(markerRef.current);
        }

        // Add new marker
        if (mapRef.current) {
          markerRef.current = L.marker([latitude, longitude], {
            icon: apartmentIcon,
          })
            .bindPopup("Your apartment")
            .addTo(mapRef.current);
          mapRef.current.setView([latitude, longitude], 15);
        }

        // Store in context
        setHomeLocation({ latitude, longitude });
      },
      (err) => {
        setIsLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. Allow it in your browser settings or tap the map instead."
            : "Unable to retrieve your location. Tap the map to choose it manually."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleContinue = () => {
    if (homeLocation.latitude === 0 && homeLocation.longitude === 0) {
      setError("Please select your apartment location first.");
      return;
    }
    navigate("/plan");
  };

  return (
    <Content
      header="Choose your apartment location"
      buttonNext="Continue planning"
      buttonBack={isLocating ? "Locating..." : "Use my location"}
      buttonNextAction={handleContinue}
      buttonBackAction={handleUseDeviceLocation}
      buttonNextDisabled={
        homeLocation.latitude === 0 && homeLocation.longitude === 0
      }
    >
      <div className="relative h-full w-full">
        <div id="home-map" className="h-full w-full"></div>
        <div className="absolute top-3 inset-x-3 z-[1000] flex flex-col gap-2 pointer-events-none">
          {homeLocation.latitude === 0 && homeLocation.longitude === 0 && !error && (
            <AlertMessage
              type="info"
              message="Tap the map to mark where you're staying."
              className="pointer-events-auto shadow"
            />
          )}
          {isLocating && (
            <div className="self-center bg-white px-4 py-2 rounded-lg shadow pointer-events-auto">
              <Spinner size="sm" label="Finding your location..." />
            </div>
          )}
          {error && (
            <AlertMessage
              type="error"
              message={error}
              onClose={() => setError(null)}
              className="pointer-events-auto shadow"
            />
          )}
        </div>
      </div>
    </Content>
  );
}
