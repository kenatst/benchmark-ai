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
            <span className="badge-coral">INTELLIGENCE CONCURRENTIELLE</span>
            <span className="badge-sky">RAPPORT STRATÉGIQUE</span>
            <span className="badge-mint">GÉNÉRÉ PAR IA</span>
          </div>

          {/* Headline */}
          <h1 className="opacity-0-initial animate-fade-up stagger-1 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-foreground leading-[0.95] mb-6">
            Votre benchmark
            <br />
            <span className="text-gradient-lavender italic">en 3 minutes.</span>
          </h1>

          {/* Subheadline */}
          <p className="opacity-0-initial animate-fade-up stagger-2 text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Analyse concurrentielle, stratégie tarifaire et plan d'action&nbsp;&mdash; un rapport de qualité cabinet-conseil, généré par <span className="text-foreground font-bold">IA de pointe</span>.
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

          {/* Value props line */}
          <div className="opacity-0-initial animate-fade-up stagger-4 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-mint" />
              À partir de 14,99€
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-coral" />
              3 étapes, 3 minutes
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky" />
              PDF professionnel inclus
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
