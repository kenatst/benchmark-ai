import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  FileText, 
  AlertCircle, 
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface GlossaryTerm {
  term: string;
  definition: string;
}

interface SourceCategory {
  category: string;
  sources: string[];
}

interface Assumption {
  assumption: string;
  validation_plan?: string;
}

interface Unknown {
  item: string;
  how_to_find?: string;
}

interface AppendicesData {
  glossary?: GlossaryTerm[];
  sources_by_category?: SourceCategory[];
  assumptions?: Assumption[];
  unknowns?: Unknown[];
  validation_plan?: string[];
}

interface AppendicesSectionProps {
  data: AppendicesData;
}

export const AppendicesSection = ({ data }: AppendicesSectionProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    glossary: false,
    sources: true,
    assumptions: false,
    unknowns: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-4">
      {/* Glossary */}
      {data.glossary && data.glossary.length > 0 && (
        <Collapsible open={openSections.glossary} onOpenChange={() => toggleSection('glossary')}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Glossaire</h4>
                    <Badge variant="secondary" className="text-xs">
                      {data.glossary.length} termes
                    </Badge>
                  </div>
                  {openSections.glossary ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="border-t border-border pt-4 space-y-3">
                  {data.glossary.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="font-medium text-primary min-w-[120px] flex-shrink-0">
                        {item.term}
                      </span>
                      <span className="text-sm text-muted-foreground">{item.definition}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Sources by Category */}
      {data.sources_by_category && data.sources_by_category.length > 0 && (
        <Collapsible open={openSections.sources} onOpenChange={() => toggleSection('sources')}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Sources et bibliographie</h4>
                    <Badge variant="secondary" className="text-xs">
                      {data.sources_by_category.reduce((acc, cat) => acc + cat.sources.length, 0)} sources
                    </Badge>
                  </div>
                  {openSections.sources ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="border-t border-border pt-4 space-y-4">
                  {data.sources_by_category.map((category, i) => (
                    <div key={i}>
                      <h5 className="font-medium text-foreground text-sm mb-2 flex items-center gap-2">
                        <ExternalLink className="w-3 h-3" />
                        {category.category}
                      </h5>
                      <ul className="space-y-1 ml-5">
                        {category.sources.map((source, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-muted-foreground/50">•</span>
                            {source}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Assumptions */}
      {data.assumptions && data.assumptions.length > 0 && (
        <Collapsible open={openSections.assumptions} onOpenChange={() => toggleSection('assumptions')}>
          <Card className="border-amber-500/30">
            <CollapsibleTrigger asChild>
              <CardContent className="p-4 cursor-pointer hover:bg-amber-500/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <h4 className="font-semibold text-foreground">Hypothèses (Assumptions Log)</h4>
                    <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                      {data.assumptions.length}
                    </Badge>
                  </div>
                  {openSections.assumptions ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="border-t border-amber-500/30 pt-4 space-y-3">
                  {data.assumptions.map((item, i) => (
                    <div key={i} className="p-3 bg-amber-500/5 rounded-lg">
                      <p className="text-sm text-foreground">{item.assumption}</p>
                      {item.validation_plan && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          → Validation: {item.validation_plan}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Unknowns */}
      {data.unknowns && data.unknowns.length > 0 && (
        <Collapsible open={openSections.unknowns} onOpenChange={() => toggleSection('unknowns')}>
          <Card className="border-purple-500/30">
            <CollapsibleTrigger asChild>
              <CardContent className="p-4 cursor-pointer hover:bg-purple-500/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-purple-500" />
                    <h4 className="font-semibold text-foreground">Ce que nous ne savons pas encore</h4>
                    <Badge variant="outline" className="text-xs border-purple-500 text-purple-600">
                      {data.unknowns.length}
                    </Badge>
                  </div>
                  {openSections.unknowns ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="border-t border-purple-500/30 pt-4 space-y-3">
                  {data.unknowns.map((item, i) => (
                    <div key={i} className="p-3 bg-purple-500/5 rounded-lg">
                      <p className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-purple-500">?</span>
                        {item.item}
                      </p>
                      {item.how_to_find && (
                        <p className="text-xs text-muted-foreground mt-1 italic ml-5">
                          → Comment trouver: {item.how_to_find}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {data.validation_plan && data.validation_plan.length > 0 && (
                  <div className="mt-4 p-4 bg-green-500/5 rounded-lg border border-green-500/30">
                    <h5 className="font-medium text-foreground text-sm mb-2">Plan pour réduire l'incertitude:</h5>
                    <ul className="space-y-1">
                      {data.validation_plan.map((plan, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500">✓</span>
                          {plan}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
};
