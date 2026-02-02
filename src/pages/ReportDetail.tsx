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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [isDownloadingSlides, setIsDownloadingSlides] = useState(false);

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

  // Streaming PDF download - generates on-the-fly like Claude
  const handleDownload = async () => {
    if (!report) return;

    setIsDownloading(true);

    try {
      // Try streaming PDF first (new method)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stream-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
          },
          body: JSON.stringify({ reportId: report.id }),
        }
      );

      if (response.ok && response.headers.get('Content-Type')?.includes('application/pdf')) {
        // Stream successful - trigger browser download
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Get filename from Content-Disposition header if available
        const disposition = response.headers.get('Content-Disposition');
        let filename = `Benchmark_${report.id.substring(0, 8)}.pdf`;
        if (disposition) {
          const match = disposition.match(/filename="([^"]+)"/);
          if (match) filename = match[1];
        }

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('PDF téléchargé !');
      } else {
        // Fallback to legacy pdf_url
        if (report.pdf_url) {
          window.open(report.pdf_url, '_blank');
          toast.success('PDF ouvert dans un nouvel onglet');
        } else {
          toast.error('Le PDF n\'est pas encore disponible');
        }
      }
    } catch (error) {
      console.error('PDF download error:', error);
      // Fallback to legacy pdf_url on error
      if (report.pdf_url) {
        window.open(report.pdf_url, '_blank');
      } else {
        toast.error('Erreur lors du téléchargement du PDF');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Excel download for Agency tier
  const handleDownloadExcel = async () => {
    if (!report || report.plan !== 'agency') return;

    setIsDownloadingExcel(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-excel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
          },
          body: JSON.stringify({ reportId: report.id }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const disposition = response.headers.get('Content-Disposition');
        let filename = `Benchmark_${report.id.substring(0, 8)}.xlsx`;
        if (disposition) {
          const match = disposition.match(/filename="([^"]+)"/);
          if (match) filename = match[1];
        }
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Excel téléchargé !');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erreur lors de la génération Excel');
      }
    } catch (error) {
      console.error('Excel download error:', error);
      toast.error('Erreur lors du téléchargement Excel');
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  // Slides download for Agency tier
  const handleDownloadSlides = async () => {
    if (!report || report.plan !== 'agency') return;

    setIsDownloadingSlides(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-slides`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
          },
          body: JSON.stringify({ reportId: report.id }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const disposition = response.headers.get('Content-Disposition');
        let filename = `Benchmark_${report.id.substring(0, 8)}.pptx`;
        if (disposition) {
          const match = disposition.match(/filename="([^"]+)"/);
          if (match) filename = match[1];
        }
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Slides téléchargées !');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erreur lors de la génération Slides');
      }
    } catch (error) {
      console.error('Slides download error:', error);
      toast.error('Erreur lors du téléchargement Slides');
    } finally {
      setIsDownloadingSlides(false);
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
            onDownloadExcel={handleDownloadExcel}
            onDownloadSlides={handleDownloadSlides}
            onRetry={handleRetry}
            isRetrying={isRetrying}
            isDownloading={isDownloading}
            isDownloadingExcel={isDownloadingExcel}
            isDownloadingSlides={isDownloadingSlides}
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
