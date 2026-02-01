import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ReportInput } from '@/types/report';
import { SECTORS, COUNTRIES } from '@/data/formOptions';

interface StepBasicsProps {
  data: ReportInput;
  updateData: (updates: Partial<ReportInput>) => void;
}

export const StepBasics = ({ data, updateData }: StepBasicsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Let's start with the basics</h2>
        <p className="text-muted-foreground">Tell us about your business</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={data.businessName}
            onChange={(e) => updateData({ businessName: e.target.value })}
            placeholder="Your Company Name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website (optional)</Label>
          <Input
            id="website"
            type="url"
            value={data.website}
            onChange={(e) => updateData({ website: e.target.value })}
            placeholder="https://yourcompany.com"
          />
        </div>

        <div className="space-y-2">
          <Label>Sector / Activity *</Label>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((sector) => (
              <Button
                key={sector}
                type="button"
                variant={data.sector === sector ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateData({ sector })}
              >
                {sector}
              </Button>
            ))}
          </div>
          {data.sector === 'Other' && (
            <div className="mt-3 space-y-2">
              <Label htmlFor="sectorDetails">Please describe your sector *</Label>
              <Textarea
                id="sectorDetails"
                value={data.sectorDetails || ''}
                onChange={(e) => updateData({ sectorDetails: e.target.value })}
                placeholder="Describe your industry, business model, and main activities in detail..."
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={data.location.city}
              onChange={(e) => updateData({ 
                location: { ...data.location, city: e.target.value } 
              })}
              placeholder="New York"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <select
              id="country"
              value={data.location.country}
              onChange={(e) => updateData({ 
                location: { ...data.location, country: e.target.value } 
              })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="">Select country</option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Target Customers *</Label>
          <div className="flex gap-2 mb-3">
            {(['B2B', 'B2C', 'Both'] as const).map((type) => (
              <Button
                key={type}
                type="button"
                variant={data.targetCustomers.type === type ? 'default' : 'outline'}
                onClick={() => updateData({ 
                  targetCustomers: { ...data.targetCustomers, type } 
                })}
              >
                {type}
              </Button>
            ))}
          </div>
          <Textarea
            value={data.targetCustomers.persona}
            onChange={(e) => updateData({ 
              targetCustomers: { ...data.targetCustomers, persona: e.target.value } 
            })}
            placeholder="Describe your ideal customer (e.g., small business owners, marketing managers, freelancers...)"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};
