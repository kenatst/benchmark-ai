import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { SocialProof } from '@/components/landing/SocialProof';
import { ProblemSolution } from '@/components/landing/ProblemSolution';
import { FeatureCards } from '@/components/landing/FeatureCards';
import { ProductDemo } from '@/components/landing/ProductDemo';
import { SecondaryProof } from '@/components/landing/SecondaryProof';
import { PricingSection } from '@/components/landing/PricingSection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';
import { FloatingCharts } from '@/components/landing/FloatingCharts';

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <FloatingCharts />
      
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <SocialProof />
        <FeatureCards />
        <ProblemSolution />
        <ProductDemo />
        <SecondaryProof />
        <PricingSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
