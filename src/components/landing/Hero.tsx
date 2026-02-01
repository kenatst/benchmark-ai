import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-24 pb-12 dot-pattern">
      {/* Floating decorative elements */}
      <div className="absolute top-32 left-16 w-24 h-24 rounded-full bg-lavender/30 blur-3xl animate-float-slow" />
      <div className="absolute top-48 right-24 w-36 h-36 rounded-full bg-coral/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-32 left-1/4 w-32 h-32 rounded-full bg-sky/20 blur-3xl animate-float-slow" style={{ animationDelay: '4s' }} />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Feature badges */}
          <div className="opacity-0-initial animate-fade-up flex flex-wrap justify-center gap-3 mb-8">
            <span className="badge-coral">ANALYSE VECTORIELLE</span>
            <span className="badge-sky">DESIGN PREMIUM</span>
            <span className="badge-mint">SÉRÉNITÉ TOTALE</span>
          </div>

          {/* Headline */}
          <h1 className="opacity-0-initial animate-fade-up stagger-1 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-foreground leading-[0.95] mb-6">
            Le benchmark
            <br />
            <span className="text-gradient-lavender italic">augmenté.</span>
          </h1>

          {/* Subheadline */}
          <p className="opacity-0-initial animate-fade-up stagger-2 text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Dites adieu aux études de marché froides. <span className="text-foreground font-bold underline decoration-lavender decoration-4 underline-offset-4">BenchmarkAI</span> fusionne élégance et puissance pour votre positionnement.
          </p>

          {/* CTAs */}
          <div className="opacity-0-initial animate-fade-up stagger-3 flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link to="/app/new">
              <Button size="xl" className="w-full sm:w-auto group shadow-2xl hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-5 h-5 mr-2" />
                GÉNÉRER MON BENCHMARK
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/example">
              <Button variant="lavender" size="xl" className="w-full sm:w-auto gap-2 hover:scale-105 transition-transform duration-300">
                VOIR UN EXEMPLE
                <span className="text-xs bg-lavender/50 px-2 py-0.5 rounded-full">PDF</span>
              </Button>
            </Link>
          </div>

          {/* Social proof line */}
          <div className="opacity-0-initial animate-fade-up stagger-4 flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="w-8 h-0.5 bg-sky rounded-full" />
            <span className="font-medium tracking-wide">REJOINT PAR LES MEILLEURS ENTREPRENEURS</span>
          </div>
        </div>
      </div>
    </section>
  );
};
