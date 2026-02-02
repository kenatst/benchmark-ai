import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { useReports, Report } from '@/hooks/useReports';
import { useAuthContext } from '@/contexts/AuthContext';
import { ReportInput, ReportOutput } from '@/types/report';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { ReportHero } from '@/components/report/ReportHero';
import { WebSummary } from '@/components/report/WebSummary';

const ReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuthContext();
  const { getReport, refetchReport, triggerGeneration } = useReports();
  const [report, setReport] = useState<Report | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Handle payment success
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      toast.success('Paiement réussi ! Génération en cours...');
    }
  }, [searchParams]);

  useEffect(() => {
    const loadReport = async () => {
      if (id) {
        setIsLoading(true);
        let r = getReport(id);

        if (!r) {
          r = await refetchReport(id);
        }

        setReport(r || null);
        if (r?.processing_progress) {
          setProcessingProgress(r.processing_progress);
        }
        setIsLoading(false);

        if (r?.status === 'processing' || r?.status === 'paid') {
          // Poll for real-time updates from the database
          const checkInterval = setInterval(async () => {
            const updated = await refetchReport(id);
            if (updated) {
              setReport(updated);
              // Use real progress from database
              if (updated.processing_progress !== undefined) {
                setProcessingProgress(updated.processing_progress);
              }

              if (updated.status === 'ready') {
                setProcessingProgress(100);
                clearInterval(checkInterval);
                toast.success('Votre rapport est prêt !');
              } else if (updated.status === 'failed') {
                clearInterval(checkInterval);
                toast.error('La génération a échoué. Vous pouvez réessayer.');
              }
            }
          }, 2000); // Poll every 2 seconds for smoother updates

          return () => {
            clearInterval(checkInterval);
          };
        }
      }
    };

    loadReport();
  }, [id, getReport, refetchReport]);

  const handleRetry = async () => {
    if (!report) return;
    setIsRetrying(true);
    setProcessingProgress(0);

    try {
      await triggerGeneration(report.id);
      setReport(prev => prev ? { ...prev, status: 'processing' } : null);
      toast.info('Nouvelle tentative de génération...');
    } catch {
      toast.error('Erreur lors de la relance');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDownload = () => {
    if (report?.pdf_url) {
      window.open(report.pdf_url, '_blank');
    } else {
      toast.error('Le PDF n\'est pas encore disponible');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Rapport introuvable</h2>
            <p className="text-muted-foreground mb-6">Ce rapport n'existe pas ou vous n'y avez pas accès.</p>
            <Link to="/app/reports">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour aux rapports
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const inputData = report.input_data as ReportInput;
  const outputData = report.output_data as ReportOutput | null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Back link */}
          <Link
            to="/app/reports"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux rapports
          </Link>

          {/* Report Hero - Status, Progress, Download */}
          <ReportHero
            status={report.status || 'draft'}
            plan={report.plan || 'standard'}
            businessName={inputData?.businessName || 'Rapport'}
            sector={inputData?.sector || ''}
            location={`${inputData?.location?.city || ''}, ${inputData?.location?.country || ''}`}
            pdfUrl={report.pdf_url}
            processingProgress={processingProgress}
            processingStep={report.processing_step}
            onDownload={handleDownload}
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />

          {/* Web Summary - Only shown when report is ready */}
          {report.status === 'ready' && outputData && (
            <WebSummary
              outputData={outputData}
              plan={report.plan || 'standard'}
              pdfUrl={report.pdf_url}
              onDownload={handleDownload}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportDetail;
