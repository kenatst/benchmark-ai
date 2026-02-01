import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, CheckCircle, Clock, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ReportHeroProps {
  status: string;
  plan: string;
  businessName: string;
  sector: string;
  location: string;
  pdfUrl?: string | null;
  processingProgress: number;
  onDownload: () => void;
  onRetry: () => void;
  isRetrying: boolean;
}

export const ReportHero = ({
  status,
  plan,
  businessName,
  sector,
  location,
  pdfUrl,
  processingProgress,
  onDownload,
  onRetry,
  isRetrying
}: ReportHeroProps) => {
  const planColors = {
    agency: 'from-sky/20 via-sky/10 to-transparent border-sky/30',
    pro: 'from-primary/20 via-primary/10 to-transparent border-primary/30',
    standard: 'from-lavender/20 via-lavender/10 to-transparent border-lavender/30'
  };

  const planBadgeColors = {
    agency: 'bg-sky text-sky-foreground border-sky/50',
    pro: 'bg-primary text-primary-foreground border-primary/50',
    standard: 'bg-lavender text-lavender-foreground border-lavender/50'
  };

  return (
    <div className={`relative rounded-3xl bg-gradient-to-br ${planColors[plan as keyof typeof planColors] || planColors.standard} border overflow-hidden mb-8`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-sky/10 blur-2xl animate-float-slow" />
      </div>

      <div className="relative p-8 md:p-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="animate-fade-up" style={{ animationFillMode: 'forwards' }}>
            <Badge 
              className={`mb-4 ${planBadgeColors[plan as keyof typeof planBadgeColors] || planBadgeColors.standard} text-xs font-bold tracking-wider px-3 py-1`}
            >
              {plan?.toUpperCase()}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">
              {businessName}
            </h1>
            <p className="text-lg text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
              {sector} • {location}
            </p>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            {status === 'ready' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  size="lg" 
                  onClick={onDownload} 
                  className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Download className="w-5 h-5" />
                  Télécharger le PDF
                </Button>
                {pdfUrl && (
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => window.open(pdfUrl, '_blank')} 
                    className="gap-2 hover:bg-background/80"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Ouvrir
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status indicators */}
        {(status === 'processing' || status === 'paid') && (
          <div className="mt-8 animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Génération en cours...</h3>
                <p className="text-muted-foreground">
                  {processingProgress < 30 && "Analyse des données..."}
                  {processingProgress >= 30 && processingProgress < 60 && "Recherche web en cours..."}
                  {processingProgress >= 60 && processingProgress < 90 && "Génération du rapport..."}
                  {processingProgress >= 90 && "Finalisation..."}
                </p>
              </div>
            </div>
            <Progress value={processingProgress} className="h-3 rounded-full" />
          </div>
        )}

        {status === 'ready' && (
          <div className="mt-6 flex items-center gap-3 animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <div className="w-10 h-10 rounded-xl bg-mint/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-mint-foreground" />
            </div>
            <span className="text-mint-foreground font-semibold">Votre rapport est prêt ! 🎉</span>
          </div>
        )}

        {status === 'failed' && (
          <div className="mt-8 animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Échec de la génération</h3>
                <p className="text-muted-foreground">Un problème technique est survenu. Réessayez gratuitement.</p>
              </div>
            </div>
            <Button 
              size="lg" 
              onClick={onRetry}
              disabled={isRetrying}
              className="gap-2 mt-4"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Relance en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Réessayer la génération
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
