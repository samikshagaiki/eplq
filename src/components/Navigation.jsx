"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';

export default function Navigation() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState('');
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    setAccount(user);
    if (user) {
      try {
        const snapshot = await getDoc(doc(db, 'users', user.uid));
        setRole(snapshot.exists() ? snapshot.data().role : '');
      } catch { setRole(''); }
    } else setRole('');
    setReady(true);
  }), []);

  async function logout() {
    await signOut(auth);
    router.push('/');
  }

  return <header className="site-header"><Link href="/" className="brand"><span className="brand-mark">E</span><span>EPLQ <small>Location privacy</small></span></Link><nav className="nav-links"><Link href="/">Home</Link>{ready && account && role === 'admin' && <Link href="/admin/upload">Admin</Link>}{ready && account && role === 'user' && <Link href="/user/search">Nearby search</Link>}{ready && account ? <button className="nav-button" onClick={logout}>Sign out</button> : <><Link href="/login">Sign in</Link><Link href="/login?mode=admin">Admin sign in</Link><Link className="nav-cta" href="/register">Create account</Link></>}</nav></header>;
}
