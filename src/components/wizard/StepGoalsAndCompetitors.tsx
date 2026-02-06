import { useState, useEffect } from 'react';
import { ReportInput } from '@/types/report';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BENCHMARK_GOALS, COMPETITOR_TYPES } from '@/data/formOptions';
import { REPORT_LANGUAGES } from '@/i18n/LanguageContext';
import { Target, Users, Plus, X, ExternalLink, Sparkles, Globe, Clock } from 'lucide-react';

interface StepGoalsAndCompetitorsProps {
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
    { name: 'Commerces locaux', type: 'substitute' },
  ],
  'Agency / Consulting': [
    { name: 'McKinsey', type: 'direct' },
    { name: 'Freelances', type: 'substitute' },
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

const DEFAULT_COMPETITORS = [
  { name: 'Leader du marché', type: 'direct' as const },
  { name: 'Nouvel entrant digital', type: 'indirect' as const },
  { name: 'Solution alternative', type: 'substitute' as const },
];

export const StepGoalsAndCompetitors = ({ formData, setFormData }: StepGoalsAndCompetitorsProps) => {
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [newCompetitorUrl, setNewCompetitorUrl] = useState('');
  const [newCompetitorType, setNewCompetitorType] = useState<'direct' | 'indirect' | 'substitute'>('direct');
  const [suggestionsShown, setSuggestionsShown] = useState(false);

  const updateData = (updates: Partial<ReportInput>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleGoal = (goalId: string) => {
    setFormData(prev => {
      const isSelected = prev.goals.includes(goalId);
      const newGoals = isSelected
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId];
      return { ...prev, goals: newGoals, goalPriorities: newGoals };
    });
  };

  // Competitors logic
  const getSuggestedCompetitors = () => {
    return SECTOR_COMPETITORS[formData.sector] || DEFAULT_COMPETITORS;
  };

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
  }, [formData.sector, suggestionsShown]); // eslint-disable-line react-hooks/exhaustive-deps

  const addCompetitor = () => {
    if (!newCompetitorName.trim()) return;
    setFormData(prev => ({
      ...prev,
      competitors: [
        ...prev.competitors,
        { name: newCompetitorName.trim(), url: newCompetitorUrl.trim() || undefined, type: newCompetitorType }
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
    if (formData.competitors.some(c => c.name === suggestion.name)) return;
    setFormData(prev => ({
      ...prev,
      competitors: [...prev.competitors, { name: suggestion.name, type: suggestion.type, url: undefined }]
    }));
  };

  return (
    <div className="space-y-10">
      {/* ────── SECTION 1: GOALS ────── */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-sky/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-sky-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Objectifs du benchmark <span className="text-destructive">*</span></h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {BENCHMARK_GOALS.map((goal) => {
            const isSelected = formData.goals.includes(goal.id);
            return (
              <Button
                key={goal.id}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => toggleGoal(goal.id)}
                className="h-auto py-3 px-4 flex items-start text-left justify-start"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{goal.label}</span>
                  <span className={`text-xs ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {goal.description}
                  </span>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Language + Timeline row */}
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              Langue du rapport
            </Label>
            <Select
              value={formData.reportLanguage || 'fr'}
              onValueChange={(value) => updateData({ reportLanguage: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Sélectionnez la langue" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              Quand agir ?
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'now', label: 'Urgent' },
                { value: '30days', label: '30 jours' },
                { value: '90days', label: '90 jours' }
              ].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={formData.timeline === option.value ? 'default' : 'outline'}
                  className="h-11 text-xs"
                  size="sm"
                  onClick={() => updateData({ timeline: option.value as ReportInput['timeline'] })}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ────── DIVIDER ────── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-4 text-sm text-muted-foreground font-medium">Concurrents</span>
        </div>
      </div>

      {/* ────── SECTION 2: COMPETITORS ────── */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-mint/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-mint-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Concurrents
            <span className="text-sm font-normal text-muted-foreground ml-2">(l'IA en trouvera d'autres)</span>
          </h3>
        </div>

        {/* Suggestions */}
        {formData.sector && !hasAllSuggestions && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                Suggestions pour {formData.sector}
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
                    className="gap-1 text-xs h-7"
                  >
                    {alreadyAdded ? '✓' : <Plus className="w-3 h-3" />}
                    {suggestion.name}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Competitor Form */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input
              placeholder="Nom du concurrent"
              value={newCompetitorName}
              onChange={(e) => setNewCompetitorName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
              className="h-10"
            />
            <Input
              placeholder="Site web (optionnel)"
              value={newCompetitorUrl}
              onChange={(e) => setNewCompetitorUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
              className="h-10"
            />
            <div className="flex gap-2">
              <Select
                value={newCompetitorType}
                onValueChange={(value: 'direct' | 'indirect' | 'substitute') => setNewCompetitorType(value)}
              >
                <SelectTrigger className="h-10 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPETITOR_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addCompetitor} size="sm" className="h-10 px-4">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Competitors List */}
        {formData.competitors.length > 0 && (
          <div className="space-y-2">
            {formData.competitors.map((competitor, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-card rounded-lg border border-border group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0">
                    {competitor.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm truncate">{competitor.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getTypeBadgeColor(competitor.type)}`}>
                        {getTypeLabel(competitor.type)}
                      </span>
                    </div>
                    {competitor.url && (
                      <a
                        href={competitor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
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
                  className="opacity-50 hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {formData.competitors.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            L'IA identifiera automatiquement vos principaux concurrents
          </p>
        )}

        {/* Notes */}
        <div className="space-y-2 pt-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Contexte supplémentaire <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
          </Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => updateData({ notes: e.target.value })}
            placeholder="Défis spécifiques, contraintes, contexte particulier..."
            rows={2}
            className="resize-none"
          />
        </div>
      </div>
    </div>
  );
};
