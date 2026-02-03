import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, TrendingUp, Users, Target, MapPin, DollarSign, BarChart3, FileText, CheckCircle, ArrowRight, Sparkles, Loader2, FileSpreadsheet, Presentation } from 'lucide-react';
import { ReportOutput, StandardReportOutput, ProReportOutput, AgencyReportOutput } from '@/types/report';

interface WebSummaryProps {
  outputData: ReportOutput;
  plan: string;
  pdfUrl?: string | null;
  onDownload: () => void;
  isDownloading?: boolean;
}

export const WebSummary = ({ outputData, plan, pdfUrl, onDownload, isDownloading = false }: WebSummaryProps) => {
  // Extract executive summary based on tier
  const isAgency = outputData?.report_metadata?.tier === 'agency';
  const isPro = outputData?.report_metadata?.tier === 'pro';

  const agencyData = outputData as AgencyReportOutput;
  const standardData = outputData as StandardReportOutput;

  // Get headline/summary
  const headline = isAgency
    ? agencyData.executive_summary?.strategic_recommendation
    : standardData.executive_summary?.headline;

  const summary = isAgency
    ? agencyData.executive_summary?.one_page_summary
    : standardData.executive_summary?.situation_actuelle;

  const keyFindings = isAgency
    ? agencyData.executive_summary?.critical_success_factors || []
    : standardData.executive_summary?.key_findings || [];

  const mainOpportunity = isAgency
    ? agencyData.executive_summary?.strategic_recommendation
    : standardData.executive_summary?.opportunite_principale;

  // KPIs for Agency - use market_analysis instead
  const investmentRequired = isAgency ? agencyData.executive_summary?.investment_required : null;
  const expectedRoi = isAgency ? agencyData.executive_summary?.expected_roi : null;
  const marketSize = isAgency ? agencyData.market_analysis?.market_sizing?.total_addressable_market : null;
  const growthRate = isAgency ? agencyData.market_analysis?.market_dynamics?.growth_rate : null;
  const wordCount = outputData?.report_metadata?.word_count;
  const sourcesCount = outputData?.report_metadata?.sources_count || (outputData as any)?.sources?.length;

  // Competitor count
  const competitorCount = isAgency
    ? agencyData.competitive_intelligence?.competitors_deep_dive?.length || 0
    : standardData.competitive_landscape?.competitors_analyzed?.length || 0;

  // Get PDF section count based on tier
  const getPdfSections = () => {
    if (isAgency) return { count: 13, pages: '40+' };
    if (isPro) return { count: 8, pages: '20+' };
    return { count: 6, pages: '12+' };
  };

  const pdfInfo = getPdfSections();

  const getPlanLabel = () => {
    switch (plan) {
      case 'agency': return { label: 'AGENCY', color: 'bg-primary text-primary-foreground' };
      case 'pro': return { label: 'PRO', color: 'bg-coral text-coral-foreground' };
      default: return { label: 'STANDARD', color: 'bg-secondary text-secondary-foreground' };
    }
  };

  // Document formats available per tier
  const getDocumentFormats = () => {
    if (isAgency) {
      return [
        { name: 'PDF', icon: FileText, available: true },
        { name: 'Excel', icon: FileSpreadsheet, available: true },
        { name: 'Slides', icon: Presentation, available: true },
      ];
    }
    return [
      { name: 'PDF', icon: FileText, available: true },
      { name: 'Excel', icon: FileSpreadsheet, available: false },
      { name: 'Slides', icon: Presentation, available: false },
    ];
  };

  const documentFormats = getDocumentFormats();
  const planInfo = getPlanLabel();

  return (
    <div className="space-y-8">
      {/* Main CTA Card - Prominent PDF Download */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-coral/5 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Rapport Complet Disponible</h3>
                  <p className="text-sm text-muted-foreground">
                    {pdfInfo.pages} pages • {pdfInfo.count} sections détaillées
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground max-w-lg">
                {isAgency
                  ? "Méthodologie, matrices de scoring, analyse territoriale, projections financières, roadmap détaillée et annexes complètes."
                  : isPro
                    ? "Analyse concurrentielle approfondie, stratégie tarifaire, positionnement et plan d'action 30/60/90 jours."
                    : "Analyse de marché, concurrents, positionnement et plan d'action structuré."}
              </p>

              {/* Document formats available */}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-muted-foreground">Formats disponibles:</span>
                {documentFormats.map((format) => (
                  <Badge
                    key={format.name}
                    variant={format.available ? "default" : "outline"}
                    className={`gap-1 text-xs ${!format.available ? 'opacity-40' : ''}`}
                  >
                    <format.icon className="w-3 h-3" />
                    {format.name}
                    {!format.available && <span className="text-[10px]">(Agency)</span>}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              size="lg"
              onClick={onDownload}
              disabled={!pdfUrl || isDownloading}
              className="gap-3 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Génération du PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Télécharger le PDF
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Sparkles className="w-5 h-5 text-primary" />
              Résumé Exécutif
            </CardTitle>
            <Badge className={planInfo.color}>{planInfo.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Headline */}
          {headline && (
            <div className="p-5 bg-foreground text-background rounded-xl">
              <p className="text-lg font-semibold leading-relaxed">
                {headline}
              </p>
            </div>
          )}

          {/* Summary Text */}
          {summary && (
            <p className="text-muted-foreground leading-relaxed">
              {summary}
            </p>
          )}

          {/* Key Findings */}
          {keyFindings.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground text-sm uppercase tracking-wide">Points Clés</h4>
              <ul className="space-y-2">
                {keyFindings.slice(0, 5).map((finding, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Opportunity */}
          {mainOpportunity && !isAgency && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary mb-1">Opportunité Principale</p>
              <p className="text-foreground">{mainOpportunity}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {investmentRequired && (
          <Card className="bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-coral/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-coral-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Investissement</p>
              <p className="text-lg font-bold text-foreground">{investmentRequired}</p>
            </CardContent>
          </Card>
        )}

        {expectedRoi && (
          <Card className="bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-mint/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-mint-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">ROI Attendu</p>
              <p className="text-lg font-bold text-foreground">{expectedRoi}</p>
            </CardContent>
          </Card>
        )}

        {marketSize && (
          <Card className="bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-sky/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-sky-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Taille Marché</p>
              <p className="text-lg font-bold text-foreground">{marketSize}</p>
            </CardContent>
          </Card>
        )}

        {competitorCount > 0 && (
          <Card className="bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-lavender/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-lavender-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Concurrents Analysés</p>
              <p className="text-lg font-bold text-foreground">{competitorCount}</p>
            </CardContent>
          </Card>
        )}

        {wordCount && (
          <Card className="bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Longueur</p>
              <p className="text-lg font-bold text-foreground">{wordCount.toLocaleString()} mots</p>
            </CardContent>
          </Card>
        )}

        {sourcesCount ? (
          <Card className="bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-coral/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-coral-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Sources</p>
              <p className="text-lg font-bold text-foreground">{sourcesCount}</p>
            </CardContent>
          </Card>
        ) : null}

        {!investmentRequired && !expectedRoi && (
          <>
            <Card className="bg-gradient-to-br from-background to-muted/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-coral/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-coral-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Sections</p>
                <p className="text-lg font-bold text-foreground">{pdfInfo.count}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-background to-muted/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-mint/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-mint-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pages</p>
                <p className="text-lg font-bold text-foreground">{pdfInfo.pages}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* What's in the PDF - Teaser */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Contenu du Rapport PDF</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {isAgency ? (
              <>
                <SectionTeaser icon={<BarChart3 />} title="Méthodologie" />
                <SectionTeaser icon={<TrendingUp />} title="Panorama Marché" />
                <SectionTeaser icon={<MapPin />} title="Analyse Territoriale" />
                <SectionTeaser icon={<Users />} title="Benchmark Concurrentiel" />
                <SectionTeaser icon={<Target />} title="Matrice de Scoring" />
                <SectionTeaser icon={<Sparkles />} title="Analyse SWOT" />
                <SectionTeaser icon={<BarChart3 />} title="Porter 5 Forces" />
                <SectionTeaser icon={<DollarSign />} title="Projections Financières" />
                <SectionTeaser icon={<FileText />} title="Roadmap 30/60/90" />
              </>
            ) : isPro ? (
              <>
                <SectionTeaser icon={<TrendingUp />} title="Contexte Marché" />
                <SectionTeaser icon={<Users />} title="Analyse Concurrentielle" />
                <SectionTeaser icon={<Target />} title="Positionnement" />
                <SectionTeaser icon={<DollarSign />} title="Stratégie Tarifaire" />
                <SectionTeaser icon={<Sparkles />} title="Intelligence Marché" />
                <SectionTeaser icon={<FileText />} title="Plan d'Action" />
              </>
            ) : (
              <>
                <SectionTeaser icon={<TrendingUp />} title="Contexte Marché" />
                <SectionTeaser icon={<Users />} title="Concurrents" />
                <SectionTeaser icon={<Target />} title="Positionnement" />
                <SectionTeaser icon={<DollarSign />} title="Prix" />
                <SectionTeaser icon={<FileText />} title="Plan d'Action" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom CTA */}
      <div className="text-center py-8 border-t border-border">
        <p className="text-muted-foreground mb-4">
          Accédez à l'analyse complète dans le rapport PDF
        </p>
        <Button
          size="lg"
          onClick={onDownload}
          disabled={!pdfUrl || isDownloading}
          className="gap-2"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Télécharger le Rapport Complet
            </>
          )}
        </Button>
      </div>
    </div >
  );
};

// Helper component for section teasers
const SectionTeaser = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground">
      {icon}
    </div>
    <span className="text-sm font-medium text-foreground">{title}</span>
  </div>
);
