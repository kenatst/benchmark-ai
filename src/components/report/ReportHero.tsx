import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, AlertCircle, RefreshCw, Loader2, FileSpreadsheet, Presentation } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ReportHeroProps {
  status: string;
  plan: string;
  businessName: string;
  sector: string;
  location: string;
  processingProgress: number;
  processingStep?: string;
  onDownload: () => void;
  onDownloadExcel?: () => void;
  onDownloadSlides?: () => void;
  onRetry: () => void;
  isRetrying: boolean;
  isDownloading?: boolean;
  isDownloadingExcel?: boolean;
  isDownloadingSlides?: boolean;
}

export const ReportHero = ({
  status,
  plan,
  businessName,
  sector,
  location,
  processingProgress,
  processingStep,
  onDownload,
  onDownloadExcel,
  onDownloadSlides,
  onRetry,
  isRetrying,
  isDownloading = false,
  isDownloadingExcel = false,
  isDownloadingSlides = false
}: ReportHeroProps) => {
  const isAgency = plan === 'agency';
  const getPlanLabel = (p: string) => {
    switch (p) {
      case 'agency': return 'AGENCY';
      case 'pro': return 'PRO';
      default: return 'STANDARD';
    }
  };

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
        <div>
          <Badge
            variant="outline"
            className="mb-4 font-mono text-xs tracking-widest"
          >
            {getPlanLabel(plan)}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-2">
            {businessName}
          </h1>
          <p className="text-lg text-muted-foreground">
            {sector} • {location}
          </p>
        </div>

        {status === 'ready' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="lg"
                onClick={onDownload}
                disabled={isDownloading}
                className="gap-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Télécharger PDF
                  </>
                )}
              </Button>
            </div>

            {/* Agency tier multi-format exports */}
            {isAgency && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="default"
                  variant="secondary"
                  onClick={onDownloadExcel}
                  disabled={isDownloadingExcel}
                  className="gap-2"
                >
                  {isDownloadingExcel ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Excel...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel
                    </>
                  )}
                </Button>
                <Button
                  size="default"
                  variant="secondary"
                  onClick={onDownloadSlides}
                  disabled={isDownloadingSlides}
                  className="gap-2"
                >
                  {isDownloadingSlides ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Slides...
                    </>
                  ) : (
                    <>
                      <Presentation className="w-4 h-4" />
                      Slides
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Processing State */}
      {(status === 'processing' || status === 'paid') && (
        <div className="bg-muted/50 rounded-xl border border-border p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-background animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Génération en cours
              </h3>
              <p className="text-sm text-muted-foreground">
                {processingStep || getDefaultStep(processingProgress)}
              </p>
            </div>
          </div>
          <Progress value={processingProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {Math.round(processingProgress)}%
          </p>
        </div>
      )}

      {/* Success State */}
      {status === 'ready' && (
        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
          <CheckCircle className="w-5 h-5 text-foreground" />
          <span className="text-foreground font-medium">Rapport prêt</span>
        </div>
      )}

      {/* Failed State */}
      {status === 'failed' && (
        <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Échec de la génération
              </h3>
              <p className="text-sm text-muted-foreground">
                Un problème technique est survenu. Réessayez gratuitement.
              </p>
            </div>
          </div>
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            className="gap-2"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Relance en cours...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

function getDefaultStep(progress: number): string {
  if (progress < 15) return "Initialisation...";
  if (progress < 30) return "Analyse du contexte business...";
  if (progress < 45) return "Recherche concurrentielle...";
  if (progress < 60) return "Analyse du marché...";
  if (progress < 75) return "Élaboration des recommandations...";
  if (progress < 90) return "Création du plan d'action...";
  return "Finalisation du rapport...";
}
