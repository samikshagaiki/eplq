import { NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

function validEncryptedRecord(value) {
  return value && typeof value === 'object' && value.version === 1 && value.algorithm === 'AES-256-GCM' && value.kdf === 'PBKDF2-SHA-256' && value.iterations === 250000 && typeof value.salt === 'string' && typeof value.iv === 'string' && typeof value.ciphertext === 'string' && value.ciphertext.length <= 150000;
}

export async function POST(req) {
  try {
    const header = req.headers.get('authorization');
    if (!header?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { adminAuth, adminDb } = getAdminServices();
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    const profile = await adminDb.collection('users').doc(decoded.uid).get();
    if (!profile.exists || profile.data()?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    const body = await req.json();
    if (!validEncryptedRecord(body.encrypted)) return NextResponse.json({ error: 'Invalid encrypted POI payload' }, { status: 400 });
    const ref = await adminDb.collection('pois').add({ encrypted: body.encrypted, createdAt: new Date().toISOString(), createdBy: decoded.uid, formatVersion: 1 });
    console.info('Encrypted POI uploaded', { id: ref.id, uid: decoded.uid });
    return NextResponse.json({ success: true, id: ref.id }, { status: 201 });
  } catch (error) {
  console.error('POI upload failed:', error);

  if (
    typeof error?.code === 'string' &&
    error.code.startsWith('auth/')
  ) {
    return NextResponse.json(
      { error: 'Session expired or invalid. Please sign in again.' },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { error: 'Upload failed. Check Firebase Admin configuration and try again.' },
    { status: 500 }
  );
}
}

