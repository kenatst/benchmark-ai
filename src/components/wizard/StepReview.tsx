import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReportInput } from '@/types/report';
import { Check, CreditCard, Sparkles, Target, BarChart3 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface StepReviewProps {
  data: ReportInput;
  onPayment: (plan: 'standard' | 'pro' | 'agency') => void;
  isProcessing: boolean;
}

const plans = [
  {
    id: 'standard',
    name: 'Standard',
    price: '4,99€',
    priceValue: 499,
    description: '2000-3000 mots',
    features: [
      '3-5 concurrents analysés',
      'PDF standard',
      'Sources citées (URLs fournies)',
    ],
    icon: Sparkles,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '14,99€',
    priceValue: 1499,
    description: '4000-6000 mots',
    features: [
      '5-10 concurrents analysés',
      'Recherche web automatique',
      'Vérification des sources',
      'PDF premium',
    ],
    icon: Target,
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agence',
    price: '29€',
    priceValue: 2900,
    description: '8000-12000 mots',
    features: [
      '10-15 concurrents analysés',
      'Analyse multi-marchés',
      'PDF + Excel + Slides',
      'Export white-label',
    ],
    icon: BarChart3,
  },
];

const reportIncludes = [
  'Résumé exécutif avec insights clés',
  'Tableau comparatif des concurrents',
  'Matrice de positionnement',
  'Recommandations tarifaires',
  'Analyse des canaux go-to-market',
  'Évaluation des risques',
  "Plan d'action 30/60/90 jours",
  'Hypothèses à valider'
];

export const StepReview = ({ data, onPayment, isProcessing }: StepReviewProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro' | 'agency'>('pro');

  const handlePayment = () => {
    onPayment(selectedPlan);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Finalisez & générez</h2>
        <p className="text-muted-foreground">Revoyez vos informations et choisissez votre formule</p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Résumé de votre benchmark</h3>
          
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Entreprise</p>
              <p className="font-medium text-foreground">{data.businessName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Secteur</p>
              <p className="font-medium text-foreground">{data.sector}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Localisation</p>
              <p className="font-medium text-foreground">{data.location.city}, {data.location.country}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cible</p>
              <p className="font-medium text-foreground">{data.targetCustomers.type}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fourchette de prix</p>
              <p className="font-medium text-foreground">{data.priceRange.min}€ - {data.priceRange.max}€</p>
            </div>
            <div>
              <p className="text-muted-foreground">Concurrents</p>
              <p className="font-medium text-foreground">{data.competitors.length} ajouté(s)</p>
            </div>
          </div>

          {data.differentiators.length > 0 && (
            <div>
              <p className="text-muted-foreground text-sm mb-2">Différenciateurs</p>
              <div className="flex flex-wrap gap-1">
                {data.differentiators.map((d) => (
                  <span key={d} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Selection */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Choisissez votre formule</h3>
          
          <RadioGroup
            value={selectedPlan}
            onValueChange={(value) => setSelectedPlan(value as 'standard' | 'pro' | 'agency')}
            className="grid gap-4"
          >
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div key={plan.id} className="relative">
                  <RadioGroupItem
                    value={plan.id}
                    id={plan.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={plan.id}
                    className={`
                      flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                      peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                      hover:border-primary/50
                      ${plan.popular ? 'border-primary/30' : 'border-border'}
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                      ${selectedPlan === plan.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{plan.name}</span>
                        {plan.popular && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Populaire
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-foreground">{plan.price}</p>
                      <p className="text-xs text-muted-foreground">Paiement unique</p>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* What's included */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Votre rapport inclut :</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {reportIncludes.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Button */}
      <Card className="border-primary">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <p className="text-3xl font-bold text-foreground">
              {plans.find(p => p.id === selectedPlan)?.price}
            </p>
            <p className="text-muted-foreground text-sm">
              Formule {plans.find(p => p.id === selectedPlan)?.name}
            </p>
          </div>
          
          <Button 
            size="lg" 
            className="w-full sm:w-auto px-8"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {isProcessing ? 'Redirection...' : 'Payer & générer mon benchmark'}
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Paiement sécurisé via Stripe • Livraison instantanée • Remboursement sous 24h
          </p>
        </CardContent>
      </Card>

      {/* Trust microcopy */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>Nous n'inventons pas les sources. Si vous fournissez des URLs concurrents, nous les citons.</p>
        <p>Ceci est un outil d'aide à la décision, pas un conseil juridique ou financier.</p>
      </div>
    </div>
  );
};
