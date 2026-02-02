import { useState } from 'react';
import { ReportInput } from '@/types/report';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { COMPETITOR_TYPES } from '@/data/formOptions';
import { Users, Plus, X, ExternalLink, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StepCompetitorsProps {
  formData: ReportInput;
  setFormData: React.Dispatch<React.SetStateAction<ReportInput>>;
}

export const StepCompetitors = ({ formData, setFormData }: StepCompetitorsProps) => {
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [newCompetitorUrl, setNewCompetitorUrl] = useState('');
  const [newCompetitorType, setNewCompetitorType] = useState<'direct' | 'indirect' | 'substitute'>('direct');

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
      case 'indirect': return 'bg-amber-100 text-amber-800';
      case 'substitute': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
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
        <p className="text-muted-foreground mt-2">Ajoutez les entreprises contre lesquelles vous êtes en compétition</p>
      </div>

      <div className="grid gap-6">
        {/* Add Competitor Form */}
        <div className="bg-muted/30 rounded-lg p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nom du concurrent *</Label>
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
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
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
