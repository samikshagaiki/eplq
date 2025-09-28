import CryptoJS from 'crypto-js';

// Shared secret key (hardcoded for simplicity; in real, use key management)
export const secretKey = 'eplq-secret-key-123';

// Encrypt POI data
export function encryptPOI(poi) {
  const data = JSON.stringify(poi);
  return CryptoJS.AES.encrypt(data, secretKey).toString();
}

// Decrypt POI data
export function decryptPOI(encrypted) {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
    const data = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(data);
  } catch (e) {
    console.error('Decryption failed:', e);
    return null;
  }
}

// Haversine distance (in km)
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}