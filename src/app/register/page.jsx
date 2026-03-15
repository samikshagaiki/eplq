'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';

export default function Register() {

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [role, setRole] = useState('user');
const router = useRouter();

const handleRegister = async (e) => {
e.preventDefault();

try {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  await setDoc(doc(db, 'users', user.uid), {
    email,
    role
  });

  console.log('User registered:', user.uid);

  router.push('/login');

} catch (error) {
  console.error('Registration error:', error);
  alert('Registration failed');
}


};

return ( <div className="min-h-screen flex items-center justify-center bg-gray-100">

  <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md">

    <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
      Create EPLQ Account
    </h2>

    <form onSubmit={handleRegister} className="space-y-5">

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

      <select
        value={role}
        onChange={(e)=>setRole(e.target.value)}
        className="w-full border px-4 py-3 rounded-lg"
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
      >
        Register
      </button>

    </form>

  </div>

</div>

);
}
