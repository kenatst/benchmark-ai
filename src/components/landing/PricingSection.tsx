import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, X, ArrowRight, Zap, Sparkles, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Standard',
    price: '4,99€',
    description: 'Diagnostic & plan d\'action',
    color: 'card-sky',
    icon: Zap,
    badge: null,
    features: [
      { text: '2000-3000 mots', included: true },
      { text: '3-5 concurrents (URLs fournis)', included: true },
      { text: 'Sections stratégie basique', included: true },
      { text: 'Messaging simple', included: true },
      { text: 'Recommandations pricing', included: true },
      { text: 'Plan d\'action 30/60/90 jours', included: true },
      { text: 'Sources citées (si URLs fournis)', included: true },
      { text: 'PDF standard', included: true },
      { text: 'Recherche web automatique', included: false },
      { text: 'Multi-localisations', included: false },
      { text: 'Projections financières', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '14,99€',
    description: 'Avec collecte web automatique',
    color: 'card-lavender',
    icon: Sparkles,
    badge: 'POPULAIRE',
    features: [
      { text: '4000-6000 mots', included: true },
      { text: '5-10 concurrents (recherchés)', included: true },
      { text: 'Sections stratégie intermédiaire', included: true },
      { text: 'Positionnement + taglines', included: true },
      { text: 'Analyse concurrentielle pricing', included: true },
      { text: 'Plan d\'action avec preuves', included: true },
      { text: '10-20 sources citées', included: true },
      { text: 'PDF premium', included: true },
      { text: 'Recherche web automatique', included: true },
      { text: '1-2 marchés multi-localisations', included: true },
      { text: 'Projections financières basiques', included: true },
    ],
  },
  {
    name: 'Agence',
    price: '29€',
    description: 'Multi-localisations & branding',
    color: 'card-mint',
    icon: Crown,
    badge: null,
    features: [
      { text: '8000-12000 mots', included: true },
      { text: '10-15 concurrents (deep dive)', included: true },
      { text: 'Agency-grade (PESTEL, Porter...)', included: true },
      { text: 'Stratégie complète brand', included: true },
      { text: 'Modèle économique complet', included: true },
      { text: 'Roadmap 12 mois phasé', included: true },
      { text: '30-50 sources catégorisées', included: true },
      { text: 'PDF + Excel + Slides deck', included: true },
      { text: 'Recherche multi-sources approfondie', included: true },
      { text: 'Analyse comparative multi-marchés', included: true },
      { text: 'Scénarios + unit economics', included: true },
    ],
  },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 md:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 text-sm text-muted-foreground mb-6">
            <div className="w-8 h-0.5 bg-gold rounded-full" />
            <span className="font-semibold tracking-wide">TARIFICATION</span>
            <div className="w-8 h-0.5 bg-gold rounded-full" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-4">
            Un prix,
            <span className="text-gradient-lavender italic"> zéro surprise.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Choisissez le format qui correspond à vos besoins. Paiement unique, pas d'abonnement.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`opacity-0-initial animate-fade-up stagger-${index + 1} relative rounded-[2rem] p-8 border ${plan.color} hover-lift transition-all duration-500`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-lavender text-xs">
                  {plan.badge}
                </div>
              )}

              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center border border-border">
                  <plan.icon className="w-6 h-6 text-foreground" />
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">/rapport</span>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-mint-foreground flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? 'text-foreground' : 'text-muted-foreground/60'}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <Link to="/app/new">
                <Button 
                  className="w-full" 
                  variant={index === 1 ? 'default' : 'outline'}
                >
                  Commencer
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
