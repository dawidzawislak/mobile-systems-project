import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet
// @ts-expect-error - TS might complain about missing properties on prototype or the delete operator
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY as string;

export default function MapComponent() {
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Layer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const waypointsRef = useRef<{lat: number, lon: number}[]>([]); 
  
  const [statusText, setStatusText] = useState("Tap map to add stops");

  const updateStatus = () => {
      const count = waypointsRef.current.length;
      if (count === 0) setStatusText("Tap map to add stops");
      else setStatusText(`${count} stop${count > 1 ? 's' : ''} added`);
  };

  useEffect(() => {
    if (!mapRef.current) {
        const map = L.map('map').setView([50.0647, 19.9450], 13);
        mapRef.current = map;

        L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${API_KEY}`, {
            attribution: 'Powered by Geoapify | © OpenStreetMap contributors',
            maxZoom: 20
        }).addTo(map);

        map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            const marker = L.marker([lat, lng]).addTo(map);
            markersRef.current.push(marker);
            waypointsRef.current.push({ lat, lon: lng });
            
            // Force update status functionality by recreating the function scope logic or just call it.
            // But updateStatus uses refs, so it's safe to call.
            // We need to trigger a render though.
            const count = waypointsRef.current.length;
            if (count === 0) setStatusText("Tap map to add stops");
            else setStatusText(`${count} stop${count > 1 ? 's' : ''} added`);
        });

        map.locate({setView: true, maxZoom: 16});
        map.on('locationfound', (e: L.LocationEvent) => {
             L.circle(e.latlng, { radius: e.accuracy / 2, color: 'blue' }).addTo(map);
        });
    }

    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    };
  }, []);

  const clearMap = () => {
      if (mapRef.current) {
          markersRef.current.forEach(m => mapRef.current?.removeLayer(m));
          if (routeLayerRef.current) mapRef.current.removeLayer(routeLayerRef.current);
      }
      markersRef.current = [];
      waypointsRef.current = [];
      routeLayerRef.current = null;
      updateStatus();
  };

  const calculateRoute = async () => {
      if (waypointsRef.current.length < 2) {
          alert("Please add at least 2 locations!");
          return;
      }

      setStatusText("Calculating route...");

      const waypointsStr = waypointsRef.current
        .map(p => `${p.lat},${p.lon}`)
        .join('|');

      const url = `https://api.geoapify.com/v1/routing?waypoints=${waypointsStr}&mode=walk&apiKey=${API_KEY}`;

      try {
          const response = await fetch(url);
          const data = await response.json();

          if (data.features && data.features.length > 0) {
               if (mapRef.current) {
                   if (routeLayerRef.current) mapRef.current.removeLayer(routeLayerRef.current);
                   
                   // @ts-ignore - L.geoJSON types sometimes conflict with raw GeoJSON data
                   routeLayerRef.current = L.geoJSON(data, {
                        style: { color: '#3b82f6', weight: 5 }
                   }).addTo(mapRef.current);

                   // @ts-ignore
                   mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
               }

               const props = data.features[0].properties;
               const distanceKm = (props.distance / 1000).toFixed(1);
               const timeMin = Math.round(props.time / 60);
               setStatusText(`Trip: ${distanceKm}km (${timeMin} min)`);
          } else {
              alert("No route found!");
              updateStatus();
          }
      } catch (error) {
          console.error(error);
          alert("Error calculating route.");
          updateStatus();
      }
  };

  return (
    <>
        <div id="map" className="h-[400px] w-full"></div>
        <div className="controls">
            <div id="status">{statusText}</div>
            <button id="calc-btn" onClick={calculateRoute}>Get Route</button>
            <button id="clear-btn" onClick={clearMap} style={{background: '#ef4444'}}>Clear</button>
        </div>
    </>
  );
}
