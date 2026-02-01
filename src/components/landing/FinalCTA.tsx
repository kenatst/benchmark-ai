import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Check } from 'lucide-react';

const benefits = [
  "Livraison instantanée",
  "PDF premium exportable",
  "Plan d'action 30/60/90"
];

export const FinalCTA = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-chart-1/5" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-1/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="opacity-0-initial animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Prêt en 10 minutes</span>
          </div>
          
          <h2 className="opacity-0-initial animate-fade-up stagger-1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Prêt à benchmarker
            <br />
            <span className="gradient-text">votre marché ?</span>
          </h2>
          
          <p className="opacity-0-initial animate-fade-up stagger-2 text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Rejoignez des centaines d'entrepreneurs qui ont déjà clarifié leur positionnement.
          </p>

          {/* Benefits */}
          <div className="opacity-0-initial animate-fade-up stagger-3 flex flex-wrap justify-center gap-4 mb-10">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border"
              >
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="opacity-0-initial animate-fade-up stagger-4">
            <Link to="/app/new">
              <Button size="xl" className="group shadow-lg hover:shadow-xl">
                Générer mon benchmark
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            
            <p className="mt-6 text-muted-foreground">
              À partir de <span className="font-semibold text-foreground">4,99 €</span> — Livré instantanément
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};