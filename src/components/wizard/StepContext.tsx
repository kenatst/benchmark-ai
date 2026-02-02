import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ReportInput } from '@/types/report';
import { Settings, Clock, MessageSquare, FileText, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REPORT_LANGUAGES } from '@/i18n/LanguageContext';

interface StepContextProps {
  formData: ReportInput;
  setFormData: React.Dispatch<React.SetStateAction<ReportInput>>;
}

export const StepContext = ({ formData, setFormData }: StepContextProps) => {
  const updateData = (updates: Partial<ReportInput>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center pb-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Settings className="w-4 h-4" />
          Contexte & Contraintes
        </div>
        <h2 className="text-2xl font-bold text-foreground">Précisez votre situation</h2>
        <p className="text-muted-foreground mt-2">Ces informations affinent nos recommandations</p>
      </div>

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

        {/* Budget Level */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <span className="text-lg">💰</span>
            Niveau de budget marketing/croissance
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
                <span className="font-medium">{level.label}</span>
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
            Quand avez-vous besoin d'agir ?
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'now', label: 'Urgent', desc: 'Cette semaine' },
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
                <span className="font-medium">{option.label}</span>
                <span className={`text-xs ${formData.timeline === option.value ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {option.desc}
                </span>
              </Button>
            ))}
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
            placeholder="Défis spécifiques, contraintes, contexte particulier à prendre en compte..."
            rows={4}
            className="resize-none"
          />
        </div>
      </div>
    </div>
  );
};
