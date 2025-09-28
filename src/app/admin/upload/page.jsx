'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { encryptPOI } from '@/lib/utils';

export default function AdminUpload() {
  const [name, setName] = useState('');
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [desc, setDesc] = useState('');
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
      if (role !== 'admin') {
        router.push('/');
      }
    });
    return unsubscribe;
  }, [router]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin') return;

    const poi = { name, lat, lng, desc };
    const encrypted = encryptPOI(poi);
    const token = await auth.currentUser?.getIdToken();

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ encrypted }),
    });

    if (res.ok) {
      console.log('POI uploaded'); // Logging
      setName(''); setLat(0); setLng(0); setDesc('');
    } else {
      console.error('Upload failed');
    }
  };

  if (userRole !== 'admin') return <p>Loading...</p>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleUpload} className="p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl mb-4">Upload POI (Admin)</h2>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="block mb-2 p-2 border" required />
        <input type="number" value={lat} onChange={(e) => setLat(Number(e.target.value))} placeholder="Latitude" className="block mb-2 p-2 border" required />
        <input type="number" value={lng} onChange={(e) => setLng(Number(e.target.value))} placeholder="Longitude" className="block mb-2 p-2 border" required />
        <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="block mb-2 p-2 border" required />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Upload</button>
      </form>
    </div>
  );
}