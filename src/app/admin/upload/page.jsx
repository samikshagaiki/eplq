'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { decryptPOI } from '@/lib/utils';

export default function AdminUpload() {

const [name,setName] = useState('');
const [lat,setLat] = useState(0);
const [lng,setLng] = useState(0);
const [desc,setDesc] = useState('');
const [category,setCategory] = useState('restaurant');

const [userRole,setUserRole] = useState('');
const [pois,setPois] = useState([]);

const [loading,setLoading] = useState(false);
const [uploadLoading,setUploadLoading] = useState(false);
const [error,setError] = useState('');

const router = useRouter();

useEffect(()=>{

const unsubscribe = auth.onAuthStateChanged(async(user)=>{

  if(!user){
    router.push('/login');
    return;
  }

  const userDoc = await getDoc(doc(db,'users',user.uid));

  const role = userDoc.data()?.role;

  setUserRole(role);

  if(role!=='admin'){
    router.push('/');
  }

  loadPois();

});

return unsubscribe;


},[]);

const loadPois = async ()=>{

setLoading(true);

try{

  const token = await auth.currentUser.getIdToken();

  const res = await fetch('/api/pois',{
    headers:{
      Authorization:`Bearer ${token}`
    }
  });

  const data = await res.json();

  const decrypted = data
  .map(p=>{
    const poi = decryptPOI(p.encrypted);
    if(!poi) return null;
    return {...poi,id:p.id};
  })
  .filter(Boolean);

  setPois(decrypted);

}catch(err){

  setError('Failed to load POIs');

}finally{

  setLoading(false);

}


};

const handleUpload = async(e)=>{


e.preventDefault();

setUploadLoading(true);
setError('');

try{

  const token = await auth.currentUser.getIdToken();

  const poi = {
    name,
    lat,
    lng,
    desc,
    category
  };

  const res = await fetch('/api/upload',{
    method:'POST',
    headers:{
      Authorization:`Bearer ${token}`,
      'Content-Type':'application/json'
    },
    body:JSON.stringify(poi)
  });

  if(res.ok){

    setName('');
    setLat(0);
    setLng(0);
    setDesc('');

    loadPois();

  }else{

    setError('Upload failed');

  }

}catch(err){

  setError('Upload failed');

}

setUploadLoading(false);

};

const handleDelete = async(id)=>{


if(!confirm('Delete this POI permanently?')) return;

const token = await auth.currentUser.getIdToken();

const res = await fetch('/api/pois', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

if(res.ok){
  loadPois();
}


};

const handleLogout = async()=>{

await auth.signOut();

router.push('/login');


};

if(userRole!=='admin'){
return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

return(

  <div className="min-h-screen bg-gray-50">


<nav className="bg-indigo-600 text-white p-4 flex justify-between">

  <h1 className="text-xl font-bold">
  EPLQ Admin Dashboard
  </h1>

  <button
  onClick={handleLogout}
  className="bg-white text-indigo-600 px-4 py-2 rounded">
  Logout
  </button>

</nav>


<div className="max-w-6xl mx-auto p-6 grid lg:grid-cols-2 gap-8">

  <div className="bg-white p-8 rounded-2xl shadow">

    <h2 className="text-2xl font-bold mb-6">
    Upload POI
    </h2>

    <form onSubmit={handleUpload} className="space-y-4">

      <input
      type="text"
      placeholder="POI Name"
      value={name}
      onChange={(e)=>setName(e.target.value)}
      className="w-full border p-3 rounded"
      required
      />

      <input
      type="number"
      placeholder="Latitude"
      value={lat}
      onChange={(e)=>setLat(Number(e.target.value))}
      className="w-full border p-3 rounded"
      required
      />

      <input
      type="number"
      placeholder="Longitude"
      value={lng}
      onChange={(e)=>setLng(Number(e.target.value))}
      className="w-full border p-3 rounded"
      required
      />

      <input
      type="text"
      placeholder="Description"
      value={desc}
      onChange={(e)=>setDesc(e.target.value)}
      className="w-full border p-3 rounded"
      required
      />

      <select
      value={category}
      onChange={(e)=>setCategory(e.target.value)}
      className="w-full border p-3 rounded">

        <option value="restaurant">Restaurant</option>
        <option value="hospital">Hospital</option>
        <option value="hotel">Hotel</option>
        <option value="atm">ATM</option>
        <option value="park">Park</option>

      </select>

      <button
      type="submit"
      className="w-full bg-indigo-600 text-white py-3 rounded">

      {uploadLoading?'Uploading...':'Upload POI'}

      </button>

    </form>

  </div>


  <div className="bg-white p-8 rounded-2xl shadow">

    <h2 className="text-2xl font-bold mb-6">
    All POIs ({pois.length})
    </h2>

    {loading ? (

      <p>Loading...</p>

    ):pois.length===0?(
      
      <p>No POIs found</p>

    ):(
      
      <div className="space-y-4">

      {pois.map(poi=>(
        
        <div key={poi.id} className="bg-gray-50 p-4 rounded flex justify-between">

          <div>

            <p className="font-semibold">{poi.name}</p>

            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
            {poi.category}
            </span>

            <p className="text-sm text-gray-600">
            {poi.desc}
            </p>

            <p className="text-xs text-gray-500">
            {poi.lat}, {poi.lng}
            </p>

          </div>

          <button
          onClick={()=>handleDelete(poi.id)}
          className="text-red-500">
          Delete
          </button>

        </div>

      ))}

      </div>

    )}

  </div>

</div>

  </div>

);

}
