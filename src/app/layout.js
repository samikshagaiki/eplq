import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "EPLQ - Privacy Preserving Location Queries",
  description: "Secure encrypted location query system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>

        {/* NAVBAR */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

            <Link href="/" className="text-xl font-bold text-blue-600">
              🔒 EPLQ
            </Link>

            <div className="flex gap-6 items-center text-gray-700">
              <Link href="/">Home</Link>
              <Link href="/login">Login</Link>

              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>

          </div>
        </nav>

        {children}

      </body>
    </html>
  );
}