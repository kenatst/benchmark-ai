import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReportInput } from '@/types/report';
import { Plus, X, AlertCircle } from 'lucide-react';

interface StepCompetitorsProps {
  data: ReportInput;
  updateData: (updates: Partial<ReportInput>) => void;
}

export const StepCompetitors = ({ data, updateData }: StepCompetitorsProps) => {
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const addCompetitor = () => {
    if (!newName.trim()) return;
    
    const competitor = {
      name: newName.trim(),
      url: newUrl.trim() || undefined
    };
    
    updateData({ competitors: [...data.competitors, competitor] });
    setNewName('');
    setNewUrl('');
  };

  const removeCompetitor = (index: number) => {
    const updated = data.competitors.filter((_, i) => i !== index);
    updateData({ competitors: updated });
  };

  const competitorCount = data.competitors.length;
  const showNudge = competitorCount > 0 && competitorCount < 3;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Your competitors</h2>
        <p className="text-muted-foreground">
          Add 3-10 competitors for the most accurate benchmark
        </p>
      </div>

      {/* Add competitor form */}
      <Card>
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium text-foreground">
                Competitor Name *
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Competitor Inc."
                onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium text-foreground">
                Website (optional)
              </label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://competitor.com"
                onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
              />
            </div>
            <Button onClick={addCompetitor} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Nudge message */}
      {showNudge && (
        <div className="flex items-start gap-2 p-4 bg-chart-4/10 rounded-lg border border-chart-4/20">
          <AlertCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            Add at least 3 competitors to get the most accurate benchmark. 
            You currently have {competitorCount}.
          </p>
        </div>
      )}

      {/* Competitors list */}
      {data.competitors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">
            Added competitors ({competitorCount})
          </h3>
          <div className="space-y-2">
            {data.competitors.map((competitor, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
              >
                <div>
                  <p className="font-medium text-foreground">{competitor.name}</p>
                  {competitor.url && (
                    <p className="text-sm text-muted-foreground">{competitor.url}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCompetitor(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.competitors.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No competitors added yet. You can skip this step, but your report will be more accurate with competitor data.
        </p>
      )}
    </div>
  );
};
