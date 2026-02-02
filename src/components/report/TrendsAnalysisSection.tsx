import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Truck, Users, Eye, TrendingUp } from 'lucide-react';

interface TrendCategory {
  category: string;
  icon: 'product' | 'service' | 'consumer' | 'watch';
  trends: string[];
}

interface TrendsAnalysisData {
  period?: string;
  categories?: TrendCategory[];
  key_insights?: string[];
}

interface TrendsAnalysisSectionProps {
  data: TrendsAnalysisData;
}

export const TrendsAnalysisSection = ({ data }: TrendsAnalysisSectionProps) => {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'product': return <Sparkles className="w-5 h-5" />;
      case 'service': return <Truck className="w-5 h-5" />;
      case 'consumer': return <Users className="w-5 h-5" />;
      case 'watch': return <Eye className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (iconType: string) => {
    switch (iconType) {
      case 'product': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'service': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'consumer': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30';
      case 'watch': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default: return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Period badge */}
      {data.period && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <TrendingUp className="w-3 h-3 mr-1" />
            {data.period}
          </Badge>
        </div>
      )}

      {/* Trend Categories */}
      {data.categories && data.categories.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {data.categories.map((category, i) => (
            <Card key={i} className={`border ${getCategoryColor(category.icon)}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(category.icon)}`}>
                    {getIcon(category.icon)}
                  </div>
                  <h4 className="font-semibold text-foreground">{category.category}</h4>
                </div>
                <ul className="space-y-2">
                  {category.trends.map((trend, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0" />
                      <span className="text-foreground leading-relaxed">{trend}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Key Insights */}
      {data.key_insights && data.key_insights.length > 0 && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Points clés à retenir
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.key_insights.map((insight, i) => (
                <div key={i} className="p-3 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-sm text-foreground">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
