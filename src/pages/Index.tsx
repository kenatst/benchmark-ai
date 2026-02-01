import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { SocialProof } from '@/components/landing/SocialProof';
import { ProblemSolution } from '@/components/landing/ProblemSolution';
import { FeatureCards } from '@/components/landing/FeatureCards';
import { ProductDemo } from '@/components/landing/ProductDemo';
import { SecondaryProof } from '@/components/landing/SecondaryProof';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <SocialProof />
      <ProblemSolution />
      <FeatureCards />
      <ProductDemo />
      <SecondaryProof />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
