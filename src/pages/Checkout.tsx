import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, AlertCircle, Shield, Lock } from 'lucide-react';

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reportId = searchParams.get('reportId');
  const plan = searchParams.get('plan');

  const fetchClientSecret = useCallback(async () => {
    if (!reportId || !plan) {
      setError('Paramètres manquants. Veuillez réessayer.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-embedded-checkout', {
        body: { plan, reportId }
      });

      if (fnError) {
        console.error('Error creating checkout session:', fnError);
        setError('Erreur lors de la création de la session de paiement.');
        setLoading(false);
        return;
      }

      if (data?.error) {
        console.error('Checkout error:', data.error);
        setError(data.error);
        setLoading(false);
        return;
      }

      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setError('Impossible de récupérer le secret client.');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  }, [reportId, plan]);

  useEffect(() => {
    fetchClientSecret();
  }, [fetchClientSecret]);

  const planNames: Record<string, string> = {
    standard: 'Standard',
    pro: 'Pro',
    agency: 'Agence'
  };

  const planPrices: Record<string, string> = {
    standard: '4,99€',
    pro: '14,99€',
    agency: '29€'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Préparation du paiement sécurisé...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Erreur de paiement</h2>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/app/new')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button onClick={() => {
                setError(null);
                setLoading(true);
                fetchClientSecret();
              }}>
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/app/new')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            Paiement sécurisé
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Order Summary - Left side */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Finaliser votre commande</h1>
              <p className="text-muted-foreground">Formule {plan && planNames[plan]}</p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-foreground font-medium">
                    Benchmark {plan && planNames[plan]}
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {plan && planPrices[plan]}
                  </span>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Paiement unique</span>
                    <span className="text-muted-foreground">Livraison instantanée</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust badges */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="w-5 h-5 text-primary" />
                <span>Paiement 100% sécurisé via Stripe</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Lock className="w-5 h-5 text-primary" />
                <span>Vos données sont protégées et chiffrées</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              En procédant au paiement, vous acceptez nos conditions générales de vente. 
              Remboursement possible sous 24h si le rapport ne correspond pas à vos attentes.
            </p>
          </div>

          {/* Stripe Embedded Checkout - Right side */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {clientSecret && (
                  <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ clientSecret }}
                  >
                    <EmbeddedCheckout className="min-h-[500px]" />
                  </EmbeddedCheckoutProvider>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
