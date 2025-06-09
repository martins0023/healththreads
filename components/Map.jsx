import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

// Sample data…
const healthResources = [ /* … */ ];

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom]);
  return null;
}

export default function Map() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  // Fix Leaflet's default icon paths
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl:      require('leaflet/dist/images/marker-icon.png'),
      shadowUrl:    require('leaflet/dist/images/marker-shadow.png'),
    });
  }, []);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported.');
      setPosition([7.3964, 3.9167]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPosition([coords.latitude, coords.longitude]),
      (err) => {
        setError(err.message);
        setPosition([7.3964, 3.9167]);
      }
    );
  }, []);

  if (!position) {
    return <div className="h-96 flex items-center justify-center">Fetching location…</div>;
  }

  return (
    <MapContainer center={position} zoom={13} style={{ height: '600px', width: '100%' }}>
      <ChangeView center={position} zoom={13} />
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User marker */}
      <Marker position={position}>
        <Popup>
          You are here
          {error && <div className="text-orange-600">({error})</div>}
        </Popup>
      </Marker>

      {/* Resource markers */}
      {healthResources.map(res => (
        <Marker key={res.id} position={[res.lat, res.lng]}>
          <Popup>
            <strong>{res.name}</strong><br/>
            Type: {res.type}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
