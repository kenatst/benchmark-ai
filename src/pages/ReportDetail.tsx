import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useReports, Report } from '@/hooks/useReports';
import { useAuthContext } from '@/contexts/AuthContext';
import { ReportOutput, ReportInput } from '@/types/report';
import { toast } from 'sonner';
import { 
  Download, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText
} from 'lucide-react';

const ReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuthContext();
  const { getReport, processReport, refetchReport } = useReports();
  const [report, setReport] = useState<Report | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
      // Trigger processing after payment
      if (id) {
        processReport(id);
      }
    }
  }, [searchParams, id, processReport]);

  useEffect(() => {
    const loadReport = async () => {
      if (id) {
        setIsLoading(true);
        let r = getReport(id);
        
        // If not in local state, fetch from DB
        if (!r) {
          r = await refetchReport(id);
        }
        
        setReport(r || null);
        setIsLoading(false);
        
        // If processing, simulate progress
        if (r?.status === 'processing') {
          const interval = setInterval(() => {
            setProcessingProgress(prev => {
              if (prev >= 95) {
                clearInterval(interval);
                return prev;
              }
              return prev + Math.random() * 15;
            });
          }, 500);

          // Check for completion
          const checkInterval = setInterval(async () => {
            const updated = await refetchReport(id);
            if (updated?.status === 'ready') {
              setReport(updated);
              setProcessingProgress(100);
              clearInterval(checkInterval);
            }
          }, 2000);

          return () => {
            clearInterval(interval);
            clearInterval(checkInterval);
          };
        }
      }
    };

    loadReport();
  }, [id, getReport, refetchReport]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Rapport introuvable</h2>
            <Link to="/app/reports">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
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

  const renderStatus = () => {
    switch (report.status) {
      case 'paid':
      case 'processing':
        return (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Génération de votre rapport...
              </h2>
              <p className="text-muted-foreground mb-6">
                Notre IA analyse vos données et vos concurrents
              </p>
              <Progress value={processingProgress} className="max-w-md mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Cela prend généralement 5-10 secondes
              </p>
            </CardContent>
          </Card>
        );
      
      case 'ready':
        return (
          <Card className="mb-8 border-primary">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Votre rapport est prêt !
              </h2>
              <p className="text-muted-foreground mb-6">
                Téléchargez votre rapport PDF premium ci-dessous
              </p>
              <Button size="lg" className="px-8">
                <Download className="w-4 h-4 mr-2" />
                Télécharger le PDF
              </Button>
            </CardContent>
          </Card>
        );
      
      case 'failed':
        return (
          <Card className="mb-8 border-destructive">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Échec de la génération
              </h2>
              <p className="text-muted-foreground mb-6">
                Une erreur s'est produite. Veuillez réessayer.
              </p>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => processReport(report.id)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        );

      case 'draft':
        return (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Rapport en attente de paiement
              </h2>
              <p className="text-muted-foreground mb-6">
                Ce rapport n'a pas encore été payé.
              </p>
              <Link to="/app/new">
                <Button size="lg">
                  Finaliser le paiement
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Back link */}
          <Link to="/app/reports" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux rapports
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {inputData?.businessName || 'Rapport'}
              </h1>
              <p className="text-muted-foreground">
                {inputData?.sector} • {inputData?.location?.city}, {inputData?.location?.country}
              </p>
            </div>
            <Badge variant={report.status === 'ready' ? 'default' : 'secondary'}>
              {report.plan}
            </Badge>
          </div>

          {/* Status */}
          {renderStatus()}

          {/* Report Preview (when ready) */}
          {report.status === 'ready' && outputData && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Résumé exécutif</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {outputData.executiveSummary.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vue d'ensemble du marché</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground text-sm leading-relaxed">
                    {outputData.marketOverview}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analyse concurrentielle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-medium text-foreground">Concurrent</th>
                          <th className="text-left py-2 pr-4 font-medium text-foreground">Forces</th>
                          <th className="text-left py-2 pr-4 font-medium text-foreground">Faiblesses</th>
                          <th className="text-left py-2 font-medium text-foreground">Prix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outputData.competitorTable.map((comp, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-3 pr-4 font-medium text-foreground">{comp.name}</td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {comp.strengths?.slice(0, 2).join(', ')}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {comp.weaknesses?.slice(0, 2).join(', ')}
                            </td>
                            <td className="py-3 text-muted-foreground">{comp.priceRange}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plan d'action 30/60/90 jours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {outputData.actionPlan30_60_90.map((plan) => (
                      <div key={plan.timeframe}>
                        <h4 className="font-semibold text-primary mb-3">
                          {plan.timeframe} jours
                        </h4>
                        <ul className="space-y-2">
                          {plan.tasks.map((task, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <div className="w-4 h-4 rounded border border-primary/30 flex-shrink-0 mt-0.5" />
                              <span className="text-foreground">{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm mb-4">
                  Ceci est un aperçu. Téléchargez le PDF complet pour toutes les sections.
                </p>
                <Button size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le PDF complet
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportDetail;
