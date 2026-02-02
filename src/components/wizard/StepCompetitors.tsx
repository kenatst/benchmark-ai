import { useState, useEffect } from 'react';
import { ReportInput } from '@/types/report';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { COMPETITOR_TYPES, SECTORS } from '@/data/formOptions';
import { Users, Plus, X, ExternalLink, AlertCircle, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StepCompetitorsProps {
  formData: ReportInput;
  setFormData: React.Dispatch<React.SetStateAction<ReportInput>>;
}

// Suggested competitors by sector
const SECTOR_COMPETITORS: Record<string, Array<{ name: string; type: 'direct' | 'indirect' | 'substitute' }>> = {
  'SaaS / Software': [
    { name: 'HubSpot', type: 'direct' },
    { name: 'Salesforce', type: 'direct' },
    { name: 'Monday.com', type: 'indirect' },
  ],
  'E-commerce': [
    { name: 'Amazon', type: 'direct' },
    { name: 'Shopify Stores', type: 'indirect' },
    { name: 'Local retailers', type: 'substitute' },
  ],
  'Agency / Consulting': [
    { name: 'McKinsey', type: 'direct' },
    { name: 'Freelancers', type: 'substitute' },
    { name: 'Big Four', type: 'indirect' },
  ],
  'Local Services': [
    { name: 'Artisans locaux', type: 'direct' },
    { name: 'Franchises nationales', type: 'indirect' },
    { name: 'DIY / Self-service', type: 'substitute' },
  ],
  'Healthcare': [
    { name: 'Doctolib', type: 'direct' },
    { name: 'Cliniques privées', type: 'indirect' },
    { name: 'Téléconsultation', type: 'substitute' },
  ],
  'Finance': [
    { name: 'Banques traditionnelles', type: 'direct' },
    { name: 'Néobanques', type: 'indirect' },
    { name: 'Crypto/DeFi', type: 'substitute' },
  ],
  'Education': [
    { name: 'Coursera', type: 'direct' },
    { name: 'Universités', type: 'indirect' },
    { name: 'YouTube Learning', type: 'substitute' },
  ],
  'Real Estate': [
    { name: 'SeLoger', type: 'direct' },
    { name: 'Agents indépendants', type: 'indirect' },
    { name: 'Vente directe', type: 'substitute' },
  ],
  'Manufacturing': [
    { name: 'Fabricants asiatiques', type: 'direct' },
    { name: 'Artisans locaux', type: 'indirect' },
    { name: 'Impression 3D', type: 'substitute' },
  ],
  'Food & Beverage': [
    { name: 'Restaurants locaux', type: 'direct' },
    { name: 'Dark kitchens', type: 'indirect' },
    { name: 'Meal kits', type: 'substitute' },
  ],
  'Travel & Hospitality': [
    { name: 'Booking.com', type: 'direct' },
    { name: 'Airbnb', type: 'indirect' },
    { name: 'Staycation', type: 'substitute' },
  ],
};

// Default competitors for unknown sectors
const DEFAULT_COMPETITORS = [
  { name: 'Leader du marché', type: 'direct' as const },
  { name: 'Nouvel entrant digital', type: 'indirect' as const },
  { name: 'Solution alternative', type: 'substitute' as const },
];

export const StepCompetitors = ({ formData, setFormData }: StepCompetitorsProps) => {
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [newCompetitorUrl, setNewCompetitorUrl] = useState('');
  const [newCompetitorType, setNewCompetitorType] = useState<'direct' | 'indirect' | 'substitute'>('direct');
  const [suggestionsShown, setSuggestionsShown] = useState(false);

  // Get suggested competitors based on sector
  const getSuggestedCompetitors = () => {
    const sector = formData.sector;
    return SECTOR_COMPETITORS[sector] || DEFAULT_COMPETITORS;
  };

  // Auto-populate suggestions when entering the step (only once)
  useEffect(() => {
    if (!suggestionsShown && formData.competitors.length === 0 && formData.sector) {
      const suggestions = getSuggestedCompetitors();
      setFormData(prev => ({
        ...prev,
        competitors: suggestions.map(s => ({
          name: s.name,
          type: s.type,
          url: undefined,
        })),
      }));
      setSuggestionsShown(true);
    }
  }, [formData.sector, suggestionsShown]);

  const addCompetitor = () => {
    if (!newCompetitorName.trim()) return;

    setFormData(prev => ({
      ...prev,
      competitors: [
        ...prev.competitors,
        {
          name: newCompetitorName.trim(),
          url: newCompetitorUrl.trim() || undefined,
          type: newCompetitorType
        }
      ]
    }));
    setNewCompetitorName('');
    setNewCompetitorUrl('');
    setNewCompetitorType('direct');
  };

  const removeCompetitor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index)
    }));
  };

  const getTypeLabel = (type?: string) => {
    const found = COMPETITOR_TYPES.find(t => t.id === type);
    return found?.label || 'Direct';
  };

  const getTypeBadgeColor = (type?: string) => {
    switch (type) {
      case 'indirect': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'substitute': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const suggestedCompetitors = getSuggestedCompetitors();
  const hasAllSuggestions = suggestedCompetitors.every(s => 
    formData.competitors.some(c => c.name === s.name)
  );

  const addSuggestedCompetitor = (suggestion: typeof suggestedCompetitors[0]) => {
    const alreadyExists = formData.competitors.some(c => c.name === suggestion.name);
    if (alreadyExists) return;

    setFormData(prev => ({
      ...prev,
      competitors: [
        ...prev.competitors,
        {
          name: suggestion.name,
          type: suggestion.type,
          url: undefined,
        }
      ]
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center pb-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Users className="w-4 h-4" />
          Concurrents
        </div>
        <h2 className="text-2xl font-bold text-foreground">Qui sont vos concurrents ?</h2>
        <p className="text-muted-foreground mt-2">
          Ajoutez les entreprises contre lesquelles vous êtes en compétition
          <span className="text-xs text-muted-foreground font-normal ml-2">(optionnel)</span>
        </p>
      </div>

      <div className="grid gap-6">
        {/* Suggestions banner - only show if not all suggestions are added */}
        {formData.sector && !hasAllSuggestions && (
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Suggestions basées sur votre secteur ({formData.sector})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedCompetitors.map((suggestion, idx) => {
                const alreadyAdded = formData.competitors.some(c => c.name === suggestion.name);
                return (
                  <Button
                    key={idx}
                    variant={alreadyAdded ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => addSuggestedCompetitor(suggestion)}
                    disabled={alreadyAdded}
                    className="gap-2"
                  >
                    {alreadyAdded ? '✓' : <Plus className="w-3 h-3" />}
                    {suggestion.name}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getTypeBadgeColor(suggestion.type)}`}>
                      {getTypeLabel(suggestion.type)}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Competitor Form */}
        <div className="bg-muted/30 rounded-lg p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nom du concurrent</Label>
              <Input
                placeholder="Ex: Acme Corp"
                value={newCompetitorName}
                onChange={(e) => setNewCompetitorName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Site web</Label>
              <Input
                placeholder="https://acme.com"
                value={newCompetitorUrl}
                onChange={(e) => setNewCompetitorUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
                className="h-11"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-medium">Type de concurrent</Label>
              <Select
                value={newCompetitorType}
                onValueChange={(value: 'direct' | 'indirect' | 'substitute') => setNewCompetitorType(value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPETITOR_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addCompetitor} className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>

        {/* Competitors List */}
        {formData.competitors.length > 0 ? (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Concurrents ajoutés ({formData.competitors.length})
            </Label>
            {formData.competitors.map((competitor, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-card rounded-lg border border-border group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground flex-shrink-0">
                    {competitor.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {competitor.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadgeColor(competitor.type)}`}>
                        {getTypeLabel(competitor.type)}
                      </span>
                    </div>
                    {competitor.url && (
                      <a
                        href={competitor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {competitor.url.replace(/https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCompetitor(index)}
                  className="opacity-50 hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Aucun concurrent ajouté</p>
            <p className="text-sm mt-1">Les concurrents seront recherchés automatiquement</p>
          </div>
        )}

        {/* Nudge */}
        {formData.competitors.length > 0 && formData.competitors.length < 3 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Ajoutez au moins 3 concurrents
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Un benchmark plus complet améliore la qualité des recommandations.
              </p>
            </div>
          </div>
        )}

        {/* Competitive Advantage */}
        <div className="space-y-2 pt-4 border-t border-border">
          <Label htmlFor="competitorAdvantage" className="text-sm font-medium">
            Pourquoi vos concurrents gagnent-ils parfois contre vous ?
            <span className="text-xs text-muted-foreground font-normal ml-2">(optionnel)</span>
          </Label>
          <Textarea
            id="competitorAdvantage"
            placeholder="Ex: Ils sont moins chers, ont plus de notoriété, une équipe commerciale plus grande..."
            value={formData.competitorAdvantage || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, competitorAdvantage: e.target.value }))}
            className="min-h-[80px] resize-none"
          />
        </div>
      </div>
    </div>
  );
};
