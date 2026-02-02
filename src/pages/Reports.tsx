import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Plus, Trash2 } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Reports = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { reports, isLoading, deleteReport } = useReports();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleDelete = async (reportId: string) => {
    setDeletingId(reportId);
    
    const success = await deleteReport(reportId);
    if (success) {
      toast.success('Rapport supprimé');
    } else {
      toast.error('Erreur lors de la suppression');
    }
    setDeletingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Prêt</Badge>;
      case 'processing':
        return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">En cours</Badge>;
      case 'paid':
        return <Badge className="bg-mint/10 text-mint-foreground border-mint/20">Payé</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Échoué</Badge>;
      default:
        return <Badge variant="secondary">Brouillon</Badge>;
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Vos rapports</h1>
              <p className="text-muted-foreground">Consultez et téléchargez vos benchmarks</p>
            </div>
            <Link to="/app/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau rapport
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Chargement...
            </div>
          ) : reports.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Aucun rapport</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Générez votre premier benchmark pour commencer
                </p>
                <Link to="/app/new">
                  <Button>Générer mon benchmark</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <Link key={report.id} to={`/app/reports/${report.id}`}>
                  <Card className="h-full hover:border-primary/30 transition-colors cursor-pointer group relative">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status)}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer ce rapport ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. Le rapport sera définitivement supprimé.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete(report.id);
                                  }}
                                  disabled={deletingId === report.id}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deletingId === report.id ? 'Suppression...' : 'Supprimer'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {(report.input_data as { businessName?: string })?.businessName || 'Rapport'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {(report.input_data as { sector?: string })?.sector}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(report.created_at), 'd MMM yyyy', { locale: fr })}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Reports;
