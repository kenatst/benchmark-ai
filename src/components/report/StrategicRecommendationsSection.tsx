import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, MapPin, Calculator, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface PositioningOption {
  id: string;
  name: string;
  type: 'conservative' | 'balanced' | 'ambitious';
  description: string;
  differentiators: string[];
  target_ticket: string;
}

interface LocationRecommendation {
  priority: number;
  name: string;
  rationale: string[];
  estimated_rent?: string;
}

interface EconomicModel {
  indicator: string;
  target: string;
}

interface AttentionPoint {
  point: string;
  impact?: string;
}

interface StrategicRecommendationsData {
  positioning_options?: PositioningOption[];
  location_recommendations?: LocationRecommendation[];
  recommended_surface?: string;
  budget_rent?: string;
  economic_model?: EconomicModel[];
  attention_points?: AttentionPoint[];
}

interface StrategicRecommendationsSectionProps {
  data: StrategicRecommendationsData;
}

export const StrategicRecommendationsSection = ({ data }: StrategicRecommendationsSectionProps) => {
  const [expandedOption, setExpandedOption] = useState<string | null>(
    data.positioning_options?.[1]?.id || data.positioning_options?.[0]?.id || null
  );

  const getOptionStyle = (type: string) => {
    switch (type) {
      case 'conservative': return 'border-blue-500/30 bg-blue-500/5';
      case 'balanced': return 'border-green-500/30 bg-green-500/5 ring-2 ring-green-500/20';
      case 'ambitious': return 'border-purple-500/30 bg-purple-500/5';
      default: return 'border-border';
    }
  };

  const getOptionBadge = (type: string) => {
    switch (type) {
      case 'conservative': return <Badge variant="outline" className="border-blue-500 text-blue-600">Option A - Conservatrice</Badge>;
      case 'balanced': return <Badge className="bg-green-500 text-white">Option B - Équilibrée ⭐</Badge>;
      case 'ambitious': return <Badge variant="outline" className="border-purple-500 text-purple-600">Option C - Ambitieuse</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Positioning Options */}
      {data.positioning_options && data.positioning_options.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground text-lg">Positionnement recommandé</h4>
          </div>
          
          <div className="space-y-4">
            {data.positioning_options.map((option) => (
              <Card 
                key={option.id} 
                className={`cursor-pointer transition-all ${getOptionStyle(option.type)} ${
                  expandedOption === option.id ? 'shadow-lg' : ''
                }`}
                onClick={() => setExpandedOption(expandedOption === option.id ? null : option.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getOptionBadge(option.type)}
                        <span className="font-semibold text-foreground">{option.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Ticket moyen</p>
                        <p className="font-bold text-foreground">{option.target_ticket}</p>
                      </div>
                      {expandedOption === option.id ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {expandedOption === option.id && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-sm font-medium text-foreground mb-2">Différenciateurs clés:</p>
                      <ul className="space-y-1">
                        {option.differentiators.map((diff, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {diff}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Location Recommendations */}
      {data.location_recommendations && data.location_recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground text-lg">Emplacement recommandé</h4>
          </div>

          <div className="space-y-3">
            {data.location_recommendations.map((loc, i) => (
              <Card key={i} className={loc.priority === 1 ? 'border-primary/30 bg-primary/5' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      loc.priority === 1 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {loc.priority}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-foreground">{loc.name}</h5>
                        {loc.estimated_rent && (
                          <span className="text-sm text-muted-foreground">{loc.estimated_rent}</span>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {loc.rationale.map((reason, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(data.recommended_surface || data.budget_rent) && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {data.recommended_surface && (
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Surface recommandée</p>
                    <p className="font-bold text-foreground">{data.recommended_surface}</p>
                  </CardContent>
                </Card>
              )}
              {data.budget_rent && (
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Budget loyer cible</p>
                    <p className="font-bold text-foreground">{data.budget_rent}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Economic Model */}
      {data.economic_model && data.economic_model.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground text-lg">Modèle économique cible</h4>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Poste</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Objectif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.economic_model.map((item, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-3 px-4 text-foreground">{item.indicator}</td>
                        <td className="py-3 px-4 text-right font-medium text-foreground">{item.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attention Points */}
      {data.attention_points && data.attention_points.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h4 className="font-semibold text-foreground">Points d'attention</h4>
            </div>
            <ul className="space-y-2">
              {data.attention_points.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-500 font-bold">!</span>
                  <div>
                    <span className="text-foreground">{item.point}</span>
                    {item.impact && (
                      <span className="text-muted-foreground ml-1">({item.impact})</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
