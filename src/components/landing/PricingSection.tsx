import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Standard',
    price: '4,99€',
    description: 'Diagnostic & plan d\'action',
    color: 'card-sky',
    badge: null,
    features: [
      'Rapport structuré en PDF',
      'Jusqu\'à 5 concurrents',
      'Analyse de positionnement',
      'Recommandations pricing',
      'Plan d\'action 30/60/90 jours',
    ],
  },
  {
    name: 'Pro',
    price: '14,99€',
    description: 'Avec collecte web automatique',
    color: 'card-lavender',
    badge: 'POPULAIRE',
    features: [
      'Tout du Standard',
      'Collecte web automatique',
      'Jusqu\'à 10 concurrents',
      'Sources & citations',
      'Analyse approfondie',
      'Support prioritaire',
    ],
  },
  {
    name: 'Agence',
    price: '29€',
    description: 'Multi-localisations & branding',
    color: 'card-mint',
    badge: null,
    features: [
      'Tout du Pro',
      'Multi-localisations',
      'Branding personnalisé',
      'Export marque blanche',
      'API access',
      'Account manager dédié',
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

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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

              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/rapport</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-mint-foreground flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
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
