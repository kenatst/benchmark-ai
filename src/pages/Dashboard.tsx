import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Clock, Trash2, RefreshCw, BarChart3, TrendingUp, Loader2 } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { reports, isLoading, deleteReport, triggerGeneration, fetchReports } = useReports();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const readyReports = reports.filter(r => r.status === 'ready').length;
  const processingReports = reports.filter(r => r.status === 'processing').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-mint/10 text-mint-foreground border-mint/20">Pret</Badge>;
      case 'processing':
        return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20 gap-1"><Loader2 className="w-3 h-3 animate-spin" />En cours</Badge>;
      case 'paid':
        return <Badge className="bg-sky/10 text-sky-foreground border-sky/20">Paye</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Echoue</Badge>;
      default:
        return <Badge variant="secondary">Brouillon</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'agency':
        return <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">AGENCY</Badge>;
      case 'pro':
        return <Badge className="bg-coral/10 text-coral-foreground border-coral/20 text-[10px]">PRO</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">STANDARD</Badge>;
    }
  };

  const handleDelete = async (e: React.MouseEvent, reportId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Supprimer ce rapport ?')) return;

    setDeletingId(reportId);
    try {
      await deleteReport(reportId);
      toast.success('Rapport supprime');
      fetchReports();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (e: React.MouseEvent, reportId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setRetryingId(reportId);
    try {
      await triggerGeneration(reportId);
      toast.success('Generation relancee');
      navigate(`/app/reports/${reportId}`);
    } catch {
      toast.error('Erreur lors de la relance');
    } finally {
      setRetryingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
              <p className="text-muted-foreground">Vos rapports de benchmark</p>
            </div>
            <Link to="/app/new">
              <Button size="lg" className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau benchmark
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Rapports generes
                </CardDescription>
                <CardTitle className="text-3xl">{readyReports}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total rapports
                </CardDescription>
                <CardTitle className="text-3xl">{reports.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Economies estimees</CardDescription>
                <CardTitle className="text-3xl text-primary">
                  {(readyReports * 2000).toLocaleString()}EUR+
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  vs. etude de cabinet-conseil traditionnelle
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Rapports recents</h2>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Chargement...
              </div>
            ) : reports.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Aucun rapport</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Generez votre premier benchmark en 3 etapes
                  </p>
                  <Link to="/app/new">
                    <Button>Generer mon benchmark</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {reports.map((report) => {
                  const inputData = report.input_data as { businessName?: string; sector?: string; location?: { city?: string } } | null;
                  return (
                    <Link key={report.id} to={`/app/reports/${report.id}`}>
                      <Card className="hover:border-primary/30 transition-colors cursor-pointer group">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-medium text-foreground truncate">
                                  {inputData?.businessName || 'Rapport'}
                                </h3>
                                {report.plan && getPlanBadge(report.plan)}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {inputData?.sector} {inputData?.location?.city ? `- ${inputData.location.city}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(report.created_at), 'd MMM yyyy', { locale: fr })}
                              </p>
                            </div>
                            {getStatusBadge(report.status)}

                            {/* Action buttons */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {report.status === 'failed' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-primary hover:text-primary"
                                  onClick={(e) => handleRetry(e, report.id)}
                                  disabled={retryingId === report.id}
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${retryingId === report.id ? 'animate-spin' : ''}`} />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => handleDelete(e, report.id)}
                                disabled={deletingId === report.id}
                              >
                                {deletingId === report.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
