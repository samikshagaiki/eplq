"use client";

import Link from 'next/link';
import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await getDoc(doc(db, 'users', credential.user.uid));
      if (!profile.exists() || !['admin', 'user'].includes(profile.data().role)) {
        await signOut(auth); throw new Error('Account profile is missing or invalid. Contact the project administrator.');
      }
      router.replace(profile.data().role === 'admin' ? '/admin/upload' : '/user/search');
    } catch (err) {
      console.error('Login failed:', err.code || err.message);
      const messages = {
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/user-not-found': 'No account exists with this email.',
        'auth/wrong-password': 'Email or password is incorrect.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/network-request-failed': 'Network error. Check your connection.',
      };
      setError(messages[err.code] || err.message || 'Unable to sign in.');
    } finally { setBusy(false); }
  }

  return <main className="auth-page"><section className="auth-card"><span className="eyebrow">WELCOME BACK</span><h1 className="auth-title" style={{marginTop:18}}>Sign in to EPLQ</h1><p className="auth-subtitle">Sign in with your registered account. EPLQ checks your assigned role and opens the matching workspace. Admin accounts must be enabled by the project owner.</p>{error && <div role="alert" className="status status-error">{error}</div>}<form className="form-stack" onSubmit={handleSubmit}><label htmlFor="email">Email address</label><input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" required/><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" required/><button className="primary-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form><p className="form-help">Administrator? Use your admin account here too. After sign-in, accounts assigned the <code>admin</code> role are redirected to the admin console. Public registration cannot create admin accounts.</p><p className="auth-footer">New to EPLQ? <Link href="/register">Create an account</Link></p></section></main>;
}
