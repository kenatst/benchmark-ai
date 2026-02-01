import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Target, Zap, FileText, Play } from 'lucide-react';
import { useState } from 'react';

export const Hero = () => {
  const [isHovered, setIsHovered] = useState(false);

  const features = [
    {
      icon: Target,
      title: "Positionnement & concurrents",
      description: "Analyse sur mesure pour votre secteur et localisation"
    },
    {
      icon: Zap,
      title: "Pricing & go-to-market",
      description: "Recommandations actionnables dès aujourd'hui"
    },
    {
      icon: FileText,
      title: "PDF premium",
      description: "Rapport structuré, partageable et exportable"
    }
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/50 via-background to-background" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-chart-2/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="opacity-0-initial animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Nouveau: Rapports avec collecte web automatique</span>
          </div>

          {/* Headline */}
          <h1 className="opacity-0-initial animate-fade-up stagger-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6 tracking-tight">
            Votre benchmark
            <br />
            <span className="gradient-text">premium en 10 min</span>
          </h1>

          {/* Subheadline */}
          <p className="opacity-0-initial animate-fade-up stagger-2 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Obtenez un rapport d'analyse concurrentielle structuré, avec positionnement, pricing et plan d'action 30/60/90 jours.
          </p>

          {/* CTAs */}
          <div className="opacity-0-initial animate-fade-up stagger-3 flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link to="/app/new">
              <Button size="xl" className="w-full sm:w-auto group">
                Générer mon benchmark
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/example">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                <Play className="w-4 h-4" />
                Voir un exemple
              </Button>
            </Link>
          </div>

          {/* Feature pills */}
          <div className="opacity-0-initial animate-fade-up stagger-4 flex flex-wrap justify-center gap-4 mb-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-border shadow-sm hover-lift"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Product Preview */}
          <div 
            className="opacity-0-initial animate-fade-up stagger-5 relative max-w-4xl mx-auto"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Glow effect */}
            <div className={`absolute -inset-4 bg-gradient-to-r from-primary/20 via-chart-2/20 to-primary/20 rounded-3xl blur-2xl transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-50'}`} />
            
            {/* Browser frame */}
            <div className="relative bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-chart-1/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1.5 rounded-lg bg-background text-xs text-muted-foreground font-medium">
                    benchmark-techstartup-paris.pdf
                  </div>
                </div>
              </div>
              
              {/* Mock report content */}
              <div className="p-8 md:p-12 space-y-6 bg-gradient-to-b from-card to-background">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-8 w-64 bg-foreground/10 rounded-lg" />
                    <div className="h-4 w-48 bg-foreground/5 rounded" />
                  </div>
                  <div className="h-12 w-12 bg-primary/20 rounded-xl" />
                </div>
                
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 rounded-xl bg-accent/50 border border-border">
                      <div className="h-6 w-16 bg-primary/30 rounded mb-2" />
                      <div className="h-3 w-full bg-foreground/5 rounded" />
                    </div>
                  ))}
                </div>
                
                {/* Content blocks */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3 p-5 rounded-xl bg-background border border-border">
                    <div className="h-5 w-32 bg-foreground/10 rounded" />
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-foreground/5 rounded" />
                      <div className="h-3 w-5/6 bg-foreground/5 rounded" />
                      <div className="h-3 w-4/6 bg-foreground/5 rounded" />
                    </div>
                  </div>
                  <div className="space-y-3 p-5 rounded-xl bg-background border border-border">
                    <div className="h-5 w-40 bg-foreground/10 rounded" />
                    <div className="flex gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-1 h-20 bg-primary/10 rounded-lg" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};