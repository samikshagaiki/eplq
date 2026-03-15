import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function DELETE(req, { params }) {

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

await adminDb.collection('pois').doc(params.id).delete();

return NextResponse.json({ success: true });


} catch (error) {


console.error('Delete error:', error);

return NextResponse.json(
  { error: 'Delete failed' },
  { status: 500 }
);

}

}
