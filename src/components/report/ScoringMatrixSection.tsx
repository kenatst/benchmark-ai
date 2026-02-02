import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

interface CompetitorScore {
  name: string;
  scores: Record<string, number>;
  total: number;
}

interface SensitivityResult {
  model: string;
  rankings: string[];
}

interface ScoringMatrixData {
  criteria: string[];
  competitors: CompetitorScore[];
  sensitivity_analysis?: SensitivityResult[];
  interpretation?: string;
}

interface ScoringMatrixSectionProps {
  data: ScoringMatrixData;
}

export const ScoringMatrixSection = ({ data }: ScoringMatrixSectionProps) => {
  const [highlightedCompetitor, setHighlightedCompetitor] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'bg-green-500 text-white';
    if (score >= 7) return 'bg-green-400/80 text-white';
    if (score >= 5) return 'bg-amber-400 text-amber-900';
    if (score >= 3) return 'bg-orange-400 text-white';
    return 'bg-red-400 text-white';
  };

  const getScoreBgLight = (score: number) => {
    if (score >= 9) return 'bg-green-500/10';
    if (score >= 7) return 'bg-green-400/10';
    if (score >= 5) return 'bg-amber-400/10';
    if (score >= 3) return 'bg-orange-400/10';
    return 'bg-red-400/10';
  };

  // Sort competitors by total score
  const sortedCompetitors = [...data.competitors].sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Main Scoring Matrix */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Matrice multi-critères (notation /10)</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground bg-muted/30 sticky left-0">
                    Critère
                  </th>
                  {sortedCompetitors.map((comp) => (
                    <th 
                      key={comp.name}
                      className={`text-center py-3 px-4 font-semibold cursor-pointer transition-colors ${
                        highlightedCompetitor === comp.name 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-foreground hover:bg-muted/30'
                      }`}
                      onClick={() => setHighlightedCompetitor(
                        highlightedCompetitor === comp.name ? null : comp.name
                      )}
                    >
                      {comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.criteria.map((criterion, i) => (
                  <tr key={criterion} className="border-b border-border/50">
                    <td className="py-3 px-4 text-foreground bg-muted/10 sticky left-0">
                      {criterion}
                    </td>
                    {sortedCompetitors.map((comp) => {
                      const score = comp.scores[criterion] || 0;
                      return (
                        <td 
                          key={comp.name}
                          className={`py-3 px-4 text-center ${
                            highlightedCompetitor === comp.name ? getScoreBgLight(score) : ''
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${getScoreColor(score)}`}>
                            {score}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Total row */}
                <tr className="bg-muted/30 font-bold">
                  <td className="py-4 px-4 text-foreground sticky left-0 bg-muted/30">
                    SCORE MOYEN
                  </td>
                  {sortedCompetitors.map((comp, i) => (
                    <td key={comp.name} className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-2 rounded-lg text-lg ${
                        i === 0 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-foreground'
                      }`}>
                        {comp.total.toFixed(1)}
                      </span>
                      {i === 0 && (
                        <span className="ml-2 text-xs text-primary">👑</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sensitivity Analysis */}
      {data.sensitivity_analysis && data.sensitivity_analysis.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-foreground">Analyse de sensibilité selon pondération</h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Modèle</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">1er</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">2ème</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">3ème</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sensitivity_analysis.map((result, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-3 px-4 font-medium text-foreground">{result.model}</td>
                      {result.rankings.slice(0, 3).map((rank, j) => (
                        <td key={j} className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                            j === 0 
                              ? 'bg-primary/10 text-primary font-medium' 
                              : 'text-muted-foreground'
                          }`}>
                            {rank}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interpretation */}
      {data.interpretation && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">Interprétation</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {data.interpretation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
