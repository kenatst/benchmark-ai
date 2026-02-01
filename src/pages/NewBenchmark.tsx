import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
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
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Basics', component: StepBasics },
  { id: 2, title: 'Offer', component: StepOffer },
  { id: 3, title: 'Goals', component: StepGoals },
  { id: 4, title: 'Competitors', component: StepCompetitors },
  { id: 5, title: 'Context', component: StepContext },
  { id: 6, title: 'Review', component: StepReview }
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
        return true; // Competitors are optional
      case 5:
        return true; // Context is optional
      case 6:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields');
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
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Payment successful!');

    // Create and process report
    const report = createReport(formData);
    
    // Clear draft
    localStorage.removeItem(STORAGE_KEY);
    
    // Navigate to report page
    navigate(`/app/reports/${report.id}`);
    
    // Process in background
    processReport(report.id).catch(() => {
      toast.error('Report generation failed. Please try again.');
    });
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {STEPS[currentStep - 1].title}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="mb-8">
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
            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewBenchmark;
