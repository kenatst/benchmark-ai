import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const FinalCTA = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-5xl mx-auto rounded-[3rem] bg-foreground overflow-hidden p-12 md:p-20 dot-pattern">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-lavender/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gold/10 blur-3xl" />
          
          <div className="relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-background leading-[1.1] mb-8">
              Prêt à passer
              <br />
              au <span className="text-gradient-gold italic">niveau supérieur?</span>
            </h2>

            <Link to="/app/new">
              <Button 
                size="xl" 
                className="bg-background text-foreground hover:bg-background/90 shadow-2xl"
              >
                GÉNÉRER MON BENCHMARK
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
