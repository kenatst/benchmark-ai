import { ReportInput } from '@/types/report';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { DIFFERENTIATORS, ACQUISITION_CHANNELS, BUSINESS_MODELS, GROSS_MARGINS } from '@/data/formOptions';
import { Package, DollarSign, Sparkles, Target, Layers, TrendingUp } from 'lucide-react';

interface StepOfferProps {
  formData: ReportInput;
  setFormData: React.Dispatch<React.SetStateAction<ReportInput>>;
}

export const StepOffer = ({ formData, setFormData }: StepOfferProps) => {
  const toggleDifferentiator = (diff: string) => {
    setFormData(prev => ({
      ...prev,
      differentiators: prev.differentiators.includes(diff)
        ? prev.differentiators.filter(d => d !== diff)
        : [...prev.differentiators, diff]
    }));
  };

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      acquisitionChannels: prev.acquisitionChannels.includes(channel)
        ? prev.acquisitionChannels.filter(c => c !== channel)
        : [...prev.acquisitionChannels, channel]
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center pb-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Package className="w-4 h-4" />
          Votre Offre
        </div>
        <h2 className="text-2xl font-bold text-foreground">Décrivez ce que vous vendez</h2>
        <p className="text-muted-foreground mt-2">Plus vous êtes précis, meilleur sera le benchmark</p>
      </div>

      <div className="grid gap-6">
        {/* What you sell */}
        <div className="space-y-2">
          <Label htmlFor="whatYouSell" className="text-sm font-medium flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            Que vendez-vous ? *
          </Label>
          <Textarea
            id="whatYouSell"
            placeholder="Ex: Service de coaching business pour entrepreneurs SaaS - accompagnement stratégique et opérationnel sur 3 mois"
            value={formData.whatYouSell}
            onChange={(e) => setFormData(prev => ({ ...prev, whatYouSell: e.target.value }))}
            className="min-h-[100px] resize-none"
          />
        </div>

        {/* Unique Value Proposition */}
        <div className="space-y-2">
          <Label htmlFor="uvp" className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            Proposition de valeur unique (USP)
            <span className="text-xs text-muted-foreground font-normal">- En une phrase</span>
          </Label>
          <div className="relative">
            <Input
              id="uvp"
              placeholder="Ex: Le seul coaching qui garantit +50% de MRR en 90 jours ou remboursé"
              value={formData.uniqueValueProposition || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, uniqueValueProposition: e.target.value }))}
              className="h-12 pr-16"
              maxLength={150}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {(formData.uniqueValueProposition || '').length}/150
            </span>
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-4">
          <Label className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            Fourchette de prix
          </Label>
          <div className="bg-muted/30 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-bold text-foreground">
                {formData.priceRange.min}€
              </span>
              <span className="text-muted-foreground">à</span>
              <span className="text-2xl font-bold text-foreground">
                {formData.priceRange.max}€
              </span>
            </div>
            <Slider
              value={[formData.priceRange.min, formData.priceRange.max]}
              min={0}
              max={10000}
              step={50}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                priceRange: { min: value[0], max: value[1] }
              }))}
              className="mt-2"
            />
          </div>
        </div>

        {/* Business Model */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            Modèle économique
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {BUSINESS_MODELS.map((model) => (
              <Button
                key={model.id}
                type="button"
                variant={formData.businessModel === model.id ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({
                  ...prev,
                  businessModel: model.id as ReportInput['businessModel']
                }))}
                className="h-auto py-3 px-3 flex flex-col items-start text-left"
              >
                <span className="font-medium text-sm">{model.label}</span>
                <span className={`text-xs ${formData.businessModel === model.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {model.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Gross Margin */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            Marge brute estimée
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {GROSS_MARGINS.map((margin) => (
              <Button
                key={margin.id}
                type="button"
                variant={formData.grossMargin === margin.id ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({
                  ...prev,
                  grossMargin: margin.id as ReportInput['grossMargin']
                }))}
                className="h-auto py-3 px-3 flex flex-col items-start text-left"
              >
                <span className="font-medium">{margin.label}</span>
                <span className={`text-xs ${formData.grossMargin === margin.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {margin.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Differentiators */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            Vos points forts
            <span className="text-xs text-muted-foreground font-normal">- Sélectionnez jusqu'à 3</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {DIFFERENTIATORS.map((diff) => (
              <Button
                key={diff}
                type="button"
                variant={formData.differentiators.includes(diff) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleDifferentiator(diff)}
                disabled={formData.differentiators.length >= 3 && !formData.differentiators.includes(diff)}
              >
                {diff}
              </Button>
            ))}
          </div>
        </div>

        {/* Acquisition Channels */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Canaux d'acquisition actuels
          </Label>
          <div className="flex flex-wrap gap-2">
            {ACQUISITION_CHANNELS.map((channel) => (
              <Button
                key={channel}
                type="button"
                variant={formData.acquisitionChannels.includes(channel) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleChannel(channel)}
              >
                {channel}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
