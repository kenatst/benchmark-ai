import { ReportInput } from '@/types/report';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SECTORS, COUNTRIES, BUSINESS_MATURITY, ANNUAL_REVENUE, TEAM_SIZE } from '@/data/formOptions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Globe, MapPin, Users, Rocket, TrendingUp, UsersRound } from 'lucide-react';

interface StepBasicsProps {
  formData: ReportInput;
  setFormData: React.Dispatch<React.SetStateAction<ReportInput>>;
}

export const StepBasics = ({ formData, setFormData }: StepBasicsProps) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center pb-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Building2 className="w-4 h-4" />
          Votre Business
        </div>
        <h2 className="text-2xl font-bold text-foreground">Parlez-nous de votre entreprise</h2>
        <p className="text-muted-foreground mt-2">Ces informations nous aident à personnaliser votre benchmark</p>
      </div>

      <div className="grid gap-6">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="businessName" className="text-sm font-medium">
            Nom de l'entreprise *
          </Label>
          <Input
            id="businessName"
            placeholder="Ex: Ma Super Startup"
            value={formData.businessName}
            onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
            className="h-12"
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website" className="text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            Site web
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://monsite.com"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            className="h-12"
          />
        </div>

        {/* Sector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Secteur d'activité *</Label>
          <Select
            value={formData.sector}
            onValueChange={(value) => setFormData(prev => ({ ...prev, sector: value }))}
          >
            <SelectTrigger className="h-12">
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
              className="mt-2 h-12"
            />
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            Localisation
          </Label>
          <div className="grid md:grid-cols-2 gap-3">
            <Input
              placeholder="Ville"
              value={formData.location.city}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, city: e.target.value }
              }))}
              className="h-12"
            />
            <Select
              value={formData.location.country}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, country: value }
              }))}
            >
              <SelectTrigger className="h-12">
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

        {/* Target Customers */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
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
                className="flex-1"
              >
                {type === 'Both' ? 'Les deux' : type}
              </Button>
            ))}
          </div>
          <Input
            placeholder="Décrivez votre client idéal (ex: PME tech, 10-50 employés)"
            value={formData.targetCustomers.persona}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              targetCustomers: { ...prev.targetCustomers, persona: e.target.value }
            }))}
            className="h-12"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-6 mt-2">
          <p className="text-sm font-medium text-muted-foreground mb-4">Contexte stratégique (optionnel mais recommandé)</p>
        </div>

        {/* Business Maturity */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Rocket className="w-4 h-4 text-muted-foreground" />
            Stade de maturité
          </Label>
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
                className="h-auto py-3 px-4 flex flex-col items-start text-left"
              >
                <span className="font-medium">{stage.label}</span>
                <span className={`text-xs ${formData.businessMaturity === stage.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {stage.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Annual Revenue */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            Chiffre d'affaires annuel
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ANNUAL_REVENUE.map((rev) => (
              <Button
                key={rev.id}
                type="button"
                variant={formData.annualRevenue === rev.id ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({
                  ...prev,
                  annualRevenue: rev.id as ReportInput['annualRevenue']
                }))}
                className="text-sm"
              >
                {rev.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Team Size */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <UsersRound className="w-4 h-4 text-muted-foreground" />
            Taille de l'équipe
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TEAM_SIZE.map((size) => (
              <Button
                key={size.id}
                type="button"
                variant={formData.teamSize === size.id ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({
                  ...prev,
                  teamSize: size.id as ReportInput['teamSize']
                }))}
                className="text-sm"
              >
                {size.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
