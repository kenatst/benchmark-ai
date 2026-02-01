import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: "Standard",
    price: "4,99",
    description: "Benchmark de positionnement essentiel",
    icon: Zap,
    features: [
      "Questionnaire guidé (10 min)",
      "Analyse de positionnement",
      "Recommandations pricing",
      "Plan d'action 30/60/90",
      "PDF premium exportable",
      "Jusqu'à 5 concurrents (URLs fournis)"
    ],
    cta: "Générer mon benchmark",
    popular: false,
    color: "border-border hover:border-primary/30"
  },
  {
    name: "Pro",
    price: "14,99",
    description: "Collecte web automatique incluse",
    icon: Sparkles,
    features: [
      "Tout du plan Standard",
      "Collecte web automatique",
      "10 concurrents analysés",
      "Sources citées et vérifiées",
      "Analyse de sentiment marché",
      "Benchmark pricing détaillé"
    ],
    cta: "Choisir Pro",
    popular: true,
    color: "border-primary shadow-lg shadow-primary/10"
  },
  {
    name: "Agence",
    price: "29",
    description: "Multi-localisations & branding",
    icon: Crown,
    features: [
      "Tout du plan Pro",
      "Jusqu'à 3 localisations",
      "Branding personnalisé",
      "Export multi-formats",
      "Comparatif inter-marchés",
      "Support prioritaire"
    ],
    cta: "Choisir Agence",
    popular: false,
    color: "border-border hover:border-primary/30"
  }
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 md:py-32 bg-card relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-chart-2/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary font-medium mb-3 opacity-0-initial animate-fade-up">Tarifs simples</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 opacity-0-initial animate-fade-up stagger-1">
            Un prix, pas de surprise
          </h2>
          <p className="text-lg text-muted-foreground opacity-0-initial animate-fade-up stagger-2">
            Payez par rapport. Pas d'abonnement, pas d'engagement.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={plan.name}
              className={`opacity-0-initial animate-fade-up stagger-${index + 3} relative bg-background rounded-3xl p-8 border-2 ${plan.color} transition-all duration-300 hover:-translate-y-1`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary rounded-full text-primary-foreground text-sm font-medium">
                  Populaire
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl ${plan.popular ? 'bg-primary/20' : 'bg-accent'} flex items-center justify-center`}>
                  <plan.icon className={`w-6 h-6 ${plan.popular ? 'text-primary' : 'text-primary'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">{plan.price} €</span>
                <span className="text-muted-foreground ml-1">/ rapport</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-muted-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/app/new" className="block">
                <Button 
                  className="w-full group" 
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
        
        <p className="text-center text-muted-foreground text-sm mt-12 max-w-2xl mx-auto">
          Tous les rapports incluent un PDF premium exportable et partageable. 
          Garantie satisfaction 24h — régénération gratuite si le rapport ne correspond pas à vos attentes.
        </p>
      </div>
    </section>
  );
};