import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-background font-['Inter',sans-serif] antialiased">
      <Navbar />
      <main>
        {/* L'Outlet est la zone où les pages comme Home vont s'afficher */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}