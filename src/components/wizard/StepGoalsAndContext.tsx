import { ReportInput } from '@/types/report';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BENCHMARK_GOALS } from '@/data/formOptions';
import { REPORT_LANGUAGES } from '@/i18n/LanguageContext';
import { Target, GripVertical, ArrowUp, ArrowDown, Clock, MessageSquare, FileText, Globe } from 'lucide-react';

interface StepGoalsAndContextProps {
  formData: ReportInput;
  setFormData: React.Dispatch<React.SetStateAction<ReportInput>>;
}

export const StepGoalsAndContext = ({ formData, setFormData }: StepGoalsAndContextProps) => {
  const updateData = (updates: Partial<ReportInput>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleGoal = (goalId: string) => {
    setFormData(prev => {
      const isSelected = prev.goals.includes(goalId);
      const newGoals = isSelected
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId];

      const newPriorities = isSelected
        ? (prev.goalPriorities || []).filter(g => g !== goalId)
        : [...(prev.goalPriorities || []), goalId];

      return {
        ...prev,
        goals: newGoals,
        goalPriorities: newPriorities
      };
    });
  };

  const moveGoal = (goalId: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const priorities = [...(prev.goalPriorities || prev.goals)];
      const index = priorities.indexOf(goalId);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= priorities.length) return prev;

      [priorities[index], priorities[newIndex]] = [priorities[newIndex], priorities[index]];

      return {
        ...prev,
        goalPriorities: priorities
      };
    });
  };

  const selectedGoals = formData.goalPriorities?.length
    ? formData.goalPriorities
    : formData.goals;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center pb-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Target className="w-4 h-4" />
          Objectifs & Contexte
        </div>
        <h2 className="text-2xl font-bold text-foreground">Que voulez-vous accomplir ?</h2>
        <p className="text-muted-foreground mt-2">Vos objectifs et votre contexte orientent l'analyse</p>
      </div>

      {/* ── Goals Section ── */}
      <div className="grid gap-6">
        {/* Goals Selection */}
        <div className="grid sm:grid-cols-2 gap-3">
          {BENCHMARK_GOALS.map((goal) => {
            const isSelected = formData.goals.includes(goal.id);
            const priorityIndex = selectedGoals.indexOf(goal.id);

            return (
              <Button
                key={goal.id}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => toggleGoal(goal.id)}
                className="h-auto py-4 px-4 flex items-start text-left justify-start relative"
              >
                {isSelected && priorityIndex !== -1 && (
                  <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                    {priorityIndex + 1}
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="font-semibold">{goal.label}</span>
                  <span className={`text-sm ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {goal.description}
                  </span>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Priority Ordering */}
        {formData.goals.length > 1 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-sm font-medium flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              Ordonnez par priorité (1 = plus important)
            </Label>
            <div className="space-y-2">
              {selectedGoals.map((goalId, index) => {
                const goal = BENCHMARK_GOALS.find(g => g.id === goalId);
                if (!goal) return null;

                return (
                  <div
                    key={goalId}
                    className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
                  >
                    <span className="w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="flex-1 font-medium text-foreground">
                      {goal.label}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveGoal(goalId, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveGoal(goalId, 'down')}
                        disabled={index === selectedGoals.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Success Metrics */}
        <div className="space-y-2 pt-4 border-t border-border">
          <Label htmlFor="successMetrics" className="text-sm font-medium">
            Quelles métriques définiraient le succès pour vous ?
            <span className="text-xs text-muted-foreground font-normal ml-2">(optionnel)</span>
          </Label>
          <Textarea
            id="successMetrics"
            placeholder="Ex: +30% de leads qualifiés, réduction du CAC de 20%, atteindre 100k€ MRR..."
            value={formData.successMetrics || ''}
            onChange={(e) => updateData({ successMetrics: e.target.value })}
            className="min-h-[80px] resize-none"
          />
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-4 text-sm text-muted-foreground font-medium">Contexte & préférences</span>
        </div>
      </div>

      {/* ── Context Section ── */}
      <div className="space-y-6">
        {/* Report Language */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            Langue du rapport *
          </Label>
          <Select
            value={formData.reportLanguage || 'fr'}
            onValueChange={(value) => updateData({ reportLanguage: value })}
          >
            <SelectTrigger className="h-12">
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

        {/* Budget + Timeline in a row */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Budget Level */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <span className="text-lg">💰</span>
              Budget marketing
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'low', label: 'Limité', desc: '< 1k€/mois' },
                { value: 'medium', label: 'Modéré', desc: '1-5k€/mois' },
                { value: 'high', label: 'Confortable', desc: '> 5k€/mois' }
              ].map((level) => (
                <Button
                  key={level.value}
                  type="button"
                  variant={formData.budgetLevel === level.value ? 'default' : 'outline'}
                  className="h-auto py-3 flex flex-col items-center"
                  onClick={() => updateData({ budgetLevel: level.value as ReportInput['budgetLevel'] })}
                >
                  <span className="font-medium text-xs">{level.label}</span>
                  <span className={`text-xs ${formData.budgetLevel === level.value ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {level.desc}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Quand agir ?
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'now', label: 'Urgent', desc: 'Cette sem.' },
                { value: '30days', label: 'Court terme', desc: '30 jours' },
                { value: '90days', label: 'Planifié', desc: '90 jours' }
              ].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={formData.timeline === option.value ? 'default' : 'outline'}
                  className="h-auto py-3 flex flex-col items-center"
                  onClick={() => updateData({ timeline: option.value as ReportInput['timeline'] })}
                >
                  <span className="font-medium text-xs">{option.label}</span>
                  <span className={`text-xs ${formData.timeline === option.value ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {option.desc}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Tone */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            Ton du rapport souhaité
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'professional', label: 'Professionnel', desc: 'Formel & structuré' },
              { value: 'bold', label: 'Percutant', desc: 'Direct & incisif' },
              { value: 'minimalist', label: 'Minimaliste', desc: 'Concis & essentiel' }
            ].map((tone) => (
              <Button
                key={tone.value}
                type="button"
                variant={formData.tonePreference === tone.value ? 'default' : 'outline'}
                className="h-auto py-3 flex flex-col items-center"
                onClick={() => updateData({ tonePreference: tone.value as ReportInput['tonePreference'] })}
              >
                <span className="font-medium">{tone.label}</span>
                <span className={`text-xs ${formData.tonePreference === tone.value ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {tone.desc}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-3">
          <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Notes additionnelles (optionnel)
          </Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => updateData({ notes: e.target.value })}
            placeholder="Défis spécifiques, contraintes, contexte particulier..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>
    </div>
  );
};
