import LandingCTA from './LandingCTA';
import LandingFeatures from './LandingFeatures';
import LandingFooter from './LandingFooter';
import LandingHero from './LandingHero';
import LandingHowItWorks from './LandingHowItWorks';
import LandingNav from './LandingNav';
import LandingPain from './LandingPain';
import LandingPreview from './LandingPreview';
import LandingPricing from './LandingPricing';
import LandingTutorHighlight from './LandingTutorHighlight';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <LandingNav />
      <LandingHero />
      <LandingPreview />
      <LandingPain />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingTutorHighlight />
      <LandingPricing />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
