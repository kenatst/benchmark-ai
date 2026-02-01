import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ReportInput } from '@/types/report';
import { ACQUISITION_CHANNELS, DIFFERENTIATORS } from '@/data/formOptions';

interface StepOfferProps {
  data: ReportInput;
  updateData: (updates: Partial<ReportInput>) => void;
}

export const StepOffer = ({ data, updateData }: StepOfferProps) => {
  const toggleDifferentiator = (diff: string) => {
    const current = data.differentiators;
    const updated = current.includes(diff)
      ? current.filter(d => d !== diff)
      : [...current, diff];
    updateData({ differentiators: updated });
  };

  const toggleChannel = (channel: string) => {
    const current = data.acquisitionChannels;
    const updated = current.includes(channel)
      ? current.filter(c => c !== channel)
      : [...current, channel];
    updateData({ acquisitionChannels: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Your offer & pricing</h2>
        <p className="text-muted-foreground">Help us understand what you sell and how</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="whatYouSell">What do you sell? *</Label>
          <Textarea
            id="whatYouSell"
            value={data.whatYouSell}
            onChange={(e) => updateData({ whatYouSell: e.target.value })}
            placeholder="Describe your main products or services..."
            rows={4}
            required
          />
        </div>

        <div className="space-y-4">
          <Label>Your Price Range *</Label>
          <div className="px-2">
            <Slider
              value={[data.priceRange.min, data.priceRange.max]}
              onValueChange={([min, max]) => updateData({ priceRange: { min, max } })}
              max={10000}
              step={50}
              className="mb-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${data.priceRange.min}</span>
              <span>${data.priceRange.max}+</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Your Differentiators</Label>
          <p className="text-sm text-muted-foreground mb-3">What makes you stand out?</p>
          <div className="flex flex-wrap gap-2">
            {DIFFERENTIATORS.map((diff) => (
              <Button
                key={diff}
                type="button"
                variant={data.differentiators.includes(diff) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleDifferentiator(diff)}
              >
                {diff}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Current Acquisition Channels</Label>
          <p className="text-sm text-muted-foreground mb-3">How do customers find you?</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {ACQUISITION_CHANNELS.map((channel) => (
              <div key={channel} className="flex items-center space-x-2">
                <Checkbox
                  id={channel}
                  checked={data.acquisitionChannels.includes(channel)}
                  onCheckedChange={() => toggleChannel(channel)}
                />
                <label
                  htmlFor={channel}
                  className="text-sm text-foreground cursor-pointer"
                >
                  {channel}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
