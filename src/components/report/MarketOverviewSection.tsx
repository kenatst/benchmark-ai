import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Building, Users, MapPin, Euro } from 'lucide-react';

interface MarketKeyMetric {
  indicator: string;
  value: string;
  source?: string;
}

interface MarketSegment {
  segment: string;
  price_avg: string;
  margin: string;
  examples: string;
}

interface MarketOverviewData {
  key_metrics?: MarketKeyMetric[];
  market_structure?: {
    overview: string;
    leaders?: { name: string; detail: string }[];
    independents_share?: string;
  };
  market_segments?: MarketSegment[];
  sources?: string;
}

interface MarketOverviewSectionProps {
  data: MarketOverviewData;
}

export const MarketOverviewSection = ({ data }: MarketOverviewSectionProps) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      {data.key_metrics && data.key_metrics.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Chiffres clés
          </h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.key_metrics.map((metric, i) => (
              <Card key={i} className="bg-card/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{metric.indicator}</p>
                  <p className="text-lg font-bold text-foreground">{metric.value}</p>
                  {metric.source && (
                    <p className="text-xs text-muted-foreground/70 mt-1">Source: {metric.source}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Market Structure */}
      {data.market_structure && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-foreground">Structure concurrentielle</h4>
            </div>
            <p className="text-foreground leading-relaxed mb-4">{data.market_structure.overview}</p>
            
            {data.market_structure.leaders && data.market_structure.leaders.length > 0 && (
              <div className="space-y-2 mb-4">
                {data.market_structure.leaders.map((leader, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-medium text-foreground">{leader.name}</span>
                      <span className="text-muted-foreground ml-2">{leader.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.market_structure.independents_share && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Indépendants:</span> {data.market_structure.independents_share}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Market Segmentation Table */}
      {data.market_segments && data.market_segments.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-foreground">Segmentation du marché</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Segment</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Prix moyen</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Marge brute</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Exemples</th>
                  </tr>
                </thead>
                <tbody>
                  {data.market_segments.map((segment, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{segment.segment}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-foreground">
                          <Euro className="w-3 h-3" />
                          {segment.price_avg}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{segment.margin}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{segment.examples}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      {data.sources && (
        <p className="text-xs text-muted-foreground italic">
          Sources: {data.sources}
        </p>
      )}
    </div>
  );
};
