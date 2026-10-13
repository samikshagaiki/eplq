"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { decryptPOI } from '@/lib/crypto';
import { getBoundingBox, haversine, PointQuadtree } from '@/lib/utils';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div className="empty-state">Loading interactive map…</div> });
const categories = ['all', 'hospital', 'police', 'fire_station', 'pharmacy', 'restaurant', 'shelter', 'atm', 'park', 'other'];

export default function UserSearchPage() {
  const [ready, setReady] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('10');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState(null);
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [loadedCount, setLoadedCount] = useState(null);
  const router = useRouter();
  const showMessage = (text, type = 'info') => { setMessage(text); setMessageType(type); };

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { router.replace('/login'); return; }
    try {
      const profile = await getDoc(doc(db, 'users', user.uid));
      if (!profile.exists() || !['admin','user'].includes(profile.data().role)) { router.replace('/login'); return; }
      setReady(true);
    } catch (err) { console.error('Profile check failed:', err.message); router.replace('/login'); }
  }), [router]);

  function setManualLocation() {
    const lat = Number(latitude); const lng = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      showMessage('Enter valid latitude and longitude values.', 'error'); return false;
    }
    setLocation({ lat, lng }); showMessage('Search location set locally in your browser.', 'success'); return true;
  }

  function useDeviceLocation() {
    setMessage('');
    if (!navigator.geolocation) { showMessage('Geolocation is not supported by this browser. Enter coordinates manually.', 'error'); return; }
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude; const lng = position.coords.longitude;
      setLatitude(lat.toFixed(6)); setLongitude(lng.toFixed(6)); setLocation({ lat, lng });
      showMessage('Device location acquired. It stays in this browser and is not sent to the EPLQ API.', 'success');
    }, (err) => { showMessage(err.code === 1 ? 'Location permission was denied. You can enter coordinates manually.' : 'Could not get your location. Enter coordinates manually.', 'error'); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  async function search(event) {
    event.preventDefault(); setMessage('');
    if (!location && !setManualLocation()) return;
    const activeLocation = location || { lat: Number(latitude), lng: Number(longitude) };
    const radiusKm = Number(radius);
    if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 500) { showMessage('Choose a radius greater than 0 and no more than 500 km.', 'error'); return; }
    if (passphrase.trim().length < 12) { showMessage('Enter the shared data passphrase provided by the administrator.', 'error'); return; }
    setBusy(true);
    try {
      if (!auth.currentUser) throw new Error('Your session expired. Please sign in again.');
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/pois', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const records = await response.json();
      if (!response.ok) throw new Error(records.error || 'Could not retrieve encrypted POIs.');
      if (!Array.isArray(records)) throw new Error('The POI API returned an invalid response.');
      const decrypted = (await Promise.all(records.map(async (record) => {
        try {
          const poi = await decryptPOI(record.encrypted, passphrase);
          const lat = Number(poi.lat); const lng = Number(poi.lng);
          if (!poi.name || !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) return null;
          return { ...poi, id: record.id, lat, lng };
        } catch { return null; }
      }))).filter(Boolean);
      if (records.length && !decrypted.length) throw new Error('No records could be decrypted. Check the shared passphrase or ask the admin to re-upload records in the current format.');
      setLoadedCount(decrypted.length);
      const tree = new PointQuadtree(decrypted);
      const candidates = tree.query(getBoundingBox(activeLocation.lat, activeLocation.lng, radiusKm));
      const nearby = candidates.map((poi) => ({ ...poi, distance: haversine(activeLocation.lat, activeLocation.lng, poi.lat, poi.lng) }))
        .filter((poi) => poi.distance <= radiusKm && (category === 'all' || poi.category === category))
        .sort((a,b) => a.distance - b.distance);
      setResults(nearby);
      setLocation(activeLocation);
      showMessage(`Search complete: ${nearby.length} result(s) within ${radiusKm} km. Coordinates and radius were not sent to the API.`, 'success');
    } catch (err) { console.error('Nearby search failed:', err.message); setResults([]); showMessage(err.message || 'Search failed.', 'error'); }
    finally { setBusy(false); }
  }

  if (!ready) return <main className="content-wrap"><p className="spinner-text">Verifying your account…</p></main>;

  return <main className="content-wrap"><div className="page-heading"><div><span className="eyebrow">PRIVATE NEARBY SEARCH</span><h1 style={{marginTop:14}}>Explore around you</h1><p>Search encrypted POIs using a circular radius. Your coordinates remain on your device.</p></div><span className="count-pill">LOCAL FILTERING</span></div>{message && <div role="status" className={`status status-${messageType}`}>{message}</div>}<div className="dashboard-grid"><section className="panel"><h2>Search settings</h2><form className="form-stack" onSubmit={search}><label htmlFor="passphrase">Shared data passphrase</label><input id="passphrase" type="password" value={passphrase} onChange={(e)=>setPassphrase(e.target.value)} autoComplete="off" minLength={12} placeholder="At least 12 characters" required/><p className="form-help">The passphrase is used only in your browser to decrypt downloaded records. Do not enter a password you use for another account.</p><div className="divider"/><div className="panel-head"><h2 style={{fontSize:14,margin:0}}>Search location</h2><button className="button button-secondary" type="button" style={{minHeight:34,padding:'0 10px',fontSize:11}} onClick={useDeviceLocation}>Use device GPS</button></div><div className="inline-fields"><div className="form-stack"><label htmlFor="latitude">Latitude</label><input id="latitude" type="number" step="any" min="-90" max="90" value={latitude} onChange={(e)=>{setLatitude(e.target.value);setLocation(null);}} placeholder="21.1458" required/></div><div className="form-stack"><label htmlFor="longitude">Longitude</label><input id="longitude" type="number" step="any" min="-180" max="180" value={longitude} onChange={(e)=>{setLongitude(e.target.value);setLocation(null);}} placeholder="79.0882" required/></div></div><button className="button button-secondary" type="button" onClick={setManualLocation}>Set coordinates</button><label htmlFor="radius">Search radius (km)</label><input id="radius" type="number" min="0.1" max="500" step="any" value={radius} onChange={(e)=>setRadius(e.target.value)} required/><label htmlFor="category">POI category</label><select id="category" value={category} onChange={(e)=>setCategory(e.target.value)}>{categories.map((item)=><option key={item} value={item}>{item === 'all' ? 'All categories' : item.replace('_',' ').replace(/\b\w/g,(c)=>c.toUpperCase())}</option>)}</select><button className="primary-button" disabled={busy}>{busy ? 'Decrypting & searching…' : 'Search nearby POIs'}</button></form><div className="divider"/><div className="security-callout"><strong>What the server sees:</strong> your authenticated request and encrypted POI records. The server does not receive your coordinates, radius or category filter. The browser decrypts records and runs the spatial query locally.</div></section><section className="panel"><div className="panel-head"><h2>Search results</h2><span className="count-pill">{results.length} found</span></div>{location && <><div className="map-shell"><MapView location={location} radius={Number(radius) || 1} results={results}/></div><div className="map-legend"><span><i className="legend-dot"/> Search location</span><span>Circle = selected radius</span><span>{loadedCount ?? '—'} POIs decrypted locally</span></div></>}{results.length ? <><div className="divider"/><div className="results-grid">{results.map((poi)=><article className="result-card" key={poi.id}><span className="category-tag">{String(poi.category).replace('_',' ')}</span><h3>{poi.name}</h3><p>{poi.desc}</p><p className="distance">{poi.distance.toFixed(2)} km away</p></article>)}</div></> : <div className="empty-state">{location ? 'No matching places yet. Try a larger radius or another category.' : 'Set your coordinates or use device GPS, enter the shared passphrase, then search.'}</div>}</section></div></main>;
}
