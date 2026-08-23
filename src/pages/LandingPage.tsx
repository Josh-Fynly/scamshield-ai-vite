import { HeroSection } from '../components/landing/HeroSection';
import { StatsSection } from '../components/landing/StatsSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { ArchitectureSection } from '../components/landing/ArchitectureSection';
import { ScreenshotsSection } from '../components/landing/ScreenshotsSection';
import { PricingSection } from '../components/landing/PricingSection';
import { Footer } from '../components/landing/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <ArchitectureSection />
      <ScreenshotsSection />
      <PricingSection />
      <Footer />
    </div>
  );
}
