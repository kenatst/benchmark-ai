import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, AlertCircle, Shield, Lock, CheckCircle } from 'lucide-react';

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeError, setStripeError] = useState(false);

  const reportId = searchParams.get('reportId');
  const plan = searchParams.get('plan');

  // Validate Stripe is loaded
  useEffect(() => {
    stripePromise.then((stripe) => {
      if (stripe) {
        setStripeReady(true);
      } else {
        setStripeError(true);
        setLoading(false);
      }
    }).catch(() => {
      setStripeError(true);
      setLoading(false);
    });
  }, []);

  const fetchClientSecret = useCallback(async () => {
    if (!reportId || !plan) {
      setError('Paramètres manquants. Veuillez réessayer.');
      setLoading(false);
      return;
    }

    try {
      // Check report status first - if already paid/ready, redirect to report page
      const { data: report } = await supabase
        .from('reports')
        .select('status')
        .eq('id', reportId)
        .single();

      if (report && report.status !== 'draft') {
        // Report already paid/processing/ready - redirect to report page
        navigate(`/app/reports/${reportId}`);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('create-embedded-checkout', {
        body: { plan, reportId }
      });

      if (fnError) {
        console.error('Error creating checkout session:', fnError);
        // Check if the error message indicates already-paid (edge function returns 400)
        const errMsg = fnError?.message || '';
        if (errMsg.includes('already been paid') || errMsg.includes('alreadyPaid')) {
          navigate(`/app/reports/${reportId}`);
          return;
        }
        setError('Erreur lors de la création de la session de paiement. Veuillez réessayer.');
        setLoading(false);
        return;
      }

      if (data?.error) {
        console.error('Checkout error:', data.error);

        // If report was already paid/generated, redirect to the report page
        if (data.alreadyPaid && data.reportId) {
          navigate(`/app/reports/${data.reportId}`);
          return;
        }

        setError(data.error);
        setLoading(false);
        return;
      }

      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setError('Impossible de récupérer la session de paiement. Veuillez réessayer.');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Une erreur inattendue est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [reportId, plan]);

  // Fetch client secret only after Stripe is ready
  useEffect(() => {
    if (stripeReady) {
      fetchClientSecret();
    }
  }, [stripeReady, fetchClientSecret]);

  const planNames: Record<string, string> = {
    standard: 'Standard',
    pro: 'Pro',
    agency: 'Agence'
  };

  const planPrices: Record<string, string> = {
    standard: '14,99€',
    pro: '34,99€',
    agency: '69,99€'
  };

  const planFeatures: Record<string, string[]> = {
    standard: ['3-5 concurrents analysés', 'Plan d\'action 30/60/90 jours', 'PDF standard'],
    pro: ['5-10 concurrents détaillés', 'Customer insights & white spaces', 'PDF premium'],
    agency: ['10-15 concurrents deep dive', 'PESTEL, Porter, SWOT', 'Roadmap 12 mois']
  };

  if (stripeError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Service de paiement indisponible</h2>
              <p className="text-muted-foreground text-sm mb-2">
                Le module de paiement Stripe n'a pas pu se charger. Cela peut être dû à un bloqueur de publicités ou une extension de navigateur.
              </p>
              <p className="text-xs text-muted-foreground">
                Essayez de désactiver votre bloqueur de publicités et de recharger la page.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => navigate('/app/new')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button onClick={() => window.location.reload()}>
                Recharger la page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div className="absolute inset-0 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">Initialisation du paiement sécurisé...</p>
            <p className="text-muted-foreground text-sm">Connexion à Stripe en cours. Cela prend quelques secondes.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Erreur de paiement</h2>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <p className="text-xs text-muted-foreground">Vous pouvez réessayer ou retourner à votre benchmark.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
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

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Order Summary - Left side */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Finaliser votre commande</h1>
              <p className="text-muted-foreground">
                Formule <span className="font-semibold text-foreground">{plan && planNames[plan]}</span>
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-foreground font-medium">
                    Benchmark {plan && planNames[plan]}
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    {plan && planPrices[plan]}
                  </span>
                </div>

                {plan && planFeatures[plan] && (
                  <div className="border-t border-border pt-4 space-y-2">
                    {planFeatures[plan].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

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
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Paiement 100% sécurisé via Stripe</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Lock className="w-5 h-5 text-primary flex-shrink-0" />
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
                {clientSecret ? (
                  <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ clientSecret }}
                  >
                    <EmbeddedCheckout className="min-h-[500px]" />
                  </EmbeddedCheckoutProvider>
                ) : (
                  <div className="min-h-[500px] flex items-center justify-center p-8">
                    <div className="text-center space-y-4">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                      <p className="text-muted-foreground text-sm">Chargement du formulaire de paiement...</p>
                    </div>
                  </div>
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
