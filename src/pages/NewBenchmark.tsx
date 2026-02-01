import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { ArrowLeft, ArrowRight, Home, Sparkles, Target, Users, Lightbulb, Settings, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  const { createReport, processReport } = useReports();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<ReportInput>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialFormData;
  });

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
        return !!(formData.businessName && formData.sector && formData.location.city && formData.location.country);
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

  const handlePayment = async () => {
    setIsProcessing(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Paiement réussi !');

    const report = createReport(formData);
    
    localStorage.removeItem(STORAGE_KEY);
    
    navigate(`/app/reports/${report.id}`);
    
    processReport(report.id).catch(() => {
      toast.error('La génération du rapport a échoué. Veuillez réessayer.');
    });
  };

  const StepComponents = [StepBasics, StepOffer, StepGoals, StepCompetitors, StepContext, StepReview];
  const CurrentStepComponent = StepComponents[currentStep - 1];
  const currentStepInfo = STEPS[currentStep - 1];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Retour</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                <span className="text-background font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-foreground hidden sm:block">BenchAI</span>
            </div>

            <div className="text-sm text-muted-foreground">
              <span className="hidden sm:inline">Sauvegarde automatique </span>
              <span className="text-mint-foreground">●</span>
            </div>
          </div>
        </div>
      </div>

      <main className="py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Step indicators */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
              {STEPS.map((step, index) => (
                <div 
                  key={step.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 flex-shrink-0 ${
                    currentStep === step.id 
                      ? `${step.color} font-semibold` 
                      : currentStep > step.id 
                        ? 'text-mint-foreground'
                        : 'text-muted-foreground/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    currentStep === step.id 
                      ? 'bg-card border border-border shadow-sm' 
                      : currentStep > step.id 
                        ? 'bg-mint/20'
                        : 'bg-secondary/50'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-sm hidden lg:block">{step.title}</span>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Step header */}
          <div className="mb-8 text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${currentStepInfo.color} mb-4`}>
              <currentStepInfo.icon className="w-8 h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {currentStepInfo.title}
            </h1>
            <p className="text-muted-foreground">
              Étape {currentStep} sur {STEPS.length}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-8 rounded-[2rem] bg-card border border-border p-6 md:p-10">
            {currentStep === 6 ? (
              <StepReview 
                data={formData} 
                onPayment={handlePayment} 
                isProcessing={isProcessing}
              />
            ) : (
              /* @ts-expect-error - StepReview has different props */
              <CurrentStepComponent data={formData} updateData={updateData} />
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
