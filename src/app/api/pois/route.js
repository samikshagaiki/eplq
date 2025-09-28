import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token); // Just check logged in

    const snapshot = await adminDb.collection('pois').get();
    const pois = snapshot.docs.map((doc) => ({ id: doc.id, encrypted: doc.data().encrypted }));
    console.log('POIs fetched:', pois.length); // Logging
    return NextResponse.json(pois);
  } catch (error) {
    console.error('Fetch POIs error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}