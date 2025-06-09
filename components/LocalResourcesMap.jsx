// components/LocalResourcesMap.jsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
} from '@react-google-maps/api';
import Loading from './Loading';

const libraries = ['places'];
const mapContainerStyle = { width: '100%', height: '500px' };
const defaultCenter = { lat: 6.5244, lng: 3.3792 }; // Lagos, Nigeria as fallback
const searchRadius = 5000; // in meters

export default function LocalResourcesMap() {
  const mapRef = useRef(null);
  const [currentPosition, setCurrentPosition] = useState(defaultCenter);
  const [resources, setResources] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          setCurrentPosition({ lat: latitude, lng: longitude });
        },
        () => {
          setError("Location access denied. Using default location.");
        }
      );
    } else {
      setError("Geolocation not supported");
    }
  }, []);

  // Fetch nearby health resources
  const fetchResources = useCallback(() => {
    if (!mapRef.current || !window.google) return;
    
    setIsFetching(true);
    setError(null);
    
    try {
      const service = new window.google.maps.places.PlacesService(mapRef.current);
      const request = {
        location: currentPosition,
        radius: searchRadius,
        type: ['hospital', 'health', 'pharmacy', 'doctor'],
      };

      service.nearbySearch(request, (results, status) => {
        setIsFetching(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setResources(results || []);
        } else {
          setError(`Could not load health resources: ${status}`);
        }
      });
    } catch (err) {
      setIsFetching(false);
      setError("Error fetching health resources");
      console.error(err);
    }
  }, [currentPosition]);

  // Fetch resources when map loads or position changes
  useEffect(() => {
    if (isLoaded && currentPosition) {
      fetchResources();
    }
  }, [isLoaded, currentPosition, fetchResources]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  if (loadError) return <div className="text-red-500 p-4">Error loading Google Maps</div>;
  if (!isLoaded) return <Loading message="Loading map..." />;

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={currentPosition}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi.medical",
              elementType: "labels.icon",
              stylers: [{ visibility: "on" }]
            }
          ]
        }}
      >
        {/* User Marker */}
        <Marker
          position={currentPosition}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          }}
        />

        {/* Health Resource Markers */}
        {resources.map((place) => (
          <Marker
            key={place.place_id}
            position={{
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }}
            onClick={() => setSelected(place)}
            icon={{
              url: '/medical-icon.png',
              scaledSize: new window.google.maps.Size(32, 32)
            }}
          />
        ))}

        {/* InfoWindow for selected resource */}
        {selected && (
          <InfoWindow
            position={{
              lat: selected.geometry.location.lat(),
              lng: selected.geometry.location.lng()
            }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="min-w-[200px]">
              <h3 className="font-bold text-lg">{selected.name}</h3>
              <p className="text-gray-600 my-1">{selected.vicinity}</p>
              {selected.rating && (
                <div className="flex items-center mt-1">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span>{selected.rating}</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span>{selected.user_ratings_total || 0} reviews</span>
                </div>
              )}
              {selected.opening_hours && (
                <p className={`mt-2 ${selected.opening_hours.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                  {selected.opening_hours.isOpen ? 'Open Now' : 'Closed'}
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Loading overlay */}
      {isFetching && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-white bg-opacity-70 flex items-center justify-center">
          <Loading message="Finding health resources..." />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md max-w-xs">
          {error}
        </div>
      )}

      {/* Map controls */}
      <div className="absolute top-4 left-4 bg-white p-2 rounded-md shadow-md">
        <button 
          onClick={fetchResources}
          className="flex items-center text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
}