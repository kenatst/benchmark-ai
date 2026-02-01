import { Badge } from '@/components/ui/badge';

interface Competitor {
  name: string;
  positioning?: string;
  strengths?: string[];
  weaknesses?: string[];
  threat_level?: string;
  price_range?: string;
}

interface CompetitorTableProps {
  competitors: Competitor[];
  intensity: string;
  currentPosition: string;
}

export const CompetitorTable = ({ competitors, intensity, currentPosition }: CompetitorTableProps) => {
  const getThreatColor = (level?: string) => {
    if (!level) return 'bg-muted text-muted-foreground border-border';
    const normalizedLevel = level.toLowerCase();
    if (normalizedLevel.includes('élevé') || normalizedLevel.includes('high')) {
      return 'bg-destructive/10 text-destructive border-destructive/30';
    }
    if (normalizedLevel.includes('moyen') || normalizedLevel.includes('medium')) {
      return 'bg-gold/10 text-gold border-gold/30';
    }
    return 'bg-mint/10 text-mint-foreground border-mint/30';
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div 
          className="bg-coral/5 rounded-2xl p-4 border border-coral/20 animate-fade-up"
          style={{ animationFillMode: 'forwards' }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Intensité concurrentielle</p>
          <p className="text-lg font-bold text-coral-foreground">{intensity}</p>
        </div>
        <div 
          className="bg-sky/5 rounded-2xl p-4 border border-sky/20 animate-fade-up"
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Votre position</p>
          <p className="text-lg font-bold text-sky-foreground">{currentPosition}</p>
        </div>
      </div>

      {/* Competitor Cards */}
      <div className="space-y-3">
        {competitors.map((comp, index) => (
          <div 
            key={comp.name}
            className="bg-card rounded-2xl p-5 border border-border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fade-up"
            style={{ animationDelay: `${(index + 2) * 100}ms`, animationFillMode: 'forwards' }}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-bold text-lg text-foreground">{comp.name}</h4>
                  {comp.threat_level && (
                    <Badge 
                      variant="outline" 
                      className={getThreatColor(comp.threat_level)}
                    >
                      {comp.threat_level}
                    </Badge>
                  )}
                </div>
                {comp.positioning && (
                  <p className="text-muted-foreground text-sm mb-3">{comp.positioning}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm">
                  {comp.strengths && comp.strengths.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Forces</p>
                      <div className="flex flex-wrap gap-1">
                        {comp.strengths.slice(0, 3).map((s, i) => (
                          <span key={i} className="bg-mint/10 text-mint-foreground px-2 py-0.5 rounded-full text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {comp.weaknesses && comp.weaknesses.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Faiblesses</p>
                      <div className="flex flex-wrap gap-1">
                        {comp.weaknesses.slice(0, 2).map((w, i) => (
                          <span key={i} className="bg-coral/10 text-coral-foreground px-2 py-0.5 rounded-full text-xs">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {comp.price_range && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Prix</p>
                  <p className="font-semibold text-foreground">{comp.price_range}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
