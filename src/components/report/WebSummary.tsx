import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, TrendingUp, Users, Target, MapPin, DollarSign, BarChart3, FileText, CheckCircle, ArrowRight, Sparkles, Loader2, AlertTriangle, Lightbulb, Zap } from 'lucide-react';
import { ReportOutput, StandardReportOutput, ProReportOutput, AgencyReportOutput } from '@/types/report';

interface WebSummaryProps {
  outputData: ReportOutput;
  plan: string;
  pdfUrl?: string | null;
  onDownload: () => void;
  isDownloading?: boolean;
}

export const WebSummary = ({ outputData, plan, pdfUrl, onDownload, isDownloading = false }: WebSummaryProps) => {
  const isAgency = outputData?.report_metadata?.tier === 'agency';
  const isPro = outputData?.report_metadata?.tier === 'pro';

  const agencyData = outputData as AgencyReportOutput;
  const standardData = outputData as StandardReportOutput;
  const proData = outputData as ProReportOutput;

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

  // KPIs
  const investmentRequired = isAgency ? agencyData.executive_summary?.investment_required : null;
  const expectedRoi = isAgency ? agencyData.executive_summary?.expected_roi : null;
  const marketSize = isAgency ? agencyData.market_analysis?.market_sizing?.total_addressable_market : null;
  const growthRate = isAgency ? agencyData.market_analysis?.market_dynamics?.growth_rate : null;
  const wordCount = outputData?.report_metadata?.word_count;
  const sourcesCount = outputData?.report_metadata?.sources_count || (outputData as Record<string, unknown>)?.sources && Array.isArray((outputData as Record<string, unknown>).sources) ? ((outputData as Record<string, unknown>).sources as unknown[]).length : 0;

  // Competitor data
  const competitors = isAgency
    ? agencyData.competitive_intelligence?.competitors_deep_dive || []
    : standardData.competitive_landscape?.competitors_analyzed || [];
  const competitorCount = competitors.length;

  // Positioning data
  const positioning = isAgency
    ? agencyData.strategic_recommendations?.positioning_strategy
    : standardData.positioning_recommendations;

  // Pricing data
  const pricingStrategy = isAgency
    ? null
    : standardData.pricing_strategy;

  // Action plan
  const actionPlan = !isAgency ? standardData.action_plan : null;

  // Risks
  const risks = isAgency
    ? agencyData.risk_register
    : null;

  // SWOT (Agency)
  const swot = isAgency ? agencyData.swot_analysis : null;

  const getPlanLabel = () => {
    switch (plan) {
      case 'agency': return { label: 'AGENCY', color: 'bg-primary text-primary-foreground' };
      case 'pro': return { label: 'PRO', color: 'bg-coral text-coral-foreground' };
      default: return { label: 'STANDARD', color: 'bg-secondary text-secondary-foreground' };
    }
  };

  const planInfo = getPlanLabel();

  return (
    <div className="space-y-6">
      {/* Download CTA */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-coral/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Rapport PDF complet</h3>
                <p className="text-sm text-muted-foreground">
                  {wordCount ? `${wordCount.toLocaleString()} mots` : ''} {competitorCount > 0 ? `- ${competitorCount} concurrents analyses` : ''}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={onDownload}
              disabled={!pdfUrl || isDownloading}
              className="gap-2 shadow-lg"
            >
              {isDownloading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generation...</>
              ) : (
                <><Download className="w-4 h-4" /> Telecharger le PDF</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              Resume Executif
            </CardTitle>
            <Badge className={planInfo.color}>{planInfo.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {headline && (
            <div className="p-4 bg-foreground text-background rounded-xl">
              <p className="text-base font-semibold leading-relaxed">{headline}</p>
            </div>
          )}

          {summary && (
            <p className="text-muted-foreground leading-relaxed text-sm">{summary}</p>
          )}

          {keyFindings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wide">Points Cles</h4>
              <ul className="space-y-2">
                {keyFindings.slice(0, 5).map((finding, i) => (
                  <li key={i} className="flex items-start gap-2 p-2.5 bg-muted/30 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mainOpportunity && !isAgency && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-medium text-primary mb-1">Opportunite Principale</p>
              <p className="text-sm text-foreground">{mainOpportunity}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {investmentRequired && (
          <KPICard icon={<DollarSign className="w-4 h-4 text-coral-foreground" />} label="Investissement" value={investmentRequired} color="bg-coral/10" />
        )}
        {expectedRoi && (
          <KPICard icon={<TrendingUp className="w-4 h-4 text-mint-foreground" />} label="ROI Attendu" value={expectedRoi} color="bg-mint/10" />
        )}
        {marketSize && (
          <KPICard icon={<BarChart3 className="w-4 h-4 text-sky-foreground" />} label="Taille Marche" value={marketSize} color="bg-sky/10" />
        )}
        {competitorCount > 0 && (
          <KPICard icon={<Users className="w-4 h-4 text-lavender-foreground" />} label="Concurrents" value={String(competitorCount)} color="bg-lavender/10" />
        )}
        {wordCount && (
          <KPICard icon={<FileText className="w-4 h-4 text-primary" />} label="Mots" value={wordCount.toLocaleString()} color="bg-primary/10" />
        )}
        {!investmentRequired && !expectedRoi && (
          <KPICard icon={<Target className="w-4 h-4 text-coral-foreground" />} label="Sections" value={isAgency ? '13+' : isPro ? '8+' : '6+'} color="bg-coral/10" />
        )}
      </div>

      {/* Competitors Table (show real data) */}
      {competitors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-lavender-foreground" />
              Analyse Concurrentielle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {competitors.slice(0, 5).map((comp, i) => {
                const name = (comp as Record<string, unknown>).name as string || `Concurrent ${i + 1}`;
                const positioning_val = (comp as Record<string, unknown>).positioning as string ||
                  ((comp as Record<string, unknown>).positioning as Record<string, unknown>)?.value_prop as string || '';
                const threatLevel = (comp as Record<string, unknown>).threat_level as string || '';
                const strengths = (comp as Record<string, unknown>).strengths as string[] || [];

                return (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-lavender/10 flex items-center justify-center text-sm font-bold text-lavender-foreground flex-shrink-0">
                      {name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground text-sm">{name}</span>
                        {threatLevel && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {threatLevel}
                          </Badge>
                        )}
                      </div>
                      {positioning_val && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{positioning_val}</p>
                      )}
                      {strengths.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {strengths.slice(0, 3).map((s, j) => (
                            <span key={j} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {competitors.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  + {competitors.length - 5} autres concurrents dans le rapport PDF
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Positioning */}
      {positioning && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-coral-foreground" />
              Positionnement Recommande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(positioning as Record<string, unknown>).recommended_positioning && (
              <div className="p-3 bg-coral/5 rounded-lg border border-coral/20">
                <p className="text-sm font-medium text-foreground">
                  {(positioning as Record<string, unknown>).recommended_positioning as string}
                </p>
              </div>
            )}
            {(positioning as Record<string, unknown>).value_proposition && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Proposition de valeur</p>
                <p className="text-sm text-foreground">{(positioning as Record<string, unknown>).value_proposition as string}</p>
              </div>
            )}
            {(positioning as Record<string, unknown>).tagline_suggestions && Array.isArray((positioning as Record<string, unknown>).tagline_suggestions) && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Taglines suggerees</p>
                <div className="flex flex-wrap gap-2">
                  {((positioning as Record<string, unknown>).tagline_suggestions as string[]).slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-xs px-2.5 py-1.5 bg-muted rounded-lg text-foreground italic">"{tag}"</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing Strategy */}
      {pricingStrategy && pricingStrategy.recommended_pricing && pricingStrategy.recommended_pricing.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-mint-foreground" />
              Strategie Tarifaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pricingStrategy.recommended_pricing.slice(0, 3).map((pkg, i) => (
                <div key={i} className="p-3 bg-muted/20 rounded-lg border border-border/50">
                  <p className="font-semibold text-sm text-foreground mb-1">{pkg.package_name}</p>
                  <p className="text-lg font-bold text-primary mb-2">{pkg.suggested_price}</p>
                  {pkg.what_includes && (
                    <ul className="space-y-1">
                      {pkg.what_includes.slice(0, 3).map((item, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle className="w-3 h-3 text-mint-foreground mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            {pricingStrategy.quick_wins && pricingStrategy.quick_wins.length > 0 && (
              <div className="mt-4 p-3 bg-mint/5 rounded-lg border border-mint/20">
                <p className="text-xs font-semibold text-mint-foreground mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Quick Wins
                </p>
                <ul className="space-y-1">
                  {pricingStrategy.quick_wins.slice(0, 3).map((win, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 text-mint-foreground mt-0.5 flex-shrink-0" />
                      {win}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Plan */}
      {actionPlan && (actionPlan.now_7_days?.length > 0 || actionPlan.days_8_30?.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-sky-foreground" />
              Plan d'Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              {actionPlan.now_7_days?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-foreground mb-2 px-2 py-1 bg-destructive/10 text-destructive rounded inline-block">J1 - J7</p>
                  <ul className="space-y-1.5">
                    {actionPlan.now_7_days.slice(0, 3).map((item, i) => (
                      <li key={i} className="text-xs text-foreground">{item.action}</li>
                    ))}
                  </ul>
                </div>
              )}
              {actionPlan.days_8_30?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-foreground mb-2 px-2 py-1 bg-chart-4/10 text-chart-4 rounded inline-block">J8 - J30</p>
                  <ul className="space-y-1.5">
                    {actionPlan.days_8_30.slice(0, 3).map((item, i) => (
                      <li key={i} className="text-xs text-foreground">{item.action}</li>
                    ))}
                  </ul>
                </div>
              )}
              {actionPlan.days_31_90?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-foreground mb-2 px-2 py-1 bg-mint/10 text-mint-foreground rounded inline-block">J31 - J90</p>
                  <ul className="space-y-1.5">
                    {actionPlan.days_31_90.slice(0, 3).map((item, i) => (
                      <li key={i} className="text-xs text-foreground">{item.action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SWOT (Agency) */}
      {swot && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
              Analyse SWOT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <SWOTQuadrant title="Forces" items={swot.strengths || []} color="bg-mint/10 border-mint/20 text-mint-foreground" />
              <SWOTQuadrant title="Faiblesses" items={swot.weaknesses || []} color="bg-destructive/10 border-destructive/20 text-destructive" />
              <SWOTQuadrant title="Opportunites" items={swot.opportunities || []} color="bg-sky/10 border-sky/20 text-sky-foreground" />
              <SWOTQuadrant title="Menaces" items={swot.threats || []} color="bg-chart-4/10 border-chart-4/20 text-chart-4" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risks (Agency) */}
      {risks && Array.isArray(risks) && risks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-chart-4" />
              Registre des Risques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {risks.slice(0, 4).map((risk, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 bg-muted/20 rounded-lg">
                  <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${
                    risk.impact === 'Eleve' ? 'border-destructive text-destructive' :
                    risk.impact === 'Moyen' ? 'border-chart-4 text-chart-4' : 'border-muted-foreground'
                  }`}>
                    {risk.impact}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{risk.risk}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{risk.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom CTA */}
      <div className="text-center py-6 border-t border-border">
        <p className="text-muted-foreground text-sm mb-3">
          Rapport complet avec toutes les sections detaillees
        </p>
        <Button
          size="lg"
          onClick={onDownload}
          disabled={!pdfUrl || isDownloading}
          className="gap-2"
        >
          {isDownloading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generation...</>
          ) : (
            <><Download className="w-4 h-4" /> Telecharger le PDF complet</>
          )}
        </Button>
      </div>
    </div>
  );
};

// Helper components
const KPICard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
  <Card className="bg-gradient-to-br from-background to-muted/30">
    <CardContent className="p-4">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </CardContent>
  </Card>
);

const SWOTQuadrant = ({ title, items, color }: { title: string; items: string[]; color: string }) => (
  <div className={`p-3 rounded-lg border ${color}`}>
    <p className="text-xs font-bold mb-2">{title}</p>
    <ul className="space-y-1">
      {items.slice(0, 3).map((item, i) => (
        <li key={i} className="text-xs text-foreground">{item}</li>
      ))}
    </ul>
  </div>
);
