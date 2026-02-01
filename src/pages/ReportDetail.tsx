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
import { ArrowLeft, FileText, Download, ExternalLink } from 'lucide-react';
import { ReportHero } from '@/components/report/ReportHero';
import { AnimatedCard } from '@/components/report/AnimatedCard';
import { SWOTGrid } from '@/components/report/SWOTGrid';
import { ActionPlanGrid } from '@/components/report/ActionPlanGrid';
import { FinancialMetrics } from '@/components/report/FinancialMetrics';
import { CompetitorTable } from '@/components/report/CompetitorTable';
import { 
  Zap, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign,
  CheckCircle
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
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-up" style={{ animationFillMode: 'forwards' }}>
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-muted-foreground" />
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
      <AnimatedCard title="Données du rapport" icon={<FileText className="w-5 h-5 text-primary" />}>
        <pre className="text-xs overflow-auto max-h-96 bg-muted/50 rounded-xl p-4">
          {JSON.stringify(outputData, null, 2)}
        </pre>
      </AnimatedCard>
    );
  };

  const renderStandardReport = (data: StandardReportOutput) => (
    <div className="space-y-6">
      {/* Executive Summary */}
      <AnimatedCard 
        title="Résumé Exécutif" 
        icon={<Zap className="w-6 h-6 text-primary" />}
        iconBg="bg-primary/10"
        delay={0}
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-2xl p-5 border border-primary/10">
            <h4 className="font-bold text-xl text-foreground mb-2">{data.executive_summary.headline}</h4>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-lavender/10 rounded-2xl p-5 border border-lavender/20 transition-all duration-300 hover:shadow-md">
              <h5 className="font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wide">Situation actuelle</h5>
              <p className="text-foreground">{data.executive_summary.situation_actuelle}</p>
            </div>
            <div className="bg-mint/10 rounded-2xl p-5 border border-mint/20 transition-all duration-300 hover:shadow-md">
              <h5 className="font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wide">Opportunité principale</h5>
              <p className="text-foreground">{data.executive_summary.opportunite_principale}</p>
            </div>
          </div>
          {data.executive_summary.key_findings?.length > 0 && (
            <div>
              <h5 className="font-semibold mb-3 text-foreground">Points clés</h5>
              <ul className="space-y-2">
                {data.executive_summary.key_findings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm bg-muted/30 rounded-xl p-3 transition-all duration-200 hover:bg-muted/50">
                    <CheckCircle className="w-5 h-5 text-mint-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* Market Context */}
      <AnimatedCard 
        title="Contexte Marché" 
        icon={<TrendingUp className="w-6 h-6 text-sky-foreground" />}
        iconBg="bg-sky/10"
        delay={100}
      >
        <div className="space-y-4">
          <p className="text-foreground">{data.market_context.sector_overview}</p>
          <div className="bg-muted/50 rounded-2xl p-5">
            <h5 className="font-semibold mb-2 text-foreground">Maturité du marché: <span className="text-primary">{data.market_context.market_maturity}</span></h5>
            <p className="text-muted-foreground">{data.market_context.local_market_specifics}</p>
          </div>
          {data.market_context.key_trends_impacting?.length > 0 && (
            <div>
              <h5 className="font-semibold mb-3 text-foreground">Tendances clés</h5>
              <div className="flex flex-wrap gap-2">
                {data.market_context.key_trends_impacting.map((trend, i) => (
                  <Badge key={i} variant="secondary" className="bg-sky/10 text-sky-foreground border-sky/20 px-3 py-1">
                    {trend}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* Competitive Landscape */}
      <AnimatedCard 
        title="Analyse Concurrentielle" 
        icon={<Users className="w-6 h-6 text-coral-foreground" />}
        iconBg="bg-coral/10"
        delay={200}
      >
        <CompetitorTable 
          competitors={data.competitive_landscape.competitors_analyzed || []}
          intensity={data.competitive_landscape.competition_intensity}
          currentPosition={data.competitive_landscape.your_current_position}
        />
      </AnimatedCard>

      {/* Positioning */}
      <AnimatedCard 
        title="Recommandations de Positionnement" 
        icon={<Target className="w-6 h-6 text-lavender-foreground" />}
        iconBg="bg-lavender/10"
        delay={300}
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20">
            <h5 className="font-bold text-lg mb-2 text-foreground">{data.positioning_recommendations.recommended_positioning}</h5>
            <p className="text-muted-foreground">{data.positioning_recommendations.rationale}</p>
          </div>
          <div className="bg-mint/10 rounded-2xl p-5 border border-mint/20">
            <h5 className="font-semibold mb-2 text-mint-foreground">Proposition de valeur</h5>
            <p className="text-foreground">{data.positioning_recommendations.value_proposition}</p>
          </div>
          {data.positioning_recommendations.tagline_suggestions?.length > 0 && (
            <div>
              <h5 className="font-semibold mb-3 text-foreground">Suggestions de taglines</h5>
              <div className="space-y-2">
                {data.positioning_recommendations.tagline_suggestions.map((tagline, i) => (
                  <div key={i} className="bg-muted/50 rounded-xl px-5 py-3 text-foreground italic border-l-4 border-lavender">
                    "{tagline}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* Pricing Strategy */}
      <AnimatedCard 
        title="Stratégie Tarifaire" 
        icon={<DollarSign className="w-6 h-6 text-gold" />}
        iconBg="bg-gold/10"
        delay={400}
      >
        <div className="space-y-4">
          <p className="text-foreground">{data.pricing_strategy.current_assessment}</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-2xl p-5 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Budget</p>
              <p className="text-xl font-bold text-foreground">{data.pricing_strategy.market_benchmarks.budget_tier}</p>
            </div>
            <div className="bg-primary/10 rounded-2xl p-5 text-center border border-primary/20 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Milieu</p>
              <p className="text-xl font-bold text-foreground">{data.pricing_strategy.market_benchmarks.mid_tier}</p>
            </div>
            <div className="bg-gold/10 rounded-2xl p-5 text-center border border-gold/20 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Premium</p>
              <p className="text-xl font-bold text-foreground">{data.pricing_strategy.market_benchmarks.premium_tier}</p>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Action Plan */}
      <AnimatedCard 
        title="Plan d'Action 30/60/90 Jours" 
        delay={500}
      >
        <ActionPlanGrid 
          now_7_days={data.action_plan.now_7_days}
          days_8_30={data.action_plan.days_8_30}
          days_31_90={data.action_plan.days_31_90}
        />
      </AnimatedCard>

      {/* Download CTA */}
      <div 
        className="text-center py-10 bg-gradient-to-br from-primary/10 via-lavender/10 to-transparent rounded-3xl border border-border animate-fade-up"
        style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
      >
        <p className="text-muted-foreground mb-4">
          Téléchargez le rapport complet pour toutes les sections détaillées.
        </p>
        <Button size="lg" onClick={handleDownload} className="gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
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
        <AnimatedCard 
          title="Market Intelligence" 
          icon={<TrendingUp className="w-6 h-6 text-primary" />}
          iconBg="bg-primary/10"
          badge={<Badge className="bg-primary/10 text-primary border-primary/20">PRO</Badge>}
          delay={700}
        >
          <div className="space-y-4">
            {data.market_intelligence.sector_trends_2026?.map((trend, i) => (
              <div key={i} className="bg-muted/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-md">
                <h5 className="font-semibold text-foreground mb-2">{trend.trend}</h5>
                <p className="text-sm text-muted-foreground mb-2">Impact: {trend.impact_on_you}</p>
                <p className="text-sm text-primary flex items-center gap-2">
                  <span>→</span> {trend.how_to_leverage}
                </p>
              </div>
            ))}
          </div>
        </AnimatedCard>
      )}
      
      {/* Customer Insights - Pro exclusive */}
      {data.customer_insights && (
        <AnimatedCard 
          title="Customer Insights" 
          icon={<Users className="w-6 h-6 text-primary" />}
          iconBg="bg-primary/10"
          badge={<Badge className="bg-primary/10 text-primary border-primary/20">PRO</Badge>}
          delay={800}
        >
          <div className="space-y-4">
            {data.customer_insights.pain_points_identified?.map((pp, i) => (
              <div key={i} className="bg-coral/5 rounded-2xl p-5 border border-coral/10 transition-all duration-300 hover:shadow-md">
                <h5 className="font-semibold text-foreground mb-2">{pp.pain_point}</h5>
                <p className="text-sm text-muted-foreground mb-2">Evidence: {pp.evidence}</p>
                <p className="text-sm text-mint-foreground flex items-center gap-2">
                  <span>💡</span> Opportunité: {pp.opportunity}
                </p>
              </div>
            ))}
          </div>
        </AnimatedCard>
      )}
    </div>
  );

  const renderAgencyReport = (data: AgencyReportOutput) => (
    <div className="space-y-6">
      {/* Executive Summary - Agency style */}
      <AnimatedCard 
        title="Résumé Exécutif" 
        icon={<Zap className="w-6 h-6 text-sky-foreground" />}
        iconBg="bg-sky/10"
        badge={<Badge className="bg-sky text-sky-foreground border-sky/30">AGENCY</Badge>}
        className="border-sky/20"
        delay={0}
      >
        <div className="space-y-4">
          <div className="bg-card rounded-2xl p-6 border border-border">
            <p className="text-lg leading-relaxed text-foreground">{data.executive_summary.one_page_summary}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-primary/10 rounded-2xl p-5 border border-primary/20 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <h5 className="font-semibold text-sm text-muted-foreground mb-2">Investissement requis</h5>
              <p className="text-2xl font-black text-foreground">{data.executive_summary.investment_required}</p>
            </div>
            <div className="bg-mint/10 rounded-2xl p-5 border border-mint/20 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <h5 className="font-semibold text-sm text-muted-foreground mb-2">ROI attendu</h5>
              <p className="text-2xl font-black text-foreground">{data.executive_summary.expected_roi}</p>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* SWOT Analysis */}
      {data.swot_analysis && (
        <AnimatedCard 
          title="Analyse SWOT" 
          delay={100}
        >
          <SWOTGrid data={data.swot_analysis} />
        </AnimatedCard>
      )}

      {/* Financial Projections */}
      {data.financial_projections && (
        <AnimatedCard 
          title="Projections Financières" 
          icon={<DollarSign className="w-6 h-6 text-gold" />}
          iconBg="bg-gold/10"
          badge={<Badge className="bg-gold text-gold-foreground border-gold/30">AGENCY</Badge>}
          delay={200}
        >
          <FinancialMetrics 
            scenarios={data.financial_projections.revenue_scenarios}
            unitEconomics={data.financial_projections.unit_economics}
          />
        </AnimatedCard>
      )}

      {/* Sources */}
      {data.sources?.length > 0 && (
        <AnimatedCard 
          title={`Sources (${data.sources.length})`}
          delay={300}
        >
          <div className="grid md:grid-cols-2 gap-3">
            {data.sources.slice(0, 12).map((source, i) => (
              <a 
                key={i} 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-2 truncate bg-muted/30 rounded-xl p-3 transition-all duration-200 hover:bg-muted/50"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{source.title || source.url}</span>
              </a>
            ))}
          </div>
        </AnimatedCard>
      )}

      {/* Download CTA */}
      <div 
        className="text-center py-12 bg-gradient-to-br from-sky/15 via-primary/10 to-transparent rounded-3xl border border-sky/20 animate-fade-up"
        style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
      >
        <h3 className="text-2xl font-black text-foreground mb-3">Rapport Agency-Grade Complet</h3>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Incluant PESTEL, Porter 5 Forces, Roadmap 12 mois et bien plus.
        </p>
        <Button size="lg" onClick={handleDownload} className="gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <Download className="w-5 h-5" />
          Télécharger le rapport complet
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-lavender/5 flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 via-lavender/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky/10 via-mint/5 to-transparent rounded-full blur-3xl" />
      </div>

      <Navbar />
      
      <main className="flex-1 py-8 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          {/* Back link */}
          <Link 
            to="/app/reports" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-all duration-200 hover:gap-3 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux rapports
          </Link>

          {/* Hero Section */}
          <ReportHero
            status={report.status || 'draft'}
            plan={report.plan || 'standard'}
            businessName={inputData?.businessName || 'Rapport'}
            sector={inputData?.sector || ''}
            location={`${inputData?.location?.city || ''}, ${inputData?.location?.country || ''}`}
            pdfUrl={report.pdf_url}
            processingProgress={processingProgress}
            onDownload={handleDownload}
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />

          {/* Report Content */}
          {renderReportContent()}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportDetail;
