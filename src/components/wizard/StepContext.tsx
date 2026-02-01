import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ReportInput } from '@/types/report';

interface StepContextProps {
  data: ReportInput;
  updateData: (updates: Partial<ReportInput>) => void;
}

export const StepContext = ({ data, updateData }: StepContextProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Constraints & context</h2>
        <p className="text-muted-foreground">Help us tailor recommendations to your situation</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Budget Level</Label>
          <p className="text-sm text-muted-foreground mb-3">
            What's your marketing/growth budget capacity?
          </p>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <Button
                key={level}
                type="button"
                variant={data.budgetLevel === level ? 'default' : 'outline'}
                className="flex-1 capitalize"
                onClick={() => updateData({ budgetLevel: level })}
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Timeline</Label>
          <p className="text-sm text-muted-foreground mb-3">
            When do you need to act on these insights?
          </p>
          <div className="flex gap-2">
            {[
              { value: 'now', label: 'Now' },
              { value: '30days', label: '30 Days' },
              { value: '90days', label: '90 Days' }
            ].map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={data.timeline === option.value ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => updateData({ timeline: option.value as ReportInput['timeline'] })}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Report Tone</Label>
          <p className="text-sm text-muted-foreground mb-3">
            How should the report be written?
          </p>
          <div className="flex gap-2">
            {(['professional', 'bold', 'minimalist'] as const).map((tone) => (
              <Button
                key={tone}
                type="button"
                variant={data.tonePreference === tone ? 'default' : 'outline'}
                className="flex-1 capitalize"
                onClick={() => updateData({ tonePreference: tone })}
              >
                {tone}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (optional)</Label>
          <Textarea
            id="notes"
            value={data.notes}
            onChange={(e) => updateData({ notes: e.target.value })}
            placeholder="Any specific challenges, constraints, or context we should know about..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};
