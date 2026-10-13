import './globals.css';
import 'leaflet/dist/leaflet.css';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: 'EPLQ | Privacy-preserving location queries',
  description: 'A client-side encrypted location-based query prototype using Firebase and local spatial filtering.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><Navigation />{children}<footer className="site-footer"><span>EPLQ · Efficient Privacy-Preserving Location-Based Query</span><span>Prototype · Client-side encryption & local range filtering</span></footer></body></html>;
}
