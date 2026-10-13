# EPLQ — Efficient Privacy-Preserving Location-Based Query

A deployable Next.js + Firebase prototype for encrypted Points of Interest (POIs) and browser-side circular range queries.
Deployed Link : https://eplq-hub.vercel.app/

## What this prototype does

- Firebase Authentication with user registration and role-based access.
- Public registration always creates a `user`; an administrator is assigned manually by the project owner.
- Admin-only API routes upload and delete POI records.
- POI details are encrypted in the browser using Web Crypto AES-256-GCM with a PBKDF2-SHA-256-derived key, a unique salt, and a unique IV per record.
- Firestore stores the encrypted payload and operational metadata; the server does not decrypt POI details.
- Users download ciphertext, decrypt it locally with a shared data passphrase, and run category/radius filtering in their browser.
- The user's coordinates, search radius, and category filter are not sent to the EPLQ API.
- Haversine distance is used for exact circular-range membership; a client-side quadtree narrows spatial candidates before exact checks.
- Invalid ciphertext or a wrong passphrase is rejected/skipped rather than shown as a valid result.

## Research scope and honest limitations

The supplied research problem statement describes predicate-only encryption for an inner-product range predicate and a privacy-preserving tree index. No full cryptographic construction or research paper was supplied. This implementation therefore **does not claim to implement the original EPLQ predicate-only encryption scheme**. AES-GCM protects the confidentiality/integrity of each POI payload, but authorized users who know the shared passphrase can decrypt all downloaded POIs. The quadtree is built client-side after decryption; it is not an encrypted or server-side privacy-preserving index. The app downloads all ciphertext records, so the index optimizes local repeated spatial filtering rather than database retrieval. These are prototype limitations, not guarantees of the original research scheme.

## Requirements

- Node.js 20.9+ (recommended for Next.js 16)
- Firebase project with Email/Password Authentication enabled
- Firestore database
- Firebase service account credentials for Next.js API routes

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the six Firebase web configuration values plus the three Firebase Admin values.

   ```bash
   cp .env.example .env.local
   ```

   Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Use `FIREBASE_PRIVATE_KEY` from the service account JSON. If you paste a multiline key into `.env.local`, represent newlines as `\n`. Do not commit `.env.local` or the service-account JSON.

3. In Firebase Console, enable **Authentication → Sign-in method → Email/Password** and create a Firestore database.

4. Publish the rules from `firestore.rules` in Firebase Console → Firestore Database → Rules. The client may create its own profile only with role `user`; POI reads/writes are mediated by server API routes.

5. Start the app:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

## Create an administrator

1. Register a normal account through `/register`.
2. In Firebase Console → Authentication, copy that user's UID.
3. In Firestore, open `users/{UID}` and change the `role` field from `user` to `admin` manually. Do not add a public role selector to registration.
4. Sign out and sign back in. The account can now use `/admin/upload`.

## Shared data passphrase

The admin chooses a data passphrase of at least 12 characters when uploading POIs. Authorized users must receive the same passphrase through a separate trusted channel. It is not stored in Firestore, environment variables, or browser local storage. Losing it means the encrypted POIs cannot be decrypted. Changing it does not re-encrypt existing records automatically. Do not reuse an account password as the data passphrase.

## POI fields

- `name`: place name
- `lat`: latitude from -90 to 90
- `lng`: longitude from -180 to 180
- `category`: hospital, police, fire_station, pharmacy, restaurant, shelter, atm, park, or other
- `desc`: description

## Deploy to Vercel

1. Push this project to GitHub, ensuring `.env.local`, service account JSON, and secrets are excluded.
2. Import the repository into Vercel.
3. Add the six `NEXT_PUBLIC_FIREBASE_*` variables and `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` in Vercel project environment variables.
4. Redeploy after changing variables. Use HTTPS in production; browser geolocation and Web Crypto require a secure context (localhost is also allowed).
5. Deploy the Firestore rules from `firestore.rules`.

## API routes

- `POST /api/upload` — requires a Firebase ID token and admin role; accepts encrypted payload only.
- `GET /api/pois` — requires a valid user/admin token; returns ciphertext records only.
- `DELETE /api/pois` — requires a valid admin token and `{ "id": "..." }`.

## Explain the architecture in a presentation

1. The user authenticates through Firebase Authentication.
2. The API verifies the ID token and checks the Firestore role before privileged actions.
3. The admin enters POI data and a shared passphrase. The browser derives a key using PBKDF2 and encrypts the payload with AES-256-GCM using a fresh salt and IV.
4. Firestore stores the ciphertext. The API does not decrypt it.
5. The user fetches ciphertext and decrypts locally using the shared passphrase.
6. A quadtree returns candidates from a bounding box. Haversine computes exact spherical distance and the app filters by radius/category locally.
7. The browser sends neither user coordinates nor the radius/category query to the API. The server does see authenticated requests, account identity, record IDs, and upload metadata.

## Test checklist

- [ ] A new registration creates a `users/{uid}` profile with `role: user`.
- [ ] A regular user cannot call `POST /api/upload` successfully (403).
- [ ] Admin upload stores an object with `encrypted`, not plaintext POI fields.
- [ ] The wrong passphrase does not reveal a POI.
- [ ] Correct passphrase decrypts and displays the uploaded POI.
- [ ] A search inside the radius includes a POI; one outside is excluded.
- [ ] The browser's `/api/pois` request does not contain coordinates, radius, or category.
- [ ] Non-admin DELETE is rejected; admin DELETE succeeds.
- [ ] Map markers and the radius circle render over HTTPS.
- [ ] Tampered ciphertext fails authenticated decryption.

## Security notes

AES-GCM is authenticated encryption, not predicate-only encryption. The shared passphrase is a prototype key-distribution mechanism; any authorized holder can decrypt all POIs they download. For stronger deployments, implement a vetted searchable/predicate encryption construction with a defined threat model and independently reviewed design. Do not describe this prototype as reproducing the original EPLQ cryptosystem.
