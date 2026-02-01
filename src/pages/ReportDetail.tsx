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
import { ReportInput, ReportOutput, StandardReportOutput, ProReportOutput, AgencyReportOutput } from '@/types/report';
import { toast } from 'sonner';
import { 
  Download, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Zap,
  ExternalLink
} from 'lucide-react';

// Helper to check report tier
const isAgencyReport = (data: ReportOutput): data is AgencyReportOutput => {
  return data?.report_metadata?.tier === 'agency';
};

const isProReport = (data: ReportOutput): data is ProReportOutput => {
  return data?.report_metadata?.tier === 'pro';
};

const isStandardReport = (data: ReportOutput): data is StandardReportOutput => {
  return data?.report_metadata?.tier === 'standard';
};

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
        
        // If not in local state, fetch from DB
        if (!r) {
          r = await refetchReport(id);
        }
        
        setReport(r || null);
        setIsLoading(false);
        
        // If processing or paid, poll for updates
        if (r?.status === 'processing' || r?.status === 'paid') {
          const interval = setInterval(() => {
            setProcessingProgress(prev => {
              if (prev >= 95) return prev;
              return prev + Math.random() * 10;
            });
          }, 500);

          // Check for completion every 3 seconds
          const checkInterval = setInterval(async () => {
            const updated = await refetchReport(id);
            if (updated?.status === 'ready') {
              setReport(updated);
              setProcessingProgress(100);
              clearInterval(checkInterval);
              clearInterval(interval);
              toast.success('Votre rapport est prêt !');
            } else if (updated?.status === 'failed') {
              setReport(updated);
              clearInterval(checkInterval);
              clearInterval(interval);
              toast.error('La génération a échoué. Vous pouvez réessayer.');
            }
          }, 3000);

          return () => {
            clearInterval(interval);
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
          <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Génération en cours...
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Notre IA analyse vos données, recherche sur le web et construit votre rapport stratégique personnalisé.
              </p>
              <Progress value={processingProgress} className="max-w-md mx-auto mb-4 h-3" />
              <p className="text-sm text-muted-foreground">
                {processingProgress < 30 && "Analyse des données..."}
                {processingProgress >= 30 && processingProgress < 60 && "Recherche web en cours..."}
                {processingProgress >= 60 && processingProgress < 90 && "Génération du rapport..."}
                {processingProgress >= 90 && "Finalisation..."}
              </p>
            </CardContent>
          </Card>
        );
      
      case 'ready':
        return (
          <Card className="mb-8 border-mint/30 bg-gradient-to-br from-mint/10 to-transparent">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-mint/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-mint-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Votre rapport est prêt ! 🎉
              </h2>
              <p className="text-muted-foreground mb-6">
                {report.plan === 'agency' ? 'Rapport Agency-Grade complet' : 
                 report.plan === 'pro' ? 'Rapport Premium avec recherche web' : 
                 'Rapport Standard'}
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" onClick={handleDownload} className="gap-2">
                  <Download className="w-5 h-5" />
                  Télécharger le rapport
                </Button>
                {report.pdf_url && (
                  <Button size="lg" variant="outline" onClick={() => window.open(report.pdf_url!, '_blank')} className="gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      
      case 'failed':
        return (
          <Card className="mb-8 border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Échec de la génération
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Un problème technique est survenu. Vous pouvez relancer la génération gratuitement.
              </p>
              <Button 
                size="lg" 
                onClick={handleRetry}
                disabled={isRetrying}
                className="gap-2"
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

  // Render report content based on tier
  const renderReportContent = () => {
    if (!outputData || report.status !== 'ready') return null;

    // Determine tier and render accordingly
    if (isAgencyReport(outputData)) {
      return renderAgencyReport(outputData);
    } else if (isProReport(outputData)) {
      return renderProReport(outputData);
    } else if (isStandardReport(outputData)) {
      return renderStandardReport(outputData);
    }
    
    // Fallback for unknown format
    return (
      <Card>
        <CardContent className="p-6">
          <pre className="text-xs overflow-auto max-h-96">
            {JSON.stringify(outputData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  };

  const renderStandardReport = (data: StandardReportOutput) => (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <CardTitle>Résumé Exécutif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-xl p-4">
            <h4 className="font-semibold text-lg mb-2">{data.executive_summary.headline}</h4>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <h5 className="font-medium text-sm text-muted-foreground mb-2">Situation actuelle</h5>
              <p className="text-foreground">{data.executive_summary.situation_actuelle}</p>
            </div>
            <div className="bg-mint/5 rounded-xl p-4 border border-mint/10">
              <h5 className="font-medium text-sm text-muted-foreground mb-2">Opportunité principale</h5>
              <p className="text-foreground">{data.executive_summary.opportunite_principale}</p>
            </div>
          </div>
          {data.executive_summary.key_findings?.length > 0 && (
            <div>
              <h5 className="font-medium mb-3">Points clés</h5>
              <ul className="space-y-2">
                {data.executive_summary.key_findings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-mint-foreground flex-shrink-0 mt-0.5" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Context */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-sky-foreground" />
          </div>
          <CardTitle>Contexte Marché</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{data.market_context.sector_overview}</p>
          <div className="bg-muted/50 rounded-xl p-4">
            <h5 className="font-medium mb-2">Maturité du marché: {data.market_context.market_maturity}</h5>
            <p className="text-sm text-muted-foreground">{data.market_context.local_market_specifics}</p>
          </div>
          {data.market_context.key_trends_impacting?.length > 0 && (
            <div>
              <h5 className="font-medium mb-3">Tendances clés</h5>
              <div className="flex flex-wrap gap-2">
                {data.market_context.key_trends_impacting.map((trend, i) => (
                  <Badge key={i} variant="secondary">{trend}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competitive Landscape */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-coral-foreground" />
          </div>
          <CardTitle>Analyse Concurrentielle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted/50 rounded-xl">
            <p className="font-medium">Intensité: {data.competitive_landscape.competition_intensity}</p>
            <p className="text-sm text-muted-foreground mt-1">Position actuelle: {data.competitive_landscape.your_current_position}</p>
          </div>
          
          {data.competitive_landscape.competitors_analyzed?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 pr-4 font-semibold">Concurrent</th>
                    <th className="text-left py-3 pr-4 font-semibold">Positionnement</th>
                    <th className="text-left py-3 pr-4 font-semibold">Forces</th>
                    <th className="text-left py-3 font-semibold">Menace</th>
                  </tr>
                </thead>
                <tbody>
                  {data.competitive_landscape.competitors_analyzed.map((comp, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-3 pr-4 font-medium">{comp.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{comp.positioning}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {comp.strengths?.slice(0, 2).join(', ')}
                      </td>
                      <td className="py-3">
                        <Badge variant={comp.threat_level === 'Élevé' || comp.threat_level === 'High' ? 'destructive' : 'secondary'}>
                          {comp.threat_level}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Positioning */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lavender/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-lavender-foreground" />
          </div>
          <CardTitle>Recommandations de Positionnement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <h5 className="font-semibold mb-2">{data.positioning_recommendations.recommended_positioning}</h5>
            <p className="text-sm text-muted-foreground">{data.positioning_recommendations.rationale}</p>
          </div>
          <div className="bg-mint/5 rounded-xl p-4 border border-mint/10">
            <h5 className="font-medium mb-2">Proposition de valeur</h5>
            <p>{data.positioning_recommendations.value_proposition}</p>
          </div>
          {data.positioning_recommendations.tagline_suggestions?.length > 0 && (
            <div>
              <h5 className="font-medium mb-3">Suggestions de taglines</h5>
              <div className="space-y-2">
                {data.positioning_recommendations.tagline_suggestions.map((tagline, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg px-4 py-2 text-sm italic">
                    "{tagline}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Strategy */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-gold" />
          </div>
          <CardTitle>Stratégie Tarifaire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{data.pricing_strategy.current_assessment}</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase mb-1">Budget</p>
              <p className="font-semibold">{data.pricing_strategy.market_benchmarks.budget_tier}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase mb-1">Milieu</p>
              <p className="font-semibold">{data.pricing_strategy.market_benchmarks.mid_tier}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase mb-1">Premium</p>
              <p className="font-semibold">{data.pricing_strategy.market_benchmarks.premium_tier}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plan d'Action 30/60/90 Jours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <h4 className="font-semibold text-primary mb-4">📅 J1-7 : Quick Wins</h4>
              <ul className="space-y-3">
                {data.action_plan.now_7_days?.map((item, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-medium">{item.action}</p>
                    <p className="text-muted-foreground text-xs mt-1">→ {item.outcome}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-sky/5 rounded-xl p-4 border border-sky/10">
              <h4 className="font-semibold text-sky-foreground mb-4">📅 J8-30 : Fondations</h4>
              <ul className="space-y-3">
                {data.action_plan.days_8_30?.map((item, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-medium">{item.action}</p>
                    <p className="text-muted-foreground text-xs mt-1">→ {item.outcome}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-mint/5 rounded-xl p-4 border border-mint/10">
              <h4 className="font-semibold text-mint-foreground mb-4">📅 J31-90 : Croissance</h4>
              <ul className="space-y-3">
                {data.action_plan.days_31_90?.map((item, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-medium">{item.action}</p>
                    <p className="text-muted-foreground text-xs mt-1">→ {item.outcome}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download CTA */}
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Ceci est un aperçu interactif. Téléchargez le rapport complet pour toutes les sections.
        </p>
        <Button size="lg" onClick={handleDownload} className="gap-2">
          <Download className="w-5 h-5" />
          Télécharger le rapport complet
        </Button>
      </div>
    </div>
  );

  const renderProReport = (data: ProReportOutput) => (
    <div className="space-y-6">
      {/* Same structure as standard but with additional Pro sections */}
      {renderStandardReport(data as unknown as StandardReportOutput)}
      
      {/* Market Intelligence - Pro exclusive */}
      {data.market_intelligence && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">PRO</Badge>
              Market Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.market_intelligence.sector_trends_2026?.map((trend, i) => (
              <div key={i} className="bg-muted/50 rounded-xl p-4">
                <h5 className="font-medium mb-2">{trend.trend}</h5>
                <p className="text-sm text-muted-foreground mb-2">Impact: {trend.impact_on_you}</p>
                <p className="text-sm text-primary">→ {trend.how_to_leverage}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Customer Insights - Pro exclusive */}
      {data.customer_insights && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">PRO</Badge>
              Customer Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.customer_insights.pain_points_identified?.map((pp, i) => (
              <div key={i} className="bg-coral/5 rounded-xl p-4 border border-coral/10">
                <h5 className="font-medium mb-2">{pp.pain_point}</h5>
                <p className="text-sm text-muted-foreground mb-2">Evidence: {pp.evidence}</p>
                <p className="text-sm text-mint-foreground">Opportunité: {pp.opportunity}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAgencyReport = (data: AgencyReportOutput) => (
    <div className="space-y-6">
      {/* Executive Summary - Agency style */}
      <Card className="border-sky/20 bg-gradient-to-br from-sky/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className="bg-sky text-white">AGENCY</Badge>
            Résumé Exécutif
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-card rounded-xl p-6 border">
            <p className="text-lg leading-relaxed">{data.executive_summary.one_page_summary}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-primary/5 rounded-xl p-4">
              <h5 className="font-medium text-sm text-muted-foreground mb-2">Investissement requis</h5>
              <p className="text-xl font-bold">{data.executive_summary.investment_required}</p>
            </div>
            <div className="bg-mint/5 rounded-xl p-4">
              <h5 className="font-medium text-sm text-muted-foreground mb-2">ROI attendu</h5>
              <p className="text-xl font-bold">{data.executive_summary.expected_roi}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SWOT Analysis */}
      {data.swot_analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analyse SWOT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-mint/5 rounded-xl p-4 border border-mint/10">
                <h5 className="font-semibold text-mint-foreground mb-3">Forces</h5>
                <ul className="space-y-2">
                  {data.swot_analysis.strengths.map((s, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-mint-foreground">+</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-coral/5 rounded-xl p-4 border border-coral/10">
                <h5 className="font-semibold text-coral-foreground mb-3">Faiblesses</h5>
                <ul className="space-y-2">
                  {data.swot_analysis.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-coral-foreground">-</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-sky/5 rounded-xl p-4 border border-sky/10">
                <h5 className="font-semibold text-sky-foreground mb-3">Opportunités</h5>
                <ul className="space-y-2">
                  {data.swot_analysis.opportunities.map((o, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-sky-foreground">↗</span> {o}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gold/5 rounded-xl p-4 border border-gold/10">
                <h5 className="font-semibold text-gold mb-3">Menaces</h5>
                <ul className="space-y-2">
                  {data.swot_analysis.threats.map((t, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-gold">⚠</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Projections */}
      {data.financial_projections && (
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-gold text-white">AGENCY</Badge>
              Projections Financières
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase mb-1">Conservatif Y1</p>
                <p className="text-2xl font-bold">{data.financial_projections.revenue_scenarios.conservative.year_1.toLocaleString()}€</p>
              </div>
              <div className="bg-primary/10 rounded-xl p-4 text-center border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase mb-1">Baseline Y1</p>
                <p className="text-2xl font-bold">{data.financial_projections.revenue_scenarios.baseline.year_1.toLocaleString()}€</p>
              </div>
              <div className="bg-mint/10 rounded-xl p-4 text-center border border-mint/20">
                <p className="text-xs text-muted-foreground uppercase mb-1">Optimiste Y1</p>
                <p className="text-2xl font-bold">{data.financial_projections.revenue_scenarios.optimistic.year_1.toLocaleString()}€</p>
              </div>
            </div>
            
            <div className="bg-muted/30 rounded-xl p-4">
              <h5 className="font-medium mb-3">Unit Economics</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">CAC</p>
                  <p className="font-semibold">{data.financial_projections.unit_economics.customer_acquisition_cost}€</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">LTV</p>
                  <p className="font-semibold">{data.financial_projections.unit_economics.lifetime_value}€</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">LTV/CAC</p>
                  <p className="font-semibold">{data.financial_projections.unit_economics.ltv_cac_ratio}x</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payback</p>
                  <p className="font-semibold">{data.financial_projections.unit_economics.payback_period_months} mois</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      {data.sources?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sources ({data.sources.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-2">
              {data.sources.slice(0, 10).map((source, i) => (
                <a 
                  key={i} 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-2 truncate"
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  {source.title || source.url}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download CTA */}
      <div className="text-center py-8 bg-gradient-to-br from-sky/10 to-primary/10 rounded-2xl">
        <h3 className="text-xl font-bold mb-2">Rapport Agency-Grade Complet</h3>
        <p className="text-muted-foreground mb-6">
          Incluant PESTEL, Porter 5 Forces, Roadmap 12 mois et bien plus.
        </p>
        <Button size="lg" onClick={handleDownload} className="gap-2">
          <Download className="w-5 h-5" />
          Télécharger le rapport complet
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          {/* Back link */}
          <Link to="/app/reports" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux rapports
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {inputData?.businessName || 'Rapport'}
              </h1>
              <p className="text-muted-foreground text-lg">
                {inputData?.sector} • {inputData?.location?.city}, {inputData?.location?.country}
              </p>
            </div>
            <Badge 
              variant="secondary" 
              className={
                report.plan === 'agency' ? 'bg-sky/10 text-sky-foreground border-sky/20' :
                report.plan === 'pro' ? 'bg-primary/10 text-primary border-primary/20' :
                'bg-muted'
              }
            >
              {report.plan?.toUpperCase()}
            </Badge>
          </div>

          {/* Status */}
          {renderStatus()}

          {/* Report Content */}
          {renderReportContent()}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportDetail;
