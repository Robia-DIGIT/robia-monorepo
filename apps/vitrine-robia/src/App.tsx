import { Navbar } from "../src/components/Navbar";
import Hero  from "../src/components/Hero";
import  Problem  from "../src/components/Problem";
import { Solution } from "../src/components/Solution";
import { Features } from "../src/components/Features";
import { Benefits } from "../src/components/Benefits";
import { DashboardShowcase } from "../src/components/DashboardShowcase";
import { Testimonials } from "../src/components/Testimonials";
import { Pricing } from "../src/components/Pricing";
import { FAQ } from "../src/components/FAQ";
import { FinalCTA } from "../src/components/FinalCTA";
import { Footer } from "../src/components/Footer";
import SearchSection from "./components/SearchSection";

export default function App() {
  return (
    <div className="min-h-screen bg-background font-body antialiased">
      <Navbar />
      <main>
        <SearchSection />
        <Hero />
        <Problem />
        <Solution />
        <Features />
        <Benefits />
        <DashboardShowcase />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
