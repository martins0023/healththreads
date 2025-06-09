// components/HealthMap.js
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect } from 'react';

// Fix leaflet's default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Medical icon configuration
const medicalIcon = new L.Icon({
  iconUrl: '/medical-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const HealthMap = () => {
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [healthResources, setHealthResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsClient(true); // Set client-side flag
    
    if (typeof window !== 'undefined') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(coords);
            fetchHealthResources(coords);
          },
          (err) => {
            setError("Location access denied. Using default location.");
            const defaultLocation = { lat: 51.505, lng: -0.09 };
            setUserLocation(defaultLocation);
            fetchHealthResources(defaultLocation);
          }
        );
      } else {
        setError("Geolocation not supported");
        setUserLocation({ lat: 51.505, lng: -0.09 });
        setLoading(false);
      }
    }
  }, []);

  // Fetch health resources
  const fetchHealthResources = async (coords) => {
    try {
      // Mock data - replace with real API call
      const mockResources = [
        // ... same as before ...
      ];
      
      setHealthResources(mockResources);
      setLoading(false);
    } catch (err) {
      setError("Failed to load health resources");
      setLoading(false);
    }
  };

  if (!isClient || !userLocation) {
    return <div className="h-[500px] flex items-center justify-center">Loading map...</div>;
  }

  return (
    <div className="relative h-[500px] w-full">
      <MapContainer 
        center={[userLocation.lat, userLocation.lng]} 
        zoom={14} 
        className="h-full z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* User location marker */}
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>Your Location</Popup>
        </Marker>
        
        {/* Health resources markers */}
        {healthResources.map(resource => (
          <Marker 
            key={resource.id} 
            position={[resource.lat, resource.lng]}
            icon={L.icon({
              iconUrl: '/medical-icon.png', // Add your custom icon
              iconSize: [32, 32],
            })}
          >
            <Popup>
              <div className="font-bold">{resource.name}</div>
              <div className="text-gray-600">{resource.type}</div>
              <div className="text-green-600">{resource.distance} away</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {loading && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-white bg-opacity-80 flex items-center justify-center">
          Loading health resources...
        </div>
      )}
      
      {error && (
        <div className="absolute top-2 right-2 bg-red-100 text-red-700 p-2 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default HealthMap;