import { ReportInput } from '@/types/report';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { SECTORS, COUNTRIES, BUSINESS_MATURITY, BUSINESS_MODELS } from '@/data/formOptions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Globe, MapPin, Users, Package, DollarSign, Sparkles, Layers } from 'lucide-react';

interface StepBusinessAndOfferProps {
  formData: ReportInput;
  setFormData: React.Dispatch<React.SetStateAction<ReportInput>>;
}

export const StepBusinessAndOffer = ({ formData, setFormData }: StepBusinessAndOfferProps) => {
  return (
    <div className="space-y-10">
      {/* ────── SECTION 1: YOUR BUSINESS ────── */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-lavender/20 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-lavender-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Votre entreprise</h3>
        </div>

        <div className="grid gap-5">
          {/* Business Name + Sector (side by side) */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-sm font-medium">
                Nom de l'entreprise <span className="text-destructive">*</span>
              </Label>
              <Input
                id="businessName"
                placeholder="Ex: Ma Super Startup"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Secteur d'activité <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.sector}
                onValueChange={(value) => setFormData(prev => ({ ...prev, sector: value }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Sélectionnez un secteur" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.sector === 'Other' && (
                <Input
                  placeholder="Précisez votre secteur"
                  value={formData.sectorDetails}
                  onChange={(e) => setFormData(prev => ({ ...prev, sectorDetails: e.target.value }))}
                  className="mt-2 h-11"
                />
              )}
            </div>
          </div>

          {/* Website + Location */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Site web <span className="text-muted-foreground text-xs">(optionnel)</span>
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://monsite.com"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                Localisation
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Ville"
                  value={formData.location.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, city: e.target.value }
                  }))}
                  className="h-11"
                />
                <Select
                  value={formData.location.country}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, country: value }
                  }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Target Customers + Maturity */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                Type de clients
              </Label>
              <div className="flex gap-2">
                {['B2B', 'B2C', 'Both'].map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={formData.targetCustomers.type === type ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      targetCustomers: { ...prev.targetCustomers, type: type as 'B2B' | 'B2C' | 'Both' }
                    }))}
                    className="flex-1 h-11"
                    size="sm"
                  >
                    {type === 'Both' ? 'Les deux' : type}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Stade de maturité</Label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_MATURITY.map((stage) => (
                  <Button
                    key={stage.id}
                    type="button"
                    variant={formData.businessMaturity === stage.id ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      businessMaturity: stage.id as ReportInput['businessMaturity']
                    }))}
                    className="h-auto py-2 px-3 text-left text-xs"
                    size="sm"
                  >
                    {stage.label}
                  </Button>
                ))}
              </div>
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
          <span className="bg-card px-4 text-sm text-muted-foreground font-medium">Votre offre</span>
        </div>
      </div>

      {/* ────── SECTION 2: YOUR OFFER ────── */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-coral/20 flex items-center justify-center">
            <Package className="w-4 h-4 text-coral-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Votre offre</h3>
        </div>

        <div className="grid gap-5">
          {/* What you sell */}
          <div className="space-y-2">
            <Label htmlFor="whatYouSell" className="text-sm font-medium">
              Que vendez-vous ? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="whatYouSell"
              placeholder="Ex: Service de coaching business pour entrepreneurs SaaS - accompagnement stratégique et opérationnel sur 3 mois"
              value={formData.whatYouSell}
              onChange={(e) => setFormData(prev => ({ ...prev, whatYouSell: e.target.value }))}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* USP */}
          <div className="space-y-2">
            <Label htmlFor="uvp" className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
              Proposition de valeur unique
              <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
            </Label>
            <Input
              id="uvp"
              placeholder="Ex: Le seul coaching qui garantit +50% de MRR en 90 jours"
              value={formData.uniqueValueProposition || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, uniqueValueProposition: e.target.value }))}
              className="h-11"
              maxLength={150}
            />
          </div>

          {/* Price Range + Business Model */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                Fourchette de prix
              </Label>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-foreground">{formData.priceRange.min}€</span>
                  <span className="text-muted-foreground text-sm">à</span>
                  <span className="text-lg font-bold text-foreground">{formData.priceRange.max}€</span>
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
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                Modèle économique
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_MODELS.map((model) => (
                  <Button
                    key={model.id}
                    type="button"
                    variant={formData.businessModel === model.id ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      businessModel: model.id as ReportInput['businessModel']
                    }))}
                    className="h-auto py-2 px-3 text-xs text-left"
                    size="sm"
                  >
                    {model.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
