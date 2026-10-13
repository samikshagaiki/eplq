"use client";

import Link from 'next/link';
import { useState } from 'react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setSuccess(''); setBusy(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        email: credential.user.email,
        role: 'user',
        createdAt: new Date().toISOString(),
      });
      await signOut(auth);
      setSuccess('Account created. You can now sign in.');
      setTimeout(() => router.push('/login'), 700);
    } catch (err) {
      console.error('Registration failed:', err.code || err.message);
      const messages = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/weak-password': 'Choose a password with at least 8 characters.',
        'auth/network-request-failed': 'Network error. Check your connection.',
      };
      setError(messages[err.code] || err.message || 'Unable to create account.');
    } finally { setBusy(false); }
  }

  return <main className="auth-page"><section className="auth-card"><span className="eyebrow">CREATE YOUR ACCOUNT</span><h1 className="auth-title" style={{marginTop:18}}>Join EPLQ</h1><p className="auth-subtitle">Create a user account to search for nearby points of interest privately.</p>{error && <div role="alert" className="status status-error">{error}</div>}{success && <div role="status" className="status status-success">{success}</div>}<form className="form-stack" onSubmit={handleSubmit}><label htmlFor="email">Email address</label><input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" required/><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" minLength={8} required/><p className="form-help">New accounts are always created with the user role. An administrator must be assigned manually by the project owner.</p><button className="primary-button" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button></form><p className="auth-footer">Already registered? <Link href="/login">Sign in</Link></p></section></main>;
}
