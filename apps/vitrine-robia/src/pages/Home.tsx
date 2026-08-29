import Hero from "../components/Hero";
import Problem from "../components/Problem";
import { Solution } from "../components/Solution";
import { Features } from "../components/Features";
import { Benefits } from "../components/Benefits";
import { DashboardShowcase } from "../components/DashboardShowcase";
import { Testimonials } from "../components/Testimonials";
import { Pricing } from "../components/Pricing";
import { FAQ } from "../components/FAQ";
import { FinalCTA } from "../components/FinalCTA";
import SearchSection from "../components/SearchSection";
import { Seo } from "../components/Seo";

export default function Home() {
  return (
    <>
      <Seo
        title="ROBIA Copilot | Visibilité locale et SEO à Madagascar"
        description="ROBIA Copilot analyse votre visibilité locale, détecte vos opportunités SEO et transforme vos données en actions concrètes à Madagascar."
        canonicalPath="/"
      />
      <Hero />
      <SearchSection />
      <Problem />
      <Solution />
      <Features />
      <Benefits />
      <DashboardShowcase />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}
