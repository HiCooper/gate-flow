import { HeroSection } from '../components/home/HeroSection';
import { TrustSection } from '../components/home/TrustSection';
import { CoreCapabilities } from '../components/home/CoreCapabilities';
import { SDKSection } from '../components/home/SDKSection';
import { Differentiators } from '../components/home/Differentiators';
import { ArchitectureDiagram } from '../components/home/ArchitectureDiagram';
import { ComparisonSection } from '../components/home/ComparisonSection';
import { CTABanner } from '../components/home/CTABanner';

export function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustSection />
      <CoreCapabilities />
      <SDKSection />
      <Differentiators />
      <ArchitectureDiagram />
      <ComparisonSection />
      <CTABanner />
    </>
  );
}
