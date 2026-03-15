'use client'

import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-[#0B1220] text-white min-h-screen">

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-28 text-center">

        <div className="inline-block bg-blue-900/40 px-4 py-2 rounded-full text-sm mb-6">
          🔐 Encrypted Privacy-Preserving Location Queries
        </div>

        <h1 className="text-5xl font-bold mb-6 leading-tight">
          Secure Location <br />
          Encryption & Query System
        </h1>

        <p className="text-gray-300 max-w-2xl mx-auto text-lg mb-10">
          EPLQ protects sensitive location data using encryption.
          Users can search nearby locations without revealing
          their real position.
        </p>

        <div className="flex justify-center gap-6">

          <Link
            href="/login"
            className="bg-green-500 px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition"
          >
            Start Searching →
          </Link>

          <Link
            href="/register"
            className="border border-green-400 px-8 py-3 rounded-lg hover:bg-green-400 hover:text-black transition"
          >
            Create Account
          </Link>

        </div>

      </section>

      {/* FEATURES */}
      <section className="bg-white text-black py-20">

        <div className="max-w-6xl mx-auto px-6 text-center">

          <h2 className="text-3xl font-bold mb-12">
            How EPLQ Protects Privacy
          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            <div className="p-8 border rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-3">
                🔐 Encrypted POIs
              </h3>
              <p className="text-gray-600">
                All locations are stored using AES encryption
                ensuring sensitive coordinates remain protected.
              </p>
            </div>

            <div className="p-8 border rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-3">
                📍 Private Queries
              </h3>
              <p className="text-gray-600">
                Users can search nearby locations without revealing
                their actual position to the server.
              </p>
            </div>

            <div className="p-8 border rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-3">
                🗺️ Interactive Maps
              </h3>
              <p className="text-gray-600">
                POIs are displayed on an interactive map with
                accurate distance calculation.
              </p>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}