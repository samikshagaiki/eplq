"use client";

import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { encryptPOI, decryptPOI } from '@/lib/crypto';

const categories = ['hospital', 'police', 'fire_station', 'pharmacy', 'restaurant', 'shelter', 'atm', 'park', 'other'];

export default function AdminUploadPage() {
  const [profileReady, setProfileReady] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [category, setCategory] = useState('hospital');
  const [desc, setDesc] = useState('');
  const [pois, setPois] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loadingPois, setLoadingPois] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const router = useRouter();

  const showMessage = (text, type = 'info') => { setMessage(text); setMessageType(type); };
  const getToken = async () => {
    if (!auth.currentUser) throw new Error('Your session expired. Please sign in again.');
    return auth.currentUser.getIdToken();
  };

  const loadPois = useCallback(async (secret = passphrase) => {
    setLoadingPois(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/pois', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load POIs.');
      if (!Array.isArray(data)) throw new Error('The POI API returned an invalid response.');
      if (!secret) { setPois([]); return; }
      const decrypted = await Promise.all(data.map(async (item) => {
        try { return { ...await decryptPOI(item.encrypted, secret), id: item.id }; }
        catch { return null; }
      }));
      setPois(decrypted.filter(Boolean));
      if (data.length && decrypted.every((item) => !item)) showMessage('Records could not be decrypted. Confirm the shared data passphrase or re-upload records encrypted with the current format.', 'error');
    } catch (err) { console.error('POI load failed:', err.message); showMessage(err.message || 'Could not load POIs.', 'error'); }
    finally { setLoadingPois(false); }
  }, [passphrase]);

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { router.replace('/login'); return; }
    try {
      const profile = await getDoc(doc(db, 'users', user.uid));
      if (!profile.exists() || profile.data().role !== 'admin') { router.replace('/user/search'); return; }
      setProfileReady(true);
    } catch (err) { console.error('Admin role check failed:', err.message); router.replace('/login'); }
  }), [router]);


  async function submit(event) {
    event.preventDefault(); showMessage('');
    const latitude = Number(lat); const longitude = Number(lng);
    if (passphrase.trim().length < 12) { showMessage('Enter the shared data passphrase (at least 12 characters).', 'error'); return; }
    if (!name.trim() || !desc.trim()) { showMessage('Name and description are required.', 'error'); return; }
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) { showMessage('Enter valid latitude (-90 to 90) and longitude (-180 to 180).', 'error'); return; }
    setBusy(true);
    try {
      const encrypted = await encryptPOI({ name: name.trim(), lat: latitude, lng: longitude, category, desc: desc.trim() }, passphrase);
      const token = await getToken();
      const response = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ encrypted }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed.');
      setName(''); setLat(''); setLng(''); setDesc(''); setCategory('hospital');
      showMessage('POI encrypted in your browser and uploaded successfully.', 'success');
      await loadPois(passphrase);
    } catch (err) { console.error('POI upload failed:', err.message); showMessage(err.message || 'Upload failed.', 'error'); }
    finally { setBusy(false); }
  }

  async function removePoi(id) {
    if (!window.confirm('Delete this POI record? This cannot be undone.')) return;
    try {
      const token = await getToken();
      const response = await fetch('/api/pois', { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Delete failed.');
      setPois((items) => items.filter((item) => item.id !== id)); showMessage('POI deleted.', 'success');
    } catch (err) { showMessage(err.message || 'Delete failed.', 'error'); }
  }

  if (!profileReady) return <main className="content-wrap"><p className="spinner-text">Verifying administrator access…</p></main>;

  return <main className="content-wrap"><div className="page-heading"><div><span className="eyebrow">ADMIN CONSOLE</span><h1 style={{marginTop:14}}>Manage points of interest</h1><p>Encrypt POI details in this browser before sending ciphertext to Firestore.</p></div><span className="count-pill">ADMIN ACCESS</span></div>{message && <div role="status" className={`status status-${messageType}`}>{message}</div>}<div className="dashboard-grid"><section className="panel"><h2>Add a point of interest</h2><form className="form-stack" onSubmit={submit}><label htmlFor="passphrase">Shared data passphrase</label><input id="passphrase" type="password" value={passphrase} onChange={(e)=>setPassphrase(e.target.value)} autoComplete="off" minLength={12} placeholder="At least 12 characters" required/><p className="form-help">Share this passphrase with authorized users through a separate secure channel. It is not uploaded or saved by EPLQ.</p><button className="button button-secondary" type="button" onClick={() => loadPois(passphrase)} disabled={loadingPois || passphrase.trim().length < 12}>{loadingPois ? 'Loading records…' : 'Load stored records'}</button><div className="divider"/><label htmlFor="name">Place name</label><input id="name" value={name} onChange={(e)=>setName(e.target.value)} maxLength={120} placeholder="e.g. Central Hospital" required/><div className="inline-fields"><div className="form-stack"><label htmlFor="lat">Latitude</label><input id="lat" type="number" step="any" min="-90" max="90" value={lat} onChange={(e)=>setLat(e.target.value)} placeholder="21.1458" required/></div><div className="form-stack"><label htmlFor="lng">Longitude</label><input id="lng" type="number" step="any" min="-180" max="180" value={lng} onChange={(e)=>setLng(e.target.value)} placeholder="79.0882" required/></div></div><label htmlFor="category">Category</label><select id="category" value={category} onChange={(e)=>setCategory(e.target.value)}>{categories.map((item)=><option key={item} value={item}>{item.replace('_',' ').replace(/\b\w/g,(c)=>c.toUpperCase())}</option>)}</select><label htmlFor="desc">Description</label><textarea id="desc" value={desc} onChange={(e)=>setDesc(e.target.value)} maxLength={1000} placeholder="Useful details for visitors" required/><button className="primary-button" disabled={busy}>{busy ? 'Encrypting and uploading…' : 'Encrypt & upload POI'}</button></form><div className="divider"/><div className="security-callout"><strong>Privacy note:</strong> Firestore receives encrypted POI payloads and operational metadata such as record ID, upload time and creator UID. The server does not receive the POI coordinates in plaintext.</div></section><section className="panel"><div className="panel-head"><h2>Stored POIs</h2><span className="count-pill">{pois.length} decrypted</span></div><p className="form-help" style={{marginTop:-7,marginBottom:16}}>Records appear after the correct shared passphrase is entered.</p>{loadingPois ? <p className="spinner-text">Loading encrypted records…</p> : pois.length ? <div className="poi-list">{pois.map((poi)=><article className="poi-item" key={poi.id}><div><h3>{poi.name}</h3><span className="category-tag">{String(poi.category).replace('_',' ')}</span><p>{poi.desc}</p><p>{Number(poi.lat).toFixed(5)}, {Number(poi.lng).toFixed(5)}</p></div><button className="danger-button" onClick={()=>removePoi(poi.id)}>Delete</button></article>)}</div> : <div className="empty-state">{passphrase.length < 12 ? 'Enter your shared data passphrase to decrypt and list existing records.' : 'No decryptable POIs found. Upload your first place or check the passphrase.'}</div>}</section></div></main>;
}
