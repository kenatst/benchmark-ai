import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReports, Report } from '@/hooks/useReports';
import { useAuthContext } from '@/contexts/AuthContext';
import { ReportInput, ReportOutput, StandardReportOutput, ProReportOutput, AgencyReportOutput } from '@/types/report';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Download, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { ReportHero } from '@/components/report/ReportHero';
import { ReportSection } from '@/components/report/ReportSection';
import { TableOfContents } from '@/components/report/TableOfContents';
import { DataCard } from '@/components/report/DataCard';
import { AnimatedCard } from '@/components/report/AnimatedCard';
import { SWOTGrid } from '@/components/report/SWOTGrid';
import { ActionPlanGrid } from '@/components/report/ActionPlanGrid';
import { FinancialMetrics } from '@/components/report/FinancialMetrics';
import { CompetitorTable } from '@/components/report/CompetitorTable';
import {
  PorterForcesChart,
  PositioningMatrixChart,
  RevenueProjectionChart,
  UnitEconomicsChart,
  MethodologySection,
  MarketOverviewSection,
  TerritoryAnalysisSection,
  ScoringMatrixSection,
  TrendsAnalysisSection,
  StrategicRecommendationsSection,
  DetailedRoadmapSection,
  AppendicesSection
} from '@/components/report/charts';

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

