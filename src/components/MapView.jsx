"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export default function MapView({ location, radius, results }) {
  return <MapContainer center={[location.lat, location.lng]} zoom={12} scrollWheelZoom className="map-canvas">
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Marker position={[location.lat, location.lng]} icon={icon}><Popup>Your search location (stays in your browser)</Popup></Marker>
    <Circle center={[location.lat, location.lng]} radius={radius * 1000} pathOptions={{ color: '#5b5ce2', fillColor: '#7c7df0', fillOpacity: 0.09 }} />
    {results.map((poi) => <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={icon}><Popup><strong>{poi.name}</strong><br />{poi.category}<br />{poi.desc}<br />{poi.distance.toFixed(2)} km away</Popup></Marker>)}
  </MapContainer>;
}
