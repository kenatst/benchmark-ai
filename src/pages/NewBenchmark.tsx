import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StepBasics } from '@/components/wizard/StepBasics';
import { StepOffer } from '@/components/wizard/StepOffer';
import { StepGoals } from '@/components/wizard/StepGoals';
import { StepCompetitors } from '@/components/wizard/StepCompetitors';
import { StepContext } from '@/components/wizard/StepContext';
import { StepReview } from '@/components/wizard/StepReview';
import { ReportInput } from '@/types/report';
import { initialFormData } from '@/data/formOptions';
import { useReports } from '@/hooks/useReports';
import { useAuthContext } from '@/contexts/AuthContext';
import { ArrowLeft, ArrowRight, Home, Sparkles, Target, Users, Settings, CheckCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import logoB from '@/assets/logo-b.png';

const STEPS = [
  { id: 1, title: 'Votre business', icon: Home, color: 'bg-lavender/20 text-lavender-foreground' },
  { id: 2, title: 'Votre offre', icon: Target, color: 'bg-coral/20 text-coral-foreground' },
  { id: 3, title: 'Objectifs', icon: Sparkles, color: 'bg-sky/20 text-sky-foreground' },
  { id: 4, title: 'Concurrents', icon: Users, color: 'bg-mint/20 text-mint-foreground' },
  { id: 5, title: 'Contexte', icon: Settings, color: 'bg-peach/20 text-peach-foreground' },
  { id: 6, title: 'Finaliser', icon: CheckCircle, color: 'bg-gold/20 text-gold' }
];

const STORAGE_KEY = 'benchmark_wizard_draft';

const NewBenchmark = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuthContext();
  const { createReport, createCheckoutSession } = useReports();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<ReportInput>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialFormData;
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Veuillez vous connecter pour créer un benchmark');
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Handle payment cancelled
  useEffect(() => {
    if (searchParams.get('payment') === 'cancelled') {
      toast.error('Paiement annulé');
    }
  }, [searchParams]);

  // Autosave
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateData = (updates: Partial<ReportInput>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const progress = (currentStep / STEPS.length) * 100;

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Seuls businessName et sector sont obligatoires
        return !!(formData.businessName && formData.sector);
      case 2:
        return !!formData.whatYouSell;
      case 3:
        return formData.goals.length > 0;
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error('Veuillez remplir tous les champs obligatoires');
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
      // Create the report in draft status
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
      toast.error('Erreur lors de la création du paiement. Veuillez réessayer.');
      setIsProcessing(false);
    }
  };

  const StepComponents = [StepBasics, StepOffer, StepGoals, StepCompetitors, StepContext, StepReview];
  const CurrentStepComponent = StepComponents[currentStep - 1];
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
                <span className="text-mint-foreground text-xs font-medium hidden sm:inline">Sauvegardé</span>
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
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl ${currentStepInfo.color} mb-6 shadow-lg`}>
              <currentStepInfo.icon className="w-10 h-10" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">
              {currentStepInfo.title}
            </h1>
            <p className="text-muted-foreground text-lg">
              Étape {currentStep} sur {STEPS.length}
            </p>
          </div>

          {/* Step indicators - Redesigned */}
          <div className="mb-10">
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              {STEPS.map((step, index) => (
                <div 
                  key={step.id}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-500 ${
                    currentStep === step.id 
                      ? `${step.color} shadow-lg scale-105 font-semibold` 
                      : currentStep > step.id 
                        ? 'bg-mint/15 text-mint-foreground border border-mint/20'
                        : 'bg-secondary/50 text-muted-foreground/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
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
              <StepBasics formData={formData} setFormData={setFormData} />
            )}
            {currentStep === 2 && (
              <StepOffer formData={formData} setFormData={setFormData} />
            )}
            {currentStep === 3 && (
              <StepGoals formData={formData} setFormData={setFormData} />
            )}
            {currentStep === 4 && (
              <StepCompetitors formData={formData} setFormData={setFormData} />
            )}
            {currentStep === 5 && (
              <StepContext formData={formData} setFormData={setFormData} />
            )}
            {currentStep === 6 && (
              <StepReview 
                data={formData} 
                onPayment={handlePayment} 
                isProcessing={isProcessing}
              />
            )}
          </div>

          {/* Navigation */}
          {currentStep < 6 && (
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
                    className={`w-2 h-2 rounded-full transition-colors ${
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
