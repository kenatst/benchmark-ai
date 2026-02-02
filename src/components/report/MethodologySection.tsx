import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, AlertTriangle, Target, Scale, FileText } from 'lucide-react';

interface MethodologyData {
  scope?: string;
  period?: string;
  segments_analyzed?: string[];
  primary_sources?: string[];
  secondary_sources?: string[];
  evaluation_criteria?: {
    dimension: string;
    weight_conservative?: string;
    weight_balanced?: string;
    weight_performance?: string;
  }[];
  limitations?: string[];
}

interface MethodologySectionProps {
  data: MethodologyData;
}

export const MethodologySection = ({ data }: MethodologySectionProps) => {
  return (
    <div className="space-y-6">
      {/* Scope */}
      {data.scope && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Périmètre de l'étude</h4>
                <p className="text-sm text-muted-foreground">Zone et période d'analyse</p>
              </div>
            </div>
            <p className="text-foreground leading-relaxed">{data.scope}</p>
            {data.period && (
              <p className="mt-2 text-sm text-muted-foreground">Période: {data.period}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Segments analyzed */}
      {data.segments_analyzed && data.segments_analyzed.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold text-foreground mb-3">Segments analysés</h4>
            <div className="flex flex-wrap gap-2">
              {data.segments_analyzed.map((segment, i) => (
                <Badge key={i} variant="secondary">{segment}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Primary sources */}
        {data.primary_sources && data.primary_sources.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-foreground">Sources primaires/officielles</h4>
              </div>
              <ul className="space-y-2">
                {data.primary_sources.map((source, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-primary">
                      {i + 1}
                    </span>
                    {source}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Secondary sources */}
        {data.secondary_sources && data.secondary_sources.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-semibold text-foreground">Sources secondaires</h4>
              </div>
              <ul className="space-y-2">
                {data.secondary_sources.map((source, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-medium">
                      {i + 1}
                    </span>
                    {source}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Evaluation grid */}
      {data.evaluation_criteria && data.evaluation_criteria.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-foreground">Grille d'évaluation</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Dimension</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Conservateur</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Équilibré</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.evaluation_criteria.map((criterion, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-3 px-4 text-foreground">{criterion.dimension}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{criterion.weight_conservative}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{criterion.weight_balanced}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{criterion.weight_performance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Limitations */}
      {data.limitations && data.limitations.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h4 className="font-semibold text-foreground">Limites et biais identifiés</h4>
            </div>
            <ul className="space-y-2">
              {data.limitations.map((limitation, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  {limitation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
