'use client';

import { useEffect,useState } from 'react';
import { auth,db } from '@/lib/firebase';
import { doc,getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { decryptPOI,haversine } from '@/lib/utils';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(()=>import('react-leaflet').then(m=>m.MapContainer),{ssr:false});
const TileLayer = dynamic(()=>import('react-leaflet').then(m=>m.TileLayer),{ssr:false});
const Marker = dynamic(()=>import('react-leaflet').then(m=>m.Marker),{ssr:false});
const Popup = dynamic(()=>import('react-leaflet').then(m=>m.Popup),{ssr:false});
const Circle = dynamic(()=>import('react-leaflet').then(m=>m.Circle),{ssr:false});

export default function UserSearch(){

const [userLat,setUserLat]=useState(0);
const [userLng,setUserLng]=useState(0);
const [range,setRange]=useState(10);
const [results,setResults]=useState([]);
const [userRole,setUserRole]=useState('');
const [loading,setLoading]=useState(false);

const router=useRouter();

useEffect(()=>{

navigator.geolocation.getCurrentPosition((pos)=>{
setUserLat(pos.coords.latitude);
setUserLng(pos.coords.longitude);
});

},[]);

useEffect(()=>{

const unsubscribe = auth.onAuthStateChanged(async(user)=>{

if(!user){
router.push('/login');
return;
}

const userDoc = await getDoc(doc(db,'users',user.uid));
const role = userDoc.data()?.role;

setUserRole(role);

if(role!=='user'){
router.push('/');
}

});

return unsubscribe;

},[]);

const handleSearch = async()=>{

setLoading(true);

try{

const token = await auth.currentUser.getIdToken();

const res = await fetch('/api/pois',{
headers:{Authorization:`Bearer ${token}`}
});

const pois = await res.json();

const decrypted = pois
.map(p=>decryptPOI(p.encrypted))
.filter(Boolean);

const filtered = decrypted.filter(poi =>
haversine(userLat,userLng,poi.lat,poi.lng)<=range
);

setResults(filtered);

}catch(err){
console.error(err);
}

setLoading(false);

};

if(userRole!=='user'){
return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

return(

<div className="min-h-screen bg-gray-50">

<nav className="bg-indigo-600 text-white p-4 flex justify-between">

<h1 className="text-xl font-bold">EPLQ Search</h1>

<button
onClick={()=>{auth.signOut();router.push('/login');}}
className="bg-white text-indigo-600 px-4 py-2 rounded">
Logout </button>

</nav>

<div className="max-w-5xl mx-auto p-6">

<div className="bg-white p-6 rounded shadow">

<h2 className="text-2xl font-bold mb-6">
Search Nearby POIs
</h2>

<div className="grid md:grid-cols-3 gap-4 mb-4">

<input
type="number"
value={userLat}
onChange={(e)=>setUserLat(Number(e.target.value))}
className="border p-3 rounded"
/>

<input
type="number"
value={userLng}
onChange={(e)=>setUserLng(Number(e.target.value))}
className="border p-3 rounded"
/>

<input
type="number"
value={range}
onChange={(e)=>setRange(Number(e.target.value))}
className="border p-3 rounded"
/>

</div>

<button
onClick={handleSearch}
className="w-full bg-green-600 text-white py-3 rounded">

{loading?'Searching...':'Search POIs'}

</button>

</div>

<div className="mt-8 h-96 bg-white rounded shadow">

<MapContainer
center={[userLat,userLng]}
zoom={13}
style={{height:'100%',width:'100%'}}>

<TileLayer
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>

<Marker position={[userLat,userLng]}>
<Popup>You are here</Popup>
</Marker>

<Circle
center={[userLat,userLng]}
radius={range*1000}
pathOptions={{color:'blue',fillOpacity:0.1}}
/>

{results.map((poi,i)=>( <Marker key={i} position={[poi.lat,poi.lng]}> <Popup> <strong>{poi.name}</strong> <br/>
{poi.category} <br/>
{poi.desc} </Popup> </Marker>
))}

</MapContainer>

</div>

{!loading && results.length===0 && (

<p className="text-center text-gray-500 mt-6">
No POIs found within this range.
</p>
)}

</div>

</div>

);

}
