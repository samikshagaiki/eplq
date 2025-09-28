'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">EPLQ: Privacy-Preserving Location-Based Query</h1>
      <div className="space-x-4">
        <Link href="/register" className="px-4 py-2 bg-blue-500 text-white rounded">Register</Link>
        <Link href="/login" className="px-4 py-2 bg-green-500 text-white rounded">Login</Link>
      </div>
    </div>
  );
}