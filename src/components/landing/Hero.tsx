import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Target, Zap, FileText } from 'lucide-react';

export const Hero = () => {
  const bullets = [
    {
      icon: Target,
      text: "Positioning + competitor snapshot tailored to your sector and location"
    },
    {
      icon: Zap,
      text: "Pricing & go-to-market recommendations you can act on today"
    },
    {
      icon: FileText,
      text: "Beautiful PDF report, structured, shareable, and export-ready"
    }
  ];

  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-8">
            Get a premium benchmark report for your business in{' '}
            <span className="text-primary">10 minutes</span>
          </h1>

          {/* Value bullets */}
          <div className="flex flex-col md:flex-row justify-center gap-6 mb-10">
            {bullets.map((bullet, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 text-left md:max-w-xs"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <bullet.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {bullet.text}
                </p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link to="/app/new">
              <Button size="lg" className="w-full sm:w-auto text-base px-8">
                Generate my benchmark
              </Button>
            </Link>
            <Link to="/example">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto text-base">
                See an example report
              </Button>
            </Link>
          </div>

          {/* Product Screenshot Mockup */}
          <div className="relative max-w-3xl mx-auto">
            <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-chart-4/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-background rounded px-4 py-1 text-xs text-muted-foreground">
                    benchmark-report.pdf
                  </div>
                </div>
              </div>
              
              {/* Mock report preview */}
              <div className="p-6 md:p-8 space-y-4">
                <div className="h-6 bg-foreground/10 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-foreground/5 rounded w-full" />
                <div className="h-4 bg-foreground/5 rounded w-5/6" />
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="h-24 bg-primary/10 rounded-lg" />
                  <div className="h-24 bg-primary/10 rounded-lg" />
                  <div className="h-24 bg-primary/10 rounded-lg" />
                </div>
                <div className="h-4 bg-foreground/5 rounded w-full mt-6" />
                <div className="h-4 bg-foreground/5 rounded w-4/5" />
              </div>
            </div>
            
            {/* Decorative gradient */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 rounded-2xl -z-10 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};
