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

const libraries = ['places', 'geometry'];
const mapContainerStyle = { width: '100%', height: '500px' };
const defaultCenter = { lat: 6.5244, lng: 3.3792 }; // Lagos, Nigeria as fallback
const searchRadius = 5000; // in meters (max 50,000)
const HEALTH_TYPES = [
  'hospital', 
  'pharmacy', 
  'doctor', 
  'health', 
  'clinic',
  'dentist',
  'physiotherapist',
  'veterinary_care',
  'optometrist',
  'emergency_room'
];

export default function LocalResourcesMap() {
  const mapRef = useRef(null);
  const placesServiceRef = useRef(null);
  const [currentPosition, setCurrentPosition] = useState(defaultCenter);
  const [resources, setResources] = useState([]);
  const [selected, setSelected] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [mapType, setMapType] = useState('roadmap');
  const [tilt, setTilt] = useState(0);
  const [heading, setHeading] = useState(0);
  const [is3DEnabled, setIs3DEnabled] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Get user's location with high accuracy
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }

    setIsFetching(true);
    
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });
        setLocationAccuracy(accuracy);
        setIsFetching(false);
      },
      (err) => {
        setIsFetching(false);
        setError("Location access denied. Using default location.");
        console.error("Geolocation error:", err.message);
      },
      geoOptions
    );
  }, []);

  // Initialize Places Service
  useEffect(() => {
    if (isLoaded && mapRef.current && !placesServiceRef.current) {
      placesServiceRef.current = new window.google.maps.places.PlacesService(mapRef.current);
    }
  }, [isLoaded]);

  // Fetch nearby health resources with improved accuracy
  const fetchResources = useCallback(() => {
    if (!placesServiceRef.current || !currentPosition) return;
    
    setIsFetching(true);
    setError(null);
    setSelected(null);
    setPlaceDetails(null);
    
    // Create a circular boundary for more accurate results
    const circle = new window.google.maps.Circle({
      center: currentPosition,
      radius: searchRadius
    });
    
    const bounds = circle.getBounds();
    
    const request = {
      bounds: bounds,
      type: HEALTH_TYPES,
      rankBy: window.google.maps.places.RankBy.DISTANCE,
      keyword: 'health|medical|clinic|hospital|pharmacy'
    };

    placesServiceRef.current.nearbySearch(request, (results, status) => {
      setIsFetching(false);
      
      switch (status) {
        case window.google.maps.places.PlacesServiceStatus.OK:
          // Filter out irrelevant results
          const healthResources = results.filter(result => 
            result.types.some(type => HEALTH_TYPES.includes(type))
          );
          setResources(healthResources);
          break;
        case window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
          setResources([]);
          setError("No health resources found in this area");
          break;
        case window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
          setError("Too many requests. Please try again later.");
          break;
        case window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
          setError("Service unavailable. Invalid API key or permissions.");
          break;
        case window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
          setError("Invalid request. Please check your parameters.");
          break;
        default:
          setError(`Could not load health resources: ${status}`);
      }
    });
  }, [currentPosition]);

  // Fetch detailed place information
  const fetchPlaceDetails = useCallback((placeId) => {
    if (!placesServiceRef.current) return;

    const request = {
      placeId,
      fields: [
        'name', 
        'formatted_address',
        'formatted_phone_number',
        'website',
        'opening_hours',
        'rating',
        'user_ratings_total',
        'photos',
        'business_status',
        'geometry',
        'url',
        'utc_offset_minutes',
        'price_level'
      ]
    };

    placesServiceRef.current.getDetails(request, (result, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setPlaceDetails(result);
      } else {
        console.error("Place details error:", status);
      }
    });
  }, []);

  // Handle marker click
  const handleMarkerClick = (place) => {
    setSelected(place);
    fetchPlaceDetails(place.place_id);
  };

  // Fetch resources when ready
  useEffect(() => {
    if (isLoaded && placesServiceRef.current && currentPosition) {
      fetchResources();
    }
  }, [isLoaded, currentPosition, fetchResources]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Toggle 3D view
  const toggle3DView = () => {
    if (is3DEnabled) {
      setTilt(0);
      setHeading(0);
      setIs3DEnabled(false);
    } else {
      setTilt(45);
      setHeading(0);
      setIs3DEnabled(true);
    }
  };

  // Rotate map view
  const rotateMap = (direction) => {
    const currentHeading = heading;
    const rotationAmount = direction === 'left' ? -45 : 45;
    setHeading((currentHeading + rotationAmount) % 360);
  };

  // Change map type
  const changeMapType = (type) => {
    setMapType(type);
    // Reset tilt for non-satellite views
    if (type !== 'satellite' && type !== 'hybrid') {
      setTilt(0);
      setIs3DEnabled(false);
    }
  };

  if (loadError) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-red-50 rounded-lg">
        <div className="text-center p-4">
          <h3 className="font-bold text-red-700">Map Loading Error</h3>
          <p className="text-red-600">Failed to load Google Maps. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <Loading message="Initializing health map..." />
      </div>
    );
  }

  // Helper to render opening hours
  const renderOpeningHours = (hours) => {
    if (!hours || !hours.weekday_text) return null;
    
    return (
      <div className="mt-2">
        <h4 className="font-semibold text-sm">Opening Hours:</h4>
        <ul className="text-xs space-y-1">
          {hours.weekday_text.map((day, index) => (
            <li key={index} className="flex items-start">
              <span className="min-w-[70px] inline-block">{day.substring(0, 3)}:</span>
              <span>{day.substring(4)}</span>
            </li>
          ))}
        </ul>
        <p className={`mt-1 text-sm font-medium ${hours.isOpen() ? 'text-green-600' : 'text-red-600'}`}>
          {hours.isOpen() ? '● Open Now' : '● Closed'}
        </p>
      </div>
    );
  };

  // Helper to render business status
  const renderBusinessStatus = (status) => {
    if (!status) return null;
    
    const statusMap = {
      OPERATIONAL: { text: 'Operational', color: 'text-green-600' },
      CLOSED_TEMPORARILY: { text: 'Temporarily Closed', color: 'text-yellow-600' },
      CLOSED_PERMANENTLY: { text: 'Permanently Closed', color: 'text-red-600' }
    };
    
    const statusInfo = statusMap[status] || { text: status, color: 'text-gray-600' };
    
    return (
      <p className={`text-xs ${statusInfo.color}`}>
        Status: {statusInfo.text}
      </p>
    );
  };

  // Render price level indicators
  const renderPriceLevel = (priceLevel) => {
    if (priceLevel === undefined) return null;
    return (
      <div className="flex items-center mt-1">
        <span className="text-xs text-gray-600 mr-2">Price:</span>
        {[...Array(4)].map((_, i) => (
          <span 
            key={i} 
            className={`w-2 h-2 rounded-full mx-0.5 ${i < priceLevel ? 'bg-gray-800' : 'bg-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={currentPosition}
        onLoad={onMapLoad}
        options={{
          mapTypeId: mapType,
          tilt: tilt,
          heading: heading,
          disableDefaultUI: true,
          zoomControl: true,
          minZoom: 10,
          maxZoom: 18,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "poi.medical",
              elementType: "labels.icon",
              stylers: [{ 
                visibility: "on",
                color: "#db2777"
              }]
            },
            {
              featureType: "transit",
              elementType: "labels.icon",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "road",
              elementType: "labels.icon",
              stylers: [{ visibility: "simplified" }]
            }
          ]
        }}
      >
        {/* User Marker */}
        {currentPosition && (
          <Marker
            position={currentPosition}
            zIndex={100}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 3,
            }}
          />
        )}

        {/* Health Resource Markers */}
        {resources.map((place) => (
          <Marker
            key={place.place_id}
            position={{
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }}
            onClick={() => handleMarkerClick(place)}
            icon={{
              path: "M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z",
              fillColor: "#10B981",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
              scale: 1.5,
              anchor: new window.google.maps.Point(12, 24),
            }}
          />
        ))}

        {/* InfoWindow for selected resource */}
        {(selected && (placeDetails || selected)) && (
          <InfoWindow
            position={{
              lat: selected.geometry.location.lat(),
              lng: selected.geometry.location.lng()
            }}
            onCloseClick={() => {
              setSelected(null);
              setPlaceDetails(null);
            }}
          >
            <div className="min-w-[250px] max-w-xs">
              <h3 className="font-bold text-base text-gray-800">
                {placeDetails?.name || selected.name}
              </h3>
              
              <p className="text-gray-600 text-xs mt-1">
                {placeDetails?.formatted_address || selected.vicinity}
              </p>
              
              <div className="my-2 border-t border-gray-100 pt-2">
                {placeDetails?.rating && (
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">★</span>
                    <span className="font-medium">{placeDetails.rating}</span>
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="text-gray-500 text-xs">
                      {placeDetails.user_ratings_total || 0} reviews
                    </span>
                  </div>
                )}
                
                {placeDetails?.business_status && renderBusinessStatus(placeDetails.business_status)}
                
                {placeDetails?.formatted_phone_number && (
                  <p className="text-gray-700 text-xs mt-1">
                    Phone: {placeDetails.formatted_phone_number}
                  </p>
                )}
                
                {placeDetails?.price_level !== undefined && renderPriceLevel(placeDetails.price_level)}
                
                {placeDetails?.opening_hours && renderOpeningHours(placeDetails.opening_hours)}
              </div>
              
              <div className="mt-3 flex justify-between">
                {placeDetails?.website && (
                  <a 
                    href={placeDetails.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Website
                  </a>
                )}
                
                {placeDetails?.url && (
                  <a 
                    href={placeDetails.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View on Maps
                  </a>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Location accuracy indicator */}
      {locationAccuracy && (
        <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-md shadow-md text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>
              Location accuracy: ±{(locationAccuracy).toFixed(0)} meters
            </span>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isFetching && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-white bg-opacity-80 flex items-center justify-center">
          <Loading message="Searching for health resources..." />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md max-w-md text-center text-sm">
          {error}
        </div>
      )}

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <div className="flex space-x-2">
          <button 
            onClick={fetchResources}
            className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors"
            title="Refresh results"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button 
            onClick={() => navigator.geolocation.getCurrentPosition(
              ({ coords }) => setCurrentPosition({ 
                lat: coords.latitude, 
                lng: coords.longitude 
              })
            )}
            className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors"
            title="Re-center to my location"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 3D controls */}
        <div className="bg-white p-2 rounded-md shadow-md flex flex-col space-y-2">
          <button 
            onClick={toggle3DView}
            className={`p-1 rounded-md ${is3DEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
            title={is3DEnabled ? "Disable 3D view" : "Enable 3D view"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          {is3DEnabled && (
            <div className="flex space-x-1">
              <button 
                onClick={() => rotateMap('left')}
                className="p-1 bg-gray-100 rounded-md"
                title="Rotate left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button 
                onClick={() => rotateMap('right')}
                className="p-1 bg-gray-100 rounded-md"
                title="Rotate right"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Map type selector */}
        <div className="bg-white p-2 rounded-md shadow-md flex flex-col space-y-1">
          <button 
            onClick={() => changeMapType('roadmap')}
            className={`p-1 rounded-md ${mapType === 'roadmap' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
            title="Standard Map"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293a1 1 0 00-1.414 0l-1 1a1 1 0 000 1.414l1.586 1.586a1 1 0 001.414 0l1-1a1 1 0 000-1.414L3.707 3.293zm14-.002a1 1 0 00-1.414 0l-1.586 1.586a1 1 0 000 1.414l1 1a1 1 0 001.414 0l1.586-1.586a1 1 0 000-1.414l-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button 
            onClick={() => changeMapType('satellite')}
            className={`p-1 rounded-md ${mapType === 'satellite' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
            title="Satellite View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
            </svg>
          </button>
          
          <button 
            onClick={() => changeMapType('hybrid')}
            className={`p-1 rounded-md ${mapType === 'hybrid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
            title="Hybrid View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}