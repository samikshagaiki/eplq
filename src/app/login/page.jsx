'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';

export default function Login() {

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const router = useRouter();

const handleLogin = async (e) => {
e.preventDefault();
setError('');


try {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

  const role = userDoc.data()?.role || 'user';

  if (role === 'admin') {
    router.push('/admin/upload');
  } else {
    router.push('/user/search');
  }

} catch (err) {
  setError('Invalid email or password');
  console.error(err);
}


};

return ( <div className="min-h-screen flex items-center justify-center bg-gray-100">

  <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md">

    <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
      EPLQ Login
    </h2>

    <form onSubmit={handleLogin} className="space-y-5">

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        className="w-full border px-4 py-3 rounded-lg"
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
        className="w-full border px-4 py-3 rounded-lg"
        required
      />

      {error && (
        <p className="text-red-500 text-center">{error}</p>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
      >
        Login
      </button>

    </form>

    <p className="text-center mt-6 text-gray-600">
      Don't have an account?
      <a href="/register" className="text-blue-600 ml-1">
        Register
      </a>
    </p>

  </div>

</div>

);
}
