// components/LocalMap.jsx
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Only load these on the client side, as Leaflet requires the browser's window object.
// ssr: false ensures these components are not rendered on the server.
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// Corrected import for MarkerClusterGroup.
// It's common for libraries like react-leaflet-cluster to export their main component as a default export.
// We access it via `mod.default` to ensure we get the component itself, not the module object.
const MarkerClusterGroup = dynamic(
  () => import("react-leaflet-cluster").then((mod) => mod.default), // Changed from mod.MarkerClusterGroup to mod.default
  { ssr: false }
);

export default function LocalMap() {
  // State to store the user's geographical position [latitude, longitude]
  const [position, setPosition] = useState(null);
  // State to store the list of healthcare resources fetched from Overpass API
  const [resources, setResources] = useState([]);

  // useEffect hook for geolocation:
  // 1) Attempts to get the user's current position using the browser's geolocation API.
  // 2) Sets a fallback position (New York City) if geolocation is not supported or fails.
  // This effect runs only once after the initial render (empty dependency array).
  useEffect(() => {
    // Check if the geolocation API is available in the browser
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by your browser.");
      return;
    }
    // Get the current position
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // On success, update the position state
        setPosition([coords.latitude, coords.longitude]);
      },
      () => {
        // On error or denial, set a fallback position (New York City)
        console.error("Geolocation failed or was denied. Using fallback position.");
        setPosition([40.7128, -74.006]);
      }
    );
  }, []); // Empty dependency array ensures this runs once on mount

  // useEffect hook for fetching resources from Overpass API:
  // 1) Runs only when 'position' state changes (i.e., after geolocation is successful).
  // 2) Constructs an Overpass API query to find hospitals, clinics, or doctors around the user's position.
  // 3) Fetches the data, maps it to a more usable format, and updates the 'resources' state.
  useEffect(() => {
    // Only proceed if the user's position has been determined
    if (!position) {
      return;
    }
    const [lat, lon] = position; // Destructure latitude and longitude from the position state

    // Overpass API query to find healthcare amenities within a 5000-meter radius
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lon});
        way["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lon});
        relation["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lon});
      );
      out center;
    `;

    // Make a POST request to the Overpass API interpreter
    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    })
      .then((r) => {
        // Check if the response is OK, otherwise throw an error
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json(); // Parse the JSON response
      })
      .then((data) => {
        // Map the raw API elements to a more structured format for our application
        const items = data.elements.map((el) => ({
          id: el.id, // Unique ID for the resource
          name: el.tags.name || el.tags.amenity, // Use 'name' tag, or 'amenity' if name is missing
          coords:
            el.type === "node"
              ? [el.lat, el.lon] // If it's a node, use its lat/lon directly
              : [el.center.lat, el.center.lon], // If it's a way/relation, use its center coordinates
          tags: el.tags, // Keep all original tags for potential future use
        }));
        setResources(items); // Update the resources state
      })
      .catch((error) => {
        console.error("Error fetching Overpass API data:", error); // Log any errors during the fetch
      });
  }, [position]); // This effect runs whenever 'position' changes

  // Display a loading message until the user's position is determined
  if (!position) {
    return <p className="text-center py-8">Locating you…</p>;
  }

  // Render the map once the position is available
  return (
    <MapContainer
      center={position} // Center the map on the user's position
      zoom={13} // Set initial zoom level
      // Apply responsive styling using Tailwind CSS (height is fixed for demonstration)
      style={{ height: "70vh", width: "100%" }}
      className="rounded-lg shadow-lg" // Add some styling to the map container
    >
      {/* OpenStreetMap Tile Layer */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />

      {/* Marker for the user's current location */}
      <Marker
        position={position}
        // Custom icon for the user marker
        icon={L.icon({
          iconUrl: "/marker-user.svg", // Path to user icon (make sure this file exists in your public folder)
          iconSize: [32, 32], // Size of the icon
          iconAnchor: [16, 32], // Point of the icon that corresponds to the marker's location
          popupAnchor: [0, -30], // Point from which the popup should open relative to the iconAnchor
        })}
      >
        <Popup>You are here</Popup> {/* Popup displayed when clicking the user marker */}
      </Marker>

      {/* MarkerClusterGroup for clustering healthcare resources */}
      <MarkerClusterGroup
        // Optional: Customize cluster behavior (e.g., disable clustering on zoom)
        // chunkedLoading
        // maxClusterRadius={120}
        // showCoverageOnHover={false}
      >
        {/* Map through the fetched resources and create a Marker for each */}
        {resources.map((res) => (
          <Marker
            key={res.id} // Unique key for each marker
            position={res.coords} // Coordinates of the resource
            // Custom icon for the hospital/clinic markers
            icon={L.icon({
              iconUrl: "/marker-hospital.svg", // Path to hospital icon (make sure this file exists)
              iconSize: [32, 32], // Size of the icon
              iconAnchor: [16, 32],
              popupAnchor: [0, -30],
            })}
          >
            {/* Popup for each resource marker */}
            <Popup>
              <strong className="font-bold">{res.name}</strong>
              <br />
              <span className="text-sm text-gray-600">{res.tags.amenity}</span>
              {/* You can add more details from res.tags here if needed */}
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
