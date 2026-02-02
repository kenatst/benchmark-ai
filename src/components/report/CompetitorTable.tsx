import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  const getThreatBadge = (level?: string) => {
    if (!level) return null;
    const normalizedLevel = level.toLowerCase();

    if (normalizedLevel.includes('élevé') || normalizedLevel.includes('high')) {
      return <Badge variant="destructive" className="font-normal">{level}</Badge>;
    }
    if (normalizedLevel.includes('moyen') || normalizedLevel.includes('medium')) {
      return <Badge variant="secondary" className="font-normal bg-amber-100 text-amber-800 border-amber-200">{level}</Badge>;
    }
    return <Badge variant="secondary" className="font-normal">{level}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Intensité concurrentielle
          </p>
          <p className="font-semibold text-foreground">{intensity}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Votre position actuelle
          </p>
          <p className="font-semibold text-foreground">{currentPosition}</p>
        </div>
      </div>

      {/* Competitors Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Concurrent</TableHead>
              <TableHead className="font-semibold">Positionnement</TableHead>
              <TableHead className="font-semibold">Forces</TableHead>
              <TableHead className="font-semibold">Faiblesses</TableHead>
              <TableHead className="font-semibold">Prix</TableHead>
              <TableHead className="font-semibold text-right">Menace</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.map((comp, index) => (
              <TableRow
                key={comp.name}
                className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
              >
                <TableCell className="font-medium">{comp.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                  {comp.positioning || '—'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {comp.strengths?.slice(0, 2).map((s, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {comp.weaknesses?.slice(0, 2).map((w, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">
                        {w}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {comp.price_range || '—'}
                </TableCell>
                <TableCell className="text-right">
                  {getThreatBadge(comp.threat_level)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards (hidden on desktop, shown on mobile) */}
      <div className="lg:hidden space-y-3">
        {competitors.map((comp) => (
          <div
            key={comp.name}
            className="bg-card rounded-lg border border-border p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-foreground">{comp.name}</h4>
              {getThreatBadge(comp.threat_level)}
            </div>
            {comp.positioning && (
              <p className="text-sm text-muted-foreground mb-3">{comp.positioning}</p>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {comp.strengths && comp.strengths.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Forces</p>
                  <ul className="space-y-1">
                    {comp.strengths.slice(0, 2).map((s, i) => (
                      <li key={i} className="text-foreground">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {comp.weaknesses && comp.weaknesses.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Faiblesses</p>
                  <ul className="space-y-1">
                    {comp.weaknesses.slice(0, 2).map((w, i) => (
                      <li key={i} className="text-foreground">• {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
