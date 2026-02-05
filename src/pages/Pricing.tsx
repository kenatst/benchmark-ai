import { Link } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check, X, Zap, Sparkles, Crown, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: "Standard",
    price: "14,99",
    description: "Diagnostic stratégique essentiel",
    icon: Zap,
    color: 'card-sky',
    features: [
      { text: '3-5 concurrents analysés', included: true },
      { text: 'Positionnement & recommandations pricing', included: true },
      { text: 'Plan d\'action 30/60/90 jours', included: true },
      { text: 'Multi-localisations comparées', included: true },
      { text: 'Projections financières', included: true },
      { text: 'Sources citées', included: true },
      { text: 'PDF standard', included: true },
      { text: 'Customer insights & white spaces', included: false },
      { text: 'Analyse PESTEL/Porter/SWOT', included: false },
    ],
    cta: "Générer mon benchmark",
    popular: false
  },
  {
    name: "Pro",
    price: "34,99",
    description: "Intelligence compétitive approfondie",
    icon: Sparkles,
    color: 'card-lavender',
    features: [
      { text: '5-10 concurrents (profils détaillés)', included: true },
      { text: 'Positionnement + taglines + messaging', included: true },
      { text: 'Analyse pricing concurrentielle', included: true },
      { text: 'Customer insights & white spaces', included: true },
      { text: 'Plan d\'action avec quick wins', included: true },
      { text: '1-2 marchés multi-localisations', included: true },
      { text: 'Projections financières', included: true },
      { text: 'PDF premium', included: true },
      { text: 'Analyse PESTEL/Porter/SWOT', included: false },
    ],
    cta: "Choisir Pro",
    popular: true
  },
  {
    name: "Agence",
    price: "69,99",
    description: "Rapport institutionnel complet",
    icon: Crown,
    color: 'card-mint',
    features: [
      { text: '10-15 concurrents (deep dive)', included: true },
      { text: 'Agency-grade (PESTEL, Porter, SWOT)', included: true },
      { text: 'Stratégie complète brand & pricing', included: true },
      { text: 'Modèle économique + unit economics', included: true },
      { text: 'Roadmap 12 mois phasée avec KPIs', included: true },
      { text: 'Analyse comparative multi-marchés', included: true },
      { text: '3 scénarios financiers', included: true },
      { text: 'Sources catégorisées & auditées', included: true },
      { text: 'PDF haute qualité', included: true },
    ],
    cta: "Choisir Agence",
    popular: false
  }
];

const faqs = [
  {
    question: 'Combien de temps faut-il pour générer un rapport ?',
    answer: 'La plupart des rapports sont générés en 2-5 minutes après le paiement. Les rapports Agence avec plus de sections peuvent prendre un peu plus de temps.'
  },
  {
    question: 'Quelles informations dois-je fournir ?',
    answer: 'Vous répondrez à des questions sur votre entreprise, secteur, localisation, pricing, différenciateurs, et vos concurrents. Plus vous fournissez de détails, plus le rapport sera précis et actionnable.'
  },
  {
    question: 'Quelle est la différence entre Standard et Pro ?',
    answer: 'Le plan Standard offre un diagnostic stratégique essentiel avec 3-5 concurrents. Le plan Pro ajoute des profils concurrentiels détaillés (5-10), des customer insights, du messaging/taglines, et une analyse pricing approfondie.'
  },
  {
    question: 'Quel est le format du rapport ?',
    answer: 'Tous les rapports sont livrés en PDF haute qualité, prêts à être présentés. Le niveau de détail et le nombre de sections varient selon la formule choisie.'
  },
  {
    question: 'Puis-je ajouter des URLs de concurrents ?',
    answer: 'Oui ! Quand vous fournissez des URLs de concurrents, nous les citons dans votre rapport. Plus vous en fournissez, plus l\'analyse sera riche.'
  },
  {
    question: 'Est-ce un conseil juridique ou financier ?',
    answer: 'Non. C\'est un outil d\'aide à la décision. Vous devez valider les recommandations et consulter des professionnels pour les décisions juridiques ou financières.'
  }
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 md:pt-40 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-3 text-sm text-muted-foreground mb-6">
              <div className="w-8 h-0.5 bg-gold rounded-full" />
              <span className="font-semibold tracking-wide">TARIFICATION</span>
              <div className="w-8 h-0.5 bg-gold rounded-full" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6 opacity-0-initial animate-fade-up">
              Un prix simple,{' '}
              <span className="text-gradient-lavender italic">zéro surprise</span>
            </h1>
            <p className="text-lg text-muted-foreground opacity-0-initial animate-fade-up stagger-1">
              Payez par rapport. Pas d'abonnement, pas d'engagement. Choisissez le niveau de détail dont vous avez besoin.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-32">
            {plans.map((plan, index) => (
              <div 
                key={plan.name}
                className={`opacity-0-initial animate-fade-up relative rounded-[2rem] p-8 border ${plan.color} ${
                  plan.popular 
                    ? 'ring-2 ring-lavender shadow-xl' 
                    : ''
                } transition-all duration-500 hover-lift`}
                style={{ animationDelay: `${(index + 2) * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-lavender text-xs">
                    POPULAIRE
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-foreground text-xl">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center border border-border">
                    <plan.icon className="w-6 h-6 text-foreground" />
                  </div>
                </div>
                
                <div className="mb-8">
                  <span className="text-4xl font-black text-foreground">{plan.price} €</span>
                  <span className="text-muted-foreground ml-1">/ rapport</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      {feature.included ? (
                        <div className="w-5 h-5 rounded-full bg-mint/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-mint-foreground" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <X className="w-3 h-3 text-muted-foreground/50" />
                        </div>
                      )}
                      <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                        {feature.text}
                      </span>
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

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 text-sm text-muted-foreground mb-6">
                <div className="w-8 h-0.5 bg-sky rounded-full" />
                <span className="font-semibold tracking-wide">FAQ</span>
                <div className="w-8 h-0.5 bg-sky rounded-full" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground opacity-0-initial animate-fade-up">
                Questions fréquentes
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card rounded-2xl border border-border px-6 data-[state=open]:border-lavender/50 transition-colors"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline py-5 font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
