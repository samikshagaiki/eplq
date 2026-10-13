const ITERATIONS = 250000;
const encoder = new TextEncoder();

function toBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deriveKey(passphrase, salt) {
  if (typeof passphrase !== 'string' || passphrase.trim().length < 12) {
    throw new Error('Use a shared data passphrase of at least 12 characters.');
  }

  const material = await crypto.subtle.importKey(
    'raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPOI(poi, passphrase) {
  if (!globalThis.crypto?.subtle) throw new Error('Secure Web Crypto is unavailable. Use HTTPS or localhost.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const plaintext = encoder.encode(JSON.stringify(poi));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  return {
    version: 1,
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA-256',
    iterations: ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptPOI(record, passphrase) {
  if (!globalThis.crypto?.subtle) throw new Error('Secure Web Crypto is unavailable. Use HTTPS or localhost.');
  if (!record || record.version !== 1 || record.algorithm !== 'AES-256-GCM' || record.kdf !== 'PBKDF2-SHA-256') {
    throw new Error('Unsupported encrypted POI format.');
  }
  const salt = fromBase64(record.salt);
  const iv = fromBase64(record.iv);
  const ciphertext = fromBase64(record.ciphertext);
  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16 || record.iterations !== ITERATIONS) {
    throw new Error('Invalid encrypted POI record.');
  }
  const key = await deriveKey(passphrase, salt);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext));
}
