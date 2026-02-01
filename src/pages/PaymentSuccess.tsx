import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

type PaymentStatus = 'verifying' | 'verified' | 'generating' | 'ready' | 'failed' | 'error';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  // Verify payment with Stripe session and get report details
  const verifyPayment = useCallback(async () => {
    if (!sessionId) {
      setError('Session de paiement introuvable');
      setStatus('error');
      return;
    }

    try {
      // Call edge function to verify payment status
      const { data, error: fnError } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId }
      });

      if (fnError || data?.error) {
        console.error('Payment verification error:', fnError || data?.error);
        setError('Impossible de vérifier le paiement');
        setStatus('error');
        return;
      }

      if (data?.reportId && data?.paymentStatus === 'paid') {
        setReportId(data.reportId);
        setStatus('verified');
        setProgress(20);
        
        // Start generation if not already started
        if (data.reportStatus === 'paid') {
          await triggerGeneration(data.reportId);
        } else if (data.reportStatus === 'processing') {
          setStatus('generating');
          setProgress(40);
          pollForCompletion(data.reportId);
        } else if (data.reportStatus === 'ready') {
          setStatus('ready');
          setProgress(100);
          setTimeout(() => {
            navigate(`/app/reports/${data.reportId}`);
          }, 2000);
        } else if (data.reportStatus === 'failed') {
          setStatus('failed');
        }
      } else {
        setError('Le paiement n\'a pas été confirmé');
        setStatus('error');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Une erreur est survenue lors de la vérification');
      setStatus('error');
    }
  }, [sessionId, navigate]);

  // Trigger report generation
  const triggerGeneration = async (repId: string) => {
    setStatus('generating');
    setProgress(30);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-report', {
        body: { reportId: repId }
      });

      if (fnError) {
        console.error('Generation trigger error:', fnError);
        // Don't fail - the webhook might have already triggered it
      }

      // Start polling for completion
      pollForCompletion(repId);
    } catch (err) {
      console.error('Generation error:', err);
      // Continue polling anyway - generation might have been triggered by webhook
      pollForCompletion(repId);
    }
  };

  // Poll for report completion
  const pollForCompletion = (repId: string) => {
    let pollCount = 0;
    const maxPolls = 120; // 6 minutes max (3s intervals)

    const interval = setInterval(async () => {
      pollCount++;
      
      // Update progress based on poll count
      const newProgress = Math.min(30 + (pollCount / maxPolls) * 65, 95);
      setProgress(newProgress);

      try {
        const { data, error } = await supabase
          .from('reports')
          .select('status, output_data')
          .eq('id', repId)
          .single();

        if (error) {
          console.error('Poll error:', error);
          return;
        }

        if (data?.status === 'ready') {
          clearInterval(interval);
          setStatus('ready');
          setProgress(100);
          toast.success('Votre benchmark est prêt ! 🎉');
          
          // Redirect after a short delay
          setTimeout(() => {
            navigate(`/app/reports/${repId}`);
          }, 2500);
        } else if (data?.status === 'failed') {
          clearInterval(interval);
          setStatus('failed');
          toast.error('La génération a échoué');
        }

        if (pollCount >= maxPolls) {
          clearInterval(interval);
          // Don't mark as failed - it might still be processing
          toast.info('La génération prend plus de temps que prévu...');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  };

  // Handle retry
  const handleRetry = async () => {
    if (!reportId) return;
    
    setStatus('generating');
    setProgress(30);
    setError(null);

    try {
      const { error: fnError } = await supabase.functions.invoke('generate-report', {
        body: { reportId }
      });

      if (fnError) {
        console.error('Retry error:', fnError);
        setError('Erreur lors de la relance');
        setStatus('failed');
        return;
      }

      toast.info('Nouvelle tentative de génération...');
      pollForCompletion(reportId);
    } catch (err) {
      console.error('Retry error:', err);
      setError('Erreur lors de la relance');
      setStatus('failed');
    }
  };

  // Initial verification
  useEffect(() => {
    if (!authLoading && user && sessionId) {
      verifyPayment();
    } else if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, sessionId, verifyPayment, navigate]);

  // Progress animation for generating state
  useEffect(() => {
    if (status === 'generating') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 3;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const getStatusMessage = () => {
    switch (status) {
      case 'verifying':
        return { title: 'Vérification du paiement...', subtitle: 'Confirmation avec Stripe en cours' };
      case 'verified':
        return { title: 'Paiement confirmé ! ✓', subtitle: 'Lancement de la génération...' };
      case 'generating':
        return { title: 'Génération en cours...', subtitle: getGenerationPhase() };
      case 'ready':
        return { title: 'Votre benchmark est prêt ! 🎉', subtitle: 'Redirection vers votre rapport...' };
      case 'failed':
        return { title: 'Échec de la génération', subtitle: 'Vous pouvez réessayer gratuitement' };
      case 'error':
        return { title: 'Erreur de vérification', subtitle: error || 'Une erreur est survenue' };
      default:
        return { title: 'Chargement...', subtitle: '' };
    }
  };

  const getGenerationPhase = () => {
    if (progress < 40) return 'Analyse de vos données...';
    if (progress < 60) return 'Recherche concurrentielle...';
    if (progress < 80) return 'Génération des recommandations...';
    return 'Finalisation du rapport...';
  };

  const { title, subtitle } = getStatusMessage();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center space-y-6">
          {/* Status Icon */}
          <div className="relative mx-auto w-24 h-24">
            {status === 'verifying' && (
              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
            )}
            {status === 'verified' && (
              <div className="w-full h-full rounded-full bg-mint/20 flex items-center justify-center animate-scale-in">
                <CheckCircle className="w-12 h-12 text-mint-foreground" />
              </div>
            )}
            {status === 'generating' && (
              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-primary animate-pulse" />
              </div>
            )}
            {status === 'ready' && (
              <div className="w-full h-full rounded-full bg-mint/20 flex items-center justify-center animate-bounce-slow">
                <CheckCircle className="w-14 h-14 text-mint-foreground" />
              </div>
            )}
            {(status === 'failed' || status === 'error') && (
              <div className="w-full h-full rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-destructive" />
              </div>
            )}
          </div>

          {/* Status Text */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          {/* Progress Bar */}
          {(status === 'verifying' || status === 'verified' || status === 'generating' || status === 'ready') && (
            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
            </div>
          )}

          {/* Action Buttons */}
          {status === 'failed' && (
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Réessayer la génération
            </Button>
          )}

          {status === 'error' && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/app')}>
                Retour au tableau de bord
              </Button>
              <Button onClick={() => navigate('/app/new')}>
                Nouveau benchmark
              </Button>
            </div>
          )}

          {/* Tips during generation */}
          {status === 'generating' && (
            <div className="bg-muted/50 rounded-xl p-4 text-left">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Bon à savoir :</strong> La génération peut prendre 1-3 minutes selon la complexité de votre benchmark. 
                Vous pouvez quitter cette page - vous recevrez un email quand ce sera prêt.
              </p>
            </div>
          )}

          {/* Success message */}
          {status === 'ready' && (
            <div className="bg-mint/10 rounded-xl p-4 border border-mint/20">
              <p className="text-sm text-mint-foreground font-medium">
                Redirection automatique dans quelques secondes...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
