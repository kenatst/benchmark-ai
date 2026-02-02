import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, CheckCircle2, TrendingUp, Euro } from 'lucide-react';

interface RoadmapPhase {
  phase: string;
  timeline: string;
  title: string;
  tasks: string[];
  kpis?: string[];
}

interface KPITarget {
  indicator: string;
  target_m6: string;
  target_m12: string;
}

interface BudgetItem {
  category: string;
  amount: string;
}

interface DetailedRoadmapData {
  phases?: RoadmapPhase[];
  kpi_targets?: KPITarget[];
  budget_breakdown?: BudgetItem[];
  total_budget?: string;
  recommended_equity?: string;
}

interface DetailedRoadmapSectionProps {
  data: DetailedRoadmapData;
}

export const DetailedRoadmapSection = ({ data }: DetailedRoadmapSectionProps) => {
  const getPhaseColor = (phase: string) => {
    if (phase.includes('1') || phase.includes('30')) return 'border-blue-500 bg-blue-500/5';
    if (phase.includes('2') || phase.includes('60')) return 'border-amber-500 bg-amber-500/5';
    if (phase.includes('3') || phase.includes('90')) return 'border-green-500 bg-green-500/5';
    return 'border-primary bg-primary/5';
  };

  const getPhaseBadgeColor = (phase: string) => {
    if (phase.includes('1') || phase.includes('30')) return 'bg-blue-500';
    if (phase.includes('2') || phase.includes('60')) return 'bg-amber-500';
    if (phase.includes('3') || phase.includes('90')) return 'bg-green-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-8">
      {/* Phases Timeline */}
      {data.phases && data.phases.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground text-lg">Plan d'action détaillé</h4>
          </div>

          <div className="space-y-4">
            {data.phases.map((phase, i) => (
              <Card key={i} className={`border-l-4 ${getPhaseColor(phase.phase)}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge className={`${getPhaseBadgeColor(phase.phase)} text-white mb-2`}>
                        {phase.timeline}
                      </Badge>
                      <h5 className="font-semibold text-foreground text-lg">{phase.title}</h5>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {phase.tasks.map((task, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{task}</span>
                      </li>
                    ))}
                  </ul>

                  {phase.kpis && phase.kpis.length > 0 && (
                    <div className="pt-4 border-t border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        KPIs de validation
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {phase.kpis.map((kpi, k) => (
                          <Badge key={k} variant="outline" className="text-xs">
                            <Target className="w-3 h-3 mr-1" />
                            {kpi}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* KPI Targets Table */}
      {data.kpi_targets && data.kpi_targets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground text-lg">KPIs de suivi (Année 1)</h4>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Indicateur</th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground">Objectif M6</th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground">Objectif M12</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.kpi_targets.map((kpi, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-3 px-4 text-foreground">{kpi.indicator}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-3 py-1 bg-muted rounded-full text-foreground font-medium">
                            {kpi.target_m6}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                            {kpi.target_m12}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget Breakdown */}
      {data.budget_breakdown && data.budget_breakdown.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Euro className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground text-lg">Budget prévisionnel</h4>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {data.budget_breakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-foreground">{item.category}</span>
                    <span className="font-medium text-foreground">{item.amount}</span>
                  </div>
                ))}
              </div>

              {data.total_budget && (
                <div className="mt-4 pt-4 border-t-2 border-border flex items-center justify-between">
                  <span className="font-bold text-foreground text-lg">TOTAL</span>
                  <span className="font-bold text-primary text-xl">{data.total_budget}</span>
                </div>
              )}

              {data.recommended_equity && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Apport personnel recommandé:</span>{' '}
                    {data.recommended_equity}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
