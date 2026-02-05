import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StepBusinessAndOffer } from '@/components/wizard/StepBusinessAndOffer';
import { StepGoalsAndCompetitors } from '@/components/wizard/StepGoalsAndCompetitors';
import { StepReview } from '@/components/wizard/StepReview';
import { ReportInput } from '@/types/report';
import { initialFormData } from '@/data/formOptions';
import { useReports } from '@/hooks/useReports';
import { useAuthContext } from '@/contexts/AuthContext';
import { ArrowLeft, ArrowRight, Building2, Target, CheckCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import logoB from '@/assets/logo-b.png';

const STEPS = [
  { id: 1, title: 'Votre business & offre', icon: Building2, color: 'bg-lavender/20 text-lavender-foreground' },
  { id: 2, title: 'Objectifs & concurrents', icon: Target, color: 'bg-sky/20 text-sky-foreground' },
  { id: 3, title: 'Finaliser', icon: CheckCircle, color: 'bg-mint/20 text-mint-foreground' }
];

const STORAGE_KEY = 'benchmark_wizard_draft';

function loadSavedFormData(): ReportInput {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Basic validation: check it has the expected shape
      if (parsed && typeof parsed === 'object' && typeof parsed.businessName === 'string') {
        return { ...initialFormData, ...parsed };
      }
    }
  } catch {
    // Corrupted localStorage - remove it and start fresh
    localStorage.removeItem(STORAGE_KEY);
  }
  return initialFormData;
}

const NewBenchmark = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuthContext();
  const { createReport } = useReports();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<ReportInput>(loadSavedFormData);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Veuillez vous connecter pour creer un benchmark');
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Handle payment cancelled
  useEffect(() => {
    if (searchParams.get('payment') === 'cancelled') {
      toast.error('Paiement annule');
    }
  }, [searchParams]);

  // Autosave
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // localStorage full or unavailable - ignore silently
    }
  }, [formData]);

  const progress = (currentStep / STEPS.length) * 100;

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.businessName && formData.sector && formData.whatYouSell);
      case 2:
        return formData.goals.length > 0;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const getValidationMessage = (step: number): string => {
    switch (step) {
      case 1:
        if (!formData.businessName) return 'Entrez le nom de votre entreprise';
        if (!formData.sector) return 'Selectionnez votre secteur';
        if (!formData.whatYouSell) return 'Decrivez ce que vous vendez';
        return '';
      case 2:
        if (formData.goals.length === 0) return 'Selectionnez au moins un objectif';
        return '';
      default:
        return '';
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error(getValidationMessage(currentStep));
      return;
    }
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePayment = async (plan: 'standard' | 'pro' | 'agency') => {
    if (!user) {
      toast.error('Veuillez vous connecter');
      navigate('/auth');
      return;
    }

    setIsProcessing(true);

    try {
      const report = await createReport(formData, plan);

      if (!report) {
        throw new Error('Failed to create report');
      }

      // Clear the draft
      localStorage.removeItem(STORAGE_KEY);

      // Redirect to embedded checkout page
      navigate(`/checkout?reportId=${report.id}&plan=${plan}`);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Erreur lors de la creation du paiement. Veuillez reessayer.');
      setIsProcessing(false);
    }
  };

  const currentStepInfo = STEPS[currentStep - 1];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-lavender/10">
      {/* Animated Background Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-coral/20 via-peach/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky/15 via-mint/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl pt-4">
          <div className="flex items-center justify-between h-16 px-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center group-hover:bg-secondary transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">Retour</span>
            </Link>

            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
                <img src={logoB} alt="BenchmarkAI" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-lg text-foreground hidden sm:block">BenchmarkAI</span>
            </Link>

            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mint/10 border border-mint/20">
                <Save className="w-3 h-3 text-mint-foreground" />
                <span className="text-mint-foreground text-xs font-medium hidden sm:inline">Sauvegarde</span>
                <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="relative py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Hero Section with Step Info */}
          <div className="mb-8 text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${currentStepInfo.color} mb-4 shadow-lg`}>
              <currentStepInfo.icon className="w-8 h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground mb-1">
              {currentStepInfo.title}
            </h1>
            <p className="text-muted-foreground">
              Etape {currentStep} sur {STEPS.length}
            </p>
          </div>

          {/* Step indicators */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-500 ${
                    currentStep === step.id
                      ? `${step.color} shadow-lg scale-105 font-semibold`
                      : currentStep > step.id
                        ? 'bg-mint/15 text-mint-foreground border border-mint/20'
                        : 'bg-secondary/50 text-muted-foreground/50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    currentStep === step.id
                      ? 'bg-card/80 shadow-sm'
                      : currentStep > step.id
                        ? 'bg-mint/20'
                        : 'bg-background/50'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-sm hidden md:block">{step.title}</span>
                </div>
              ))}
            </div>
            <div className="max-w-md mx-auto">
              <Progress value={progress} className="h-2 rounded-full" />
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8 rounded-[2rem] bg-card border border-border p-6 md:p-10">
            {currentStep === 1 && (
              <StepBusinessAndOffer formData={formData} setFormData={setFormData} />
            )}
            {currentStep === 2 && (
              <StepGoalsAndCompetitors formData={formData} setFormData={setFormData} />
            )}
            {currentStep === 3 && (
              <StepReview
                data={formData}
                onPayment={handlePayment}
                isProcessing={isProcessing}
              />
            )}
          </div>

          {/* Navigation */}
          {currentStep < 3 && (
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>

              <div className="flex items-center gap-2">
                {STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      index + 1 === currentStep
                        ? 'bg-foreground'
                        : index + 1 < currentStep
                          ? 'bg-mint'
                          : 'bg-border'
                    }`}
                  />
                ))}
              </div>

              <Button onClick={handleNext} className="gap-2">
                Continuer
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NewBenchmark;
