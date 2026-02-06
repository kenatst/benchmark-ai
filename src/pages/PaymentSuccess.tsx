import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import logoB from '@/assets/logo-b.png';

type PaymentStatus = 'verifying' | 'verified' | 'generating' | 'ready' | 'failed' | 'error';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [serverStep, setServerStep] = useState<string | null>(null);
  const [serverProgress, setServerProgress] = useState<number | null>(null);
  
  // Use ref to track the highest progress value (never decrease)
  const maxProgressRef = useRef(0);
  const warnedLongRef = useRef(false);
  const autoRetriedRef = useRef(false);

  const sessionId = searchParams.get('session_id');

  // Helper to update progress - never decreases
  const updateProgress = useCallback((newValue: number) => {
    if (newValue > maxProgressRef.current) {
      maxProgressRef.current = newValue;
      setProgress(newValue);
    }
  }, []);

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
        updateProgress(20);
        
        // Start generation if not already started
        if (data.reportStatus === 'paid') {
          await triggerGeneration(data.reportId);
        } else if (data.reportStatus === 'processing') {
          setStatus('generating');
          updateProgress(40);
          // Polling effect will automatically start
        } else if (data.reportStatus === 'ready') {
          setStatus('ready');
          updateProgress(100);
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
  }, [sessionId, navigate, updateProgress]);

  // Trigger report generation
  const triggerGeneration = useCallback(async (repId: string) => {
    setStatus('generating');
    updateProgress(30);

    try {
      const { error: fnError } = await supabase.functions.invoke('generate-report', {
        body: { reportId: repId }
      });

      if (fnError) {
        console.error('Generation trigger error:', fnError);
        // Don't fail - the webhook might have already triggered it
      }
    } catch (err) {
      console.error('Generation error:', err);
      // Continue with polling anyway - generation might have been triggered by webhook
    }
  }, [updateProgress]);

  // Polling effect - handle cleanup properly
  useEffect(() => {
    if (status !== 'generating' || !reportId) {
      return;
    }

    let pollCount = 0;
    let isMounted = true;
    const maxPolls = 120; // 6 minutes (3s intervals) before we warn
    const MAX_TOTAL_TIME_MS = 15 * 60 * 1000; // 15 minutes hard limit
    const pollStartTime = Date.now();

    const interval = setInterval(async () => {
      if (!isMounted) {
        clearInterval(interval);
        return;
      }

      pollCount++;
      const elapsedMs = Date.now() - pollStartTime;

      // Smooth-ish client progress as a fallback; server progress will override (never decreases).
      const calculatedProgress = Math.min(30 + (pollCount / maxPolls) * 65, 95);
      updateProgress(calculatedProgress);

      // TIMEOUT: If exceeded max time, fail the generation
      if (elapsedMs > MAX_TOTAL_TIME_MS) {
        clearInterval(interval);
        setStatus('failed');
        setError('La génération a pris trop de temps. Veuillez réessayer.');
        toast.error('Délai d\'attente dépassé. Cliquez sur "Réessayer" pour relancer la génération.');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('reports')
          .select('status, output_data, processing_step, processing_progress, updated_at')
          .eq('id', reportId)
          .single();

        if (error) {
          console.error('Poll error:', error);
          return;
        }

        if (!isMounted) return;

        // Prefer server-side progress/step when available (this is the source of truth).
        if (typeof data?.processing_step === 'string') {
          setServerStep(data.processing_step);
        }
        if (typeof data?.processing_progress === 'number') {
          setServerProgress(data.processing_progress);
          updateProgress(data.processing_progress);
        }

        if (data?.status === 'ready') {
          clearInterval(interval);
          setStatus('ready');
          updateProgress(100);
          toast.success('Votre benchmark est prêt !');

          // Redirect after a short delay
          setTimeout(() => {
            if (isMounted) navigate(`/app/reports/${reportId}`);
          }, 2500);
        } else if (data?.status === 'failed') {
          clearInterval(interval);
          setStatus('failed');
          toast.error('La génération a échoué');
        }

        // After ~6 minutes, we warn once but we keep polling (Agency can legitimately take longer).
        if (pollCount >= maxPolls && !warnedLongRef.current) {
          warnedLongRef.current = true;
          toast.info('La génération prend plus de temps que prévu… je continue de surveiller.');
        }

        // Auto-retry if the backend looks stalled (no DB update for a while).
        // This fixes the “I waited 30 minutes but nothing changes” case when the generator was killed mid-run.
        if (
          data?.status === 'processing' &&
          typeof data?.updated_at === 'string' &&
          !autoRetriedRef.current
        ) {
          const ageMs = Date.now() - new Date(data.updated_at).getTime();
          const stallThresholdMs = 8 * 60 * 1000;
          if (ageMs > stallThresholdMs) {
            autoRetriedRef.current = true;
            toast.info('La génération semble bloquée, relance automatique…');
            await supabase.functions.invoke('generate-report', { body: { reportId } });
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    // Cleanup interval when component unmounts or status changes
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [status, reportId, updateProgress, navigate]);

  // Mark report as abandoned when user leaves the page during generation
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // If generating and not ready/failed, mark as abandoned
      if (reportId && (status === 'generating' || status === 'verified' || status === 'verifying')) {
        // Use sendBeacon for reliable delivery on page unload
        const payload = JSON.stringify({ reportId, status: 'abandoned' });
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/reports?id=eq.${reportId}`,
          payload
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [reportId, status]);

  // Cleanup abandoned reports when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      if (reportId && (status === 'generating' || status === 'verified' || status === 'verifying')) {
        // Mark report as abandoned in the database
        supabase
          .from('reports')
          .update({ status: 'abandoned' })
          .eq('id', reportId)
          .then(({ error }) => {
            if (error) console.error('Failed to mark report as abandoned:', error);
          });
      }
    };
  }, [reportId, status]);

  // Handle retry
  const handleRetry = useCallback(async () => {
    if (!reportId) return;

    // Reset progress tracking for retry
    maxProgressRef.current = 30;
    setProgress(30);
    setStatus('generating');
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
      // Status changed to 'generating' - polling effect will automatically start
    } catch (err) {
      console.error('Retry error:', err);
      setError('Erreur lors de la relance');
      setStatus('failed');
    }
  }, [reportId, updateProgress]);

  // Initial verification
  useEffect(() => {
    if (!authLoading && user && sessionId) {
      verifyPayment();
    } else if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, sessionId, verifyPayment, navigate]);

  // Smooth progress animation for generating state (only increment, never decrease)
  useEffect(() => {
    if (status === 'generating' && serverProgress === null) {
      const interval = setInterval(() => {
        // Small random increment, never exceeding current max + small amount
        const increment = Math.random() * 2;
        const newProgress = Math.min(maxProgressRef.current + increment, 94);
        updateProgress(newProgress);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [status, updateProgress, serverProgress]);

  const getStatusMessage = () => {
    switch (status) {
      case 'verifying':
        return { title: 'Vérification du paiement', subtitle: 'Confirmation avec Stripe en cours. Cela peut prendre 10-20 secondes.' };
      case 'verified':
        return { title: '✅ Paiement confirmé !', subtitle: 'Lancement de la génération AI de votre rapport stratégique...' };
      case 'generating':
        return { title: '🚀 Génération en cours', subtitle: serverStep || getGenerationPhase() };
      case 'ready':
        return { title: '✅ Votre benchmark est prêt !', subtitle: 'Accès à votre rapport dans quelques secondes...' };
      case 'failed':
        return { title: '❌ Génération échouée', subtitle: 'Le rapport n\'a pas pu être généré. Vous pouvez réessayer gratuitement.' };
      case 'error':
        return { title: '⚠️ Erreur', subtitle: error || 'Une erreur est survenue lors de la vérification' };
      default:
        return { title: 'Chargement...', subtitle: '' };
    }
  };

  const getGenerationPhase = () => {
    if (serverStep) return serverStep;
    if (progress < 40) return 'Analyse de vos données...';
    if (progress < 60) return 'Analyse stratégique en cours...';
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
          {/* Status Icon - Using Logo instead of emojis */}
          <div className="relative mx-auto w-24 h-24">
            {status === 'verifying' && (
              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                <img src={logoB} alt="Logo" className="w-12 h-12 animate-pulse" />
              </div>
            )}
            {status === 'verified' && (
              <div className="w-full h-full rounded-full bg-mint/20 flex items-center justify-center animate-scale-in">
                <CheckCircle className="w-12 h-12 text-mint-foreground" />
              </div>
            )}
            {status === 'generating' && (
              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center relative">
                <img src={logoB} alt="Logo" className="w-12 h-12" />
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
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

          {/* Warning message - don't close page */}
          {(status === 'generating' || status === 'verifying' || status === 'verified') && (
            <div className="bg-chart-4/10 rounded-lg p-4 border border-chart-4/20">
              <p className="text-sm text-chart-4 font-medium mb-2">
                Temps estime : 2 a 5 minutes
              </p>
              <p className="text-xs text-chart-4">
                Ne fermez pas cette page. Votre rapport est analyse et redige section par section. Vous serez redirige automatiquement.
              </p>
            </div>
          )}

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
