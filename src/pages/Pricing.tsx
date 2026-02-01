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
    popular: false
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
    popular: true
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
    popular: false
  }
];

const faqs = [
  {
    question: 'Combien de temps faut-il pour générer un rapport ?',
    answer: 'La plupart des rapports sont générés en moins de 2 minutes après avoir complété le questionnaire et le paiement. Les rapports complexes avec beaucoup de concurrents peuvent prendre jusqu\'à 5 minutes.'
  },
  {
    question: 'Quelles informations dois-je fournir ?',
    answer: 'Vous répondrez à des questions sur votre entreprise, secteur, localisation, pricing, différenciateurs, et optionnellement vos concurrents. Plus vous fournissez de détails, plus le rapport sera précis.'
  },
  {
    question: 'Puis-je obtenir un remboursement ?',
    answer: 'Oui ! Si votre rapport ne répond pas à vos attentes, contactez-nous dans les 24 heures pour un remboursement complet. Sans justification.'
  },
  {
    question: 'Quel est le format du rapport ?',
    answer: 'Les rapports sont livrés en PDF premium que vous pouvez télécharger, imprimer, et partager avec votre équipe ou vos partenaires.'
  },
  {
    question: 'Puis-je ajouter des URLs de concurrents ?',
    answer: 'Oui ! Quand vous fournissez des URLs de concurrents, nous les analysons et les citons dans votre rapport. Nous n\'inventons jamais de sources.'
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
      
      <main className="flex-1 pt-24 md:pt-32 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary font-medium mb-3 opacity-0-initial animate-fade-up">Tarifs</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 opacity-0-initial animate-fade-up stagger-1">
              Un prix simple,{' '}
              <span className="gradient-text">pas de surprise</span>
            </h1>
            <p className="text-lg text-muted-foreground opacity-0-initial animate-fade-up stagger-2">
              Payez par rapport. Pas d'abonnement, pas d'engagement. Choisissez le niveau de détail dont vous avez besoin.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-24">
            {plans.map((plan, index) => (
              <div 
                key={plan.name}
                className={`opacity-0-initial animate-fade-up relative bg-card rounded-3xl p-8 border-2 ${
                  plan.popular 
                    ? 'border-primary shadow-lg shadow-primary/10' 
                    : 'border-border hover:border-primary/30'
                } transition-all duration-300 hover:-translate-y-1`}
                style={{ animationDelay: `${(index + 3) * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary rounded-full text-primary-foreground text-sm font-medium">
                    Populaire
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${plan.popular ? 'bg-primary/20' : 'bg-accent'} flex items-center justify-center`}>
                    <plan.icon className="w-6 h-6 text-primary" />
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

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12 opacity-0-initial animate-fade-up">
              Questions fréquentes
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card rounded-2xl border border-border px-6 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline py-5">
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