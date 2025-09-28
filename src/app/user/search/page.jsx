'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { decryptPOI, haversine } from '@/lib/utils';

export default function UserSearch() {
  const [userLat, setUserLat] = useState(0);
  const [userLng, setUserLng] = useState(0);
  const [range, setRange] = useState(10); // km
  const [results, setResults] = useState([]);
  const [userRole, setUserRole] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.data()?.role;
      setUserRole(role);
      if (role !== 'user') {
        router.push('/');
      }
    });
    return unsubscribe;
  }, [router]);

  const handleSearch = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/pois', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pois = await res.json();

      const decryptedPOIs = pois.map((poi) => decryptPOI(poi.encrypted)).filter(Boolean);
      const filtered = decryptedPOIs.filter((poi) =>
        haversine(userLat, userLng, poi.lat, poi.lng) <= range
      );
      setResults(filtered);
      console.log('Search performed, results:', filtered.length); // Logging
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  if (userRole !== 'user') return <p>Loading...</p>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-8">
      <h2 className="text-2xl mb-4">Search POIs (User)</h2>
      <input type="number" value={userLat} onChange={(e) => setUserLat(Number(e.target.value))} placeholder="Your Latitude" className="mb-2 p-2 border" />
      <input type="number" value={userLng} onChange={(e) => setUserLng(Number(e.target.value))} placeholder="Your Longitude" className="mb-2 p-2 border" />
      <input type="number" value={range} onChange={(e) => setRange(Number(e.target.value))} placeholder="Range (km)" className="mb-4 p-2 border" />
      <button onClick={handleSearch} className="px-4 py-2 bg-green-500 text-white rounded mb-8">Search</button>
      <h3>Results:</h3>
      <ul>
        {results.map((poi, i) => (
          <li key={i} className="mb-2">{poi.name} - {poi.desc} (Lat: {poi.lat}, Lng: {poi.lng})</li>
        ))}
      </ul>
    </div>
  );
}