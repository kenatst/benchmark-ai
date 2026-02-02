import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Building2, Home, TrendingUp, Star } from 'lucide-react';

interface DemographicData {
  indicator: string;
  value: string;
}

interface RealEstateData {
  indicator: string;
  value: string;
}

interface CommercialHub {
  name: string;
  description: string;
  priority?: 'high' | 'medium' | 'low';
}

interface LocalCompetitor {
  name: string;
  rating?: string;
  specialty?: string;
}

interface TerritoryAnalysisData {
  location_name: string;
  demographics?: DemographicData[];
  real_estate?: RealEstateData[];
  commercial_hubs?: CommercialHub[];
  local_competitors?: LocalCompetitor[];
  opportunities?: string[];
  sources?: string;
}

interface TerritoryAnalysisSectionProps {
  data: TerritoryAnalysisData;
}

export const TerritoryAnalysisSection = ({ data }: TerritoryAnalysisSectionProps) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400';
      case 'medium': return 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400';
      case 'low': return 'bg-muted border-border text-muted-foreground';
      default: return 'bg-card border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{data.location_name}</h3>
          <p className="text-sm text-muted-foreground">Analyse territoriale micro-locale</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Demographics */}
        {data.demographics && data.demographics.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-foreground">Données démographiques</h4>
              </div>
              <div className="space-y-3">
                {data.demographics.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.indicator}</span>
                    <span className="font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real Estate */}
        {data.real_estate && data.real_estate.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Home className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-foreground">Immobilier commercial</h4>
              </div>
              <div className="space-y-3">
                {data.real_estate.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.indicator}</span>
                    <span className="font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Commercial Hubs */}
      {data.commercial_hubs && data.commercial_hubs.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-foreground">Pôles commerciaux identifiés</h4>
            </div>
            <div className="space-y-3">
              {data.commercial_hubs.map((hub, i) => (
                <div 
                  key={i} 
                  className={`p-4 rounded-lg border ${getPriorityColor(hub.priority)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{hub.name}</span>
                    {hub.priority === 'high' && (
                      <Badge variant="default" className="bg-green-500 text-white">Priorité 1</Badge>
                    )}
                    {hub.priority === 'medium' && (
                      <Badge variant="secondary">Priorité 2</Badge>
                    )}
                  </div>
                  <p className="text-sm opacity-80">{hub.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Local Competitors */}
      {data.local_competitors && data.local_competitors.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-foreground">Concurrence locale identifiée</h4>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.local_competitors.map((competitor, i) => (
                <div key={i} className="p-3 bg-muted/30 rounded-lg flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{competitor.name}</p>
                    {competitor.specialty && (
                      <p className="text-xs text-muted-foreground">{competitor.specialty}</p>
                    )}
                  </div>
                  {competitor.rating && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-medium">{competitor.rating}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opportunities */}
      {data.opportunities && data.opportunities.length > 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-6">
            <h4 className="font-semibold text-foreground mb-3">Opportunités identifiées</h4>
            <ul className="space-y-2">
              {data.opportunities.map((opp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 font-bold">+</span>
                  <span className="text-foreground">{opp}</span>
                </li>
              ))}
            </ul>
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
