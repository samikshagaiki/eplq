import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import CryptoJS from 'crypto-js';

const secretKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

export async function POST(req) {

try {

const authHeader = req.headers.get('Authorization');

if (!authHeader?.startsWith('Bearer ')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const token = authHeader.split('Bearer ')[1];

const decoded = await adminAuth.verifyIdToken(token);

const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();

if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

const poi = await req.json();

const encrypted = CryptoJS.AES.encrypt(
  JSON.stringify(poi),
  secretKey
).toString();

await adminDb.collection('pois').add({
  encrypted
});

return NextResponse.json({ success: true });


} catch (error) {


console.error('Upload error:', error);

return NextResponse.json(
  { error: 'Upload failed' },
  { status: 500 }
);


}

}