// Section definitions for Table of Contents
const getSections = (tier: string) => {
  const baseSections = [
    { id: 'executive-summary', title: 'Résumé Exécutif' },
    { id: 'market-context', title: 'Contexte Marché' },
    { id: 'competitive-analysis', title: 'Analyse Concurrentielle' },
    { id: 'positioning', title: 'Positionnement' },
    { id: 'pricing', title: 'Stratégie Tarifaire' },
    { id: 'action-plan', title: 'Plan d\'Action' },
  ];

  if (tier === 'agency') {
    return [
      { id: 'executive-summary', title: 'Résumé Exécutif' },
      { id: 'methodology', title: 'Méthodologie' },
      { id: 'market-overview', title: 'Panorama Marché' },
      { id: 'territory', title: 'Analyse Territoriale' },
      { id: 'competitive-analysis', title: 'Benchmark Concurrentiel' },
      { id: 'scoring-matrix', title: 'Matrice de Scoring' },
      { id: 'trends', title: 'Tendances' },
      { id: 'swot', title: 'Analyse SWOT' },
      { id: 'porter-forces', title: 'Porter 5 Forces' },
      { id: 'strategic-reco', title: 'Recommandations' },
      { id: 'financial', title: 'Projections Financières' },
      { id: 'roadmap', title: 'Roadmap Détaillée' },
      { id: 'appendices', title: 'Annexes' },
    ];
  }

  return baseSections;
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
  const tier = report.plan || 'standard';
  const sections = getSections(tier);

  // Render Standard/Pro report content
  const renderStandardReport = (data: StandardReportOutput) => (
    <>
      {/* Executive Summary */}
      <ReportSection id="executive-summary" number={1} title="Résumé Exécutif">
        <div className="space-y-6">
          {data.executive_summary?.headline && (
            <div className="bg-foreground text-background rounded-xl p-6">
              <p className="text-xl font-semibold leading-relaxed">
                {data.executive_summary.headline}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <DataCard title="Situation actuelle">
              <p className="text-sm text-foreground leading-relaxed">
                {data.executive_summary?.situation_actuelle}
              </p>
            </DataCard>
            <DataCard title="Opportunité principale">
              <p className="text-sm text-foreground leading-relaxed">
                {data.executive_summary?.opportunite_principale}
              </p>
            </DataCard>
          </div>

          {data.executive_summary?.key_findings?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-3">Points clés</h4>
              <ul className="space-y-2">
                {data.executive_summary.key_findings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ReportSection>

      {/* Market Context */}
      <ReportSection id="market-context" number={2} title="Contexte Marché">
        <div className="space-y-6">
          <p className="text-foreground leading-relaxed">
            {data.market_context?.sector_overview}
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <DataCard
              title="Maturité du marché"
              value={data.market_context?.market_maturity}
            />
            <DataCard title="Spécificités locales">
              <p className="text-sm text-foreground">
                {data.market_context?.local_market_specifics}
              </p>
            </DataCard>
          </div>

          {data.market_context?.key_trends_impacting?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-3">Tendances clés</h4>
              <div className="flex flex-wrap gap-2">
                {data.market_context.key_trends_impacting.map((trend, i) => (
                  <Badge key={i} variant="secondary" className="font-normal">
                    {trend}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </ReportSection>

      {/* Competitive Analysis */}
      <ReportSection id="competitive-analysis" number={3} title="Analyse Concurrentielle">
        <CompetitorTable
          competitors={data.competitive_landscape?.competitors_analyzed || []}
          intensity={data.competitive_landscape?.competition_intensity || 'Non définie'}
          currentPosition={data.competitive_landscape?.your_current_position || 'Non définie'}
        />
      </ReportSection>

      {/* Positioning */}
      <ReportSection id="positioning" number={4} title="Recommandations de Positionnement">
        <div className="space-y-6">
          <DataCard title="Positionnement recommandé" variant="highlight">
            <p className="text-lg font-medium mt-2">
              {data.positioning_recommendations?.recommended_positioning}
            </p>
          </DataCard>

          <div className="grid md:grid-cols-2 gap-4">
            <DataCard title="Proposition de valeur">
              <p className="text-sm text-foreground">
                {data.positioning_recommendations?.value_proposition}
              </p>
            </DataCard>
            <DataCard title="Rationale">
              <p className="text-sm text-foreground">
                {data.positioning_recommendations?.rationale}
              </p>
            </DataCard>
          </div>

          {data.positioning_recommendations?.tagline_suggestions?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-3">Suggestions de taglines</h4>
              <div className="space-y-2">
                {data.positioning_recommendations.tagline_suggestions.map((tagline, i) => (
                  <div key={i} className="p-4 bg-muted/30 rounded-lg border-l-4 border-foreground">
                    <p className="text-foreground italic">"{tagline}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ReportSection>

      {/* Pricing Strategy */}
      <ReportSection id="pricing" number={5} title="Stratégie Tarifaire">
        <div className="space-y-6">
          <p className="text-foreground leading-relaxed">
            {data.pricing_strategy?.current_assessment}
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <DataCard
              title="Segment Budget"
              value={data.pricing_strategy?.market_benchmarks?.budget_tier}
            />
            <DataCard
              title="Segment Milieu"
              value={data.pricing_strategy?.market_benchmarks?.mid_tier}
              variant="highlight"
            />
            <DataCard
              title="Segment Premium"
              value={data.pricing_strategy?.market_benchmarks?.premium_tier}
            />
          </div>
        </div>
      </ReportSection>

      {/* Action Plan */}
      <ReportSection id="action-plan" number={6} title="Plan d'Action 30/60/90 Jours">
        <ActionPlanGrid
          now_7_days={data.action_plan?.now_7_days}
          days_8_30={data.action_plan?.days_8_30}
          days_31_90={data.action_plan?.days_31_90}
        />
      </ReportSection>

      {/* Download CTA */}
      <div className="text-center py-12 border-t border-border mt-12">
        <p className="text-muted-foreground mb-4">
          Téléchargez le rapport complet au format PDF
        </p>
        <Button size="lg" onClick={handleDownload} className="gap-2">
          <Download className="w-5 h-5" />
          Télécharger le rapport
        </Button>
      </div>
    </>
  );

  const renderProReport = (data: ProReportOutput) => (
    <>
      {renderStandardReport(data as unknown as StandardReportOutput)}

      {/* Pro-exclusive sections could go here */}
    </>
  );

  const renderAgencyReport = (data: AgencyReportOutput) => (
    <>
      {/* Executive Summary - Agency style */}
      <ReportSection id="executive-summary" number={1} title="Résumé Exécutif">
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <p className="text-lg leading-relaxed text-foreground">
              {data.executive_summary?.one_page_summary}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <DataCard title="Investissement requis" value={data.executive_summary?.investment_required} variant="highlight" />
            <DataCard title="ROI attendu" value={data.executive_summary?.expected_roi} />
          </div>

          {data.executive_summary?.strategic_recommendation && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary mb-1">Recommandation principale</p>
              <p className="text-foreground">{data.executive_summary.strategic_recommendation}</p>
            </div>
          )}
        </div>
      </ReportSection>

      {/* Methodology */}
      {data.methodology && (
        <ReportSection id="methodology" number={2} title="Méthodologie">
          <MethodologySection data={data.methodology} />
        </ReportSection>
      )}

      {/* Market Overview */}
      {data.market_overview_detailed && (
        <ReportSection id="market-overview" number={3} title="Panorama du Marché">
          <MarketOverviewSection data={data.market_overview_detailed} />
        </ReportSection>
      )}

      {/* Territory Analysis */}
      {data.territory_analysis && (
        <ReportSection id="territory" number={4} title="Analyse Territoriale">
          <TerritoryAnalysisSection data={data.territory_analysis} />
        </ReportSection>
      )}

      {/* Competitive Intelligence */}
      <ReportSection id="competitive-analysis" number={5} title="Benchmark Concurrentiel">
        <CompetitorTable
          competitors={data.competitive_intelligence?.competitors_deep_dive?.map(c => ({
            name: c.name, strengths: c.strengths, weaknesses: c.weaknesses, threat_level: c.threat_level,
            positioning: c.positioning?.value_prop, price_range: c.offering?.pricing_model
          })) || []}
          intensity="Élevée"
          currentPosition={data.competitive_intelligence?.competition_landscape_overview || ''}
        />
      </ReportSection>

      {/* Scoring Matrix */}
      {data.scoring_matrix && (
        <ReportSection id="scoring-matrix" number={6} title="Matrice Comparative et Scoring">
          <ScoringMatrixSection data={data.scoring_matrix} />
        </ReportSection>
      )}

      {/* Trends */}
      {data.trends_analysis && (
        <ReportSection id="trends" number={7} title="Analyse des Tendances">
          <TrendsAnalysisSection data={data.trends_analysis} />
        </ReportSection>
      )}

      {/* SWOT */}
      {data.swot_analysis && (
        <ReportSection id="swot" number={8} title="Analyse SWOT">
          <SWOTGrid data={data.swot_analysis} />
        </ReportSection>
      )}

      {/* Porter Five Forces */}
      {data.market_analysis?.porter_five_forces && (
        <ReportSection id="porter-forces" number={9} title="Analyse Porter 5 Forces">
          <PorterForcesChart data={data.market_analysis.porter_five_forces} />
        </ReportSection>
      )}

      {/* Strategic Recommendations */}
      {data.strategic_recommendations_detailed && (
        <ReportSection id="strategic-reco" number={10} title="Recommandations Stratégiques">
          <StrategicRecommendationsSection data={data.strategic_recommendations_detailed} />
        </ReportSection>
      )}

      {/* Financial Projections */}
      {data.financial_projections && (
        <ReportSection id="financial" number={11} title="Projections Financières">
          <div className="space-y-8">
            {data.financial_projections.revenue_scenarios && (
              <RevenueProjectionChart data={data.financial_projections.revenue_scenarios} />
            )}
            {data.financial_projections.unit_economics && (
              <UnitEconomicsChart data={data.financial_projections.unit_economics} />
            )}
          </div>
        </ReportSection>
      )}

      {/* Detailed Roadmap */}
      {data.detailed_roadmap && (
        <ReportSection id="roadmap" number={12} title="Roadmap de Mise en Œuvre">
          <DetailedRoadmapSection data={data.detailed_roadmap} />
        </ReportSection>
      )}

      {/* Appendices */}
      {data.appendices && (
        <ReportSection id="appendices" number={13} title="Annexes">
          <AppendicesSection data={data.appendices} />
        </ReportSection>
      )}

      {/* Download CTA */}
      <div className="text-center py-12 border-t border-border mt-12">
        <h3 className="text-xl font-bold text-foreground mb-2">Rapport Institutional Complet</h3>
        <p className="text-muted-foreground mb-6">25+ pages incluant méthodologie, matrices de scoring, analyses détaillées et annexes.</p>
        <Button size="lg" onClick={handleDownload} className="gap-2">
          <Download className="w-5 h-5" />
          Télécharger le rapport complet
        </Button>
      </div>
    </>
  );

  const renderReportContent = () => {
    if (!outputData || report.status !== 'ready') return null;

    if (isAgencyReport(outputData)) {
      return renderAgencyReport(outputData);
    } else if (isProReport(outputData)) {
      return renderProReport(outputData);
    } else if (isStandardReport(outputData)) {
      return renderStandardReport(outputData);
    }

    return (
      <AnimatedCard title="Données du rapport" icon={<FileText className="w-5 h-5" />}>
        <pre className="text-xs overflow-auto max-h-96 bg-muted/50 rounded-xl p-4">
          {JSON.stringify(outputData, null, 2)}
        </pre>
      </AnimatedCard>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            to="/app/reports"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux rapports
          </Link>

          {/* Main layout with TOC */}
          <div className="flex gap-12">
            {/* Table of Contents - Desktop only */}
            {report.status === 'ready' && (
              <TableOfContents
                sections={sections}
                className="w-56 flex-shrink-0"
              />
            )}

            {/* Main content */}
            <div className="flex-1 max-w-4xl">
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

              {/* Report Content */}
              {renderReportContent()}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportDetail;
