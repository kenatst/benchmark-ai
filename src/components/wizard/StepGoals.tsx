import { Card, CardContent } from '@/components/ui/card';
import { ReportInput } from '@/types/report';
import { BENCHMARK_GOALS } from '@/data/formOptions';
import { Check } from 'lucide-react';

interface StepGoalsProps {
  data: ReportInput;
  updateData: (updates: Partial<ReportInput>) => void;
}

export const StepGoals = ({ data, updateData }: StepGoalsProps) => {
  const toggleGoal = (goalId: string) => {
    const current = data.goals;
    const updated = current.includes(goalId)
      ? current.filter(g => g !== goalId)
      : [...current, goalId];
    updateData({ goals: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Your benchmark goals</h2>
        <p className="text-muted-foreground">What do you want to learn from this report?</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {BENCHMARK_GOALS.map((goal) => {
          const isSelected = data.goals.includes(goal.id);
          return (
            <Card
              key={goal.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:border-primary/30'
              }`}
              onClick={() => toggleGoal(goal.id)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isSelected 
                    ? 'bg-primary border-primary' 
                    : 'border-border'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{goal.label}</h3>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Select all that apply. The more goals you select, the more comprehensive your report.
      </p>
    </div>
  );
};
