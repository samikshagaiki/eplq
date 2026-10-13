import { NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

async function authenticate(req, allowedRoles = ['admin', 'user']) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return { error: 'Unauthorized', status: 401 };
  try {
    const { adminAuth, adminDb } = getAdminServices();
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    const profile = await adminDb.collection('users').doc(decoded.uid).get();
    const role = profile.data()?.role;
    if (!profile.exists || !allowedRoles.includes(role)) return { error: 'Forbidden', status: 403 };
    return { uid: decoded.uid, role, adminDb };
  } catch (error) {
    console.error('POI API authentication failed:', error.message);
    return { error: error.code?.startsWith('auth/') ? 'Invalid or expired token' : 'Server authentication configuration error', status: error.code?.startsWith('auth/') ? 401 : 500 };
  }
}

export async function GET(req) {
  const user = await authenticate(req);
  if (user.error) return NextResponse.json({ error: user.error }, { status: user.status });
  try {
    const snapshot = await user.adminDb.collection('pois').get();
    const records = snapshot.docs.map((item) => ({ id: item.id, encrypted: item.data().encrypted })).filter((item) => item.encrypted && typeof item.encrypted === 'object');
    return NextResponse.json(records, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('POI fetch failed:', error.message);
    return NextResponse.json({ error: 'Failed to retrieve POIs' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const user = await authenticate(req, ['admin']);
  if (user.error) return NextResponse.json({ error: user.error }, { status: user.status });
  try {
    const { id } = await req.json();
    if (typeof id !== 'string' || !id.trim() || id.length > 150) return NextResponse.json({ error: 'Valid POI ID is required' }, { status: 400 });
    const ref = user.adminDb.collection('pois').doc(id);
    const existing = await ref.get();
    if (!existing.exists) return NextResponse.json({ error: 'POI not found' }, { status: 404 });
    await ref.delete();
    console.info('POI deleted', { id, uid: user.uid });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POI deletion failed:', error.message);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
