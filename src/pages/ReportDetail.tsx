import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { useReports, Report } from '@/hooks/useReports';
import { useAuthContext } from '@/contexts/AuthContext';
import { ReportInput, ReportOutput } from '@/types/report';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Loader2, Download } from 'lucide-react';
import { ReportHero } from '@/components/report/ReportHero';
import { WebSummary } from '@/components/report/WebSummary';
import { downloadDocument } from '@/lib/download';
import { supabase } from '@/integrations/supabase/client';

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
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

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

  // Load initial report
  useEffect(() => {
    const loadReport = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        let r = getReport(id);
        if (!r) {
          r = await refetchReport(id);
        }

        if (r) {
          setReport(r);
          if (r.processing_progress) {
            setProcessingProgress(r.processing_progress);
          }
        }
      } catch (err) {
        console.error('Error loading report:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [id, getReport, refetchReport]);

  // Poll for processing updates
  useEffect(() => {
    if (!report || (report.status !== 'processing' && report.status !== 'paid')) {
      return;
    }

    let isMounted = true;
    let checkInterval: NodeJS.Timeout | null = null;

    // Start polling
    checkInterval = setInterval(async () => {
      if (!isMounted || !id) {
        if (checkInterval) clearInterval(checkInterval);
        return;
      }

      try {
        const updated = await refetchReport(id);
        if (!isMounted || !updated) return;

        setReport(updated);

        // Use real progress from database
        if (updated.processing_progress !== undefined) {
          setProcessingProgress(updated.processing_progress);
        }

        if (updated.status === 'ready') {
          setProcessingProgress(100);
          if (checkInterval) clearInterval(checkInterval);
          toast.success('Votre rapport est prêt !');
        } else if (updated.status === 'failed') {
          if (checkInterval) clearInterval(checkInterval);
          toast.error('La génération a échoué. Vous pouvez réessayer.');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup
    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [report?.status, report?.id, id, refetchReport]);

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

  const isDownloading = downloadingFormat === 'pdf';

  // Unified download handler - supports all formats (PDF, Excel, PowerPoint)
  const downloadFile = async (format: 'pdf' | 'excel' | 'powerpoint') => {
    if (!report) return;

    setDownloadingFormat(format);

    try {
      const getToken = async () => {
        const session = await supabase.auth.getSession();
        return session.data.session?.access_token || null;
      };

      const result = await downloadDocument(
        {
          format,
          reportId: report.id,
          businessName: report.input_data?.businessName,
        },
        getToken
      );

      if (result.success) {
        const formatLabel = { pdf: 'PDF', excel: 'Excel', powerpoint: 'PowerPoint' }[format];
        toast.success(`${formatLabel} téléchargé !`);
      } else {
        toast.error(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error(`Download error (${format}):`, error);
      const formatLabel = { pdf: 'PDF', excel: 'Excel', powerpoint: 'PowerPoint' }[format];
      toast.error(`Erreur lors du téléchargement du ${formatLabel}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownload = () => downloadFile('pdf');

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
            processingProgress={processingProgress}
            processingStep={report.processing_step}
            onDownload={handleDownload}
            onRetry={handleRetry}
            isRetrying={isRetrying}
            isDownloading={isDownloading}
          />

          {/* Web Summary - Only shown when report is ready */}
          {report.status === 'ready' && outputData && (
            <WebSummary
              outputData={outputData}
              plan={report.plan || 'standard'}
              pdfUrl={report.pdf_url}
              onDownload={handleDownload}
              isDownloading={isDownloading}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportDetail;
