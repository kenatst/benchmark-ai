import { CheckCircle2 } from 'lucide-react';

interface ActionItem {
  action: string;
  owner?: string;
  outcome: string;
}

interface ActionPlanGridProps {
  now_7_days?: ActionItem[];
  days_8_30?: ActionItem[];
  days_31_90?: ActionItem[];
}

export const ActionPlanGrid = ({ now_7_days, days_8_30, days_31_90 }: ActionPlanGridProps) => {
  const phases = [
    {
      title: 'Semaine 1',
      subtitle: 'Quick Wins',
      items: now_7_days || [],
    },
    {
      title: 'Jours 8-30',
      subtitle: 'Fondations',
      items: days_8_30 || [],
    },
    {
      title: 'Jours 31-90',
      subtitle: 'Croissance',
      items: days_31_90 || [],
    }
  ];

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-border hidden md:block" />

      <div className="space-y-8">
        {phases.map((phase, phaseIndex) => (
          <div key={phase.title} className="relative">
            {/* Timeline dot */}
            <div className="absolute left-2 md:left-2 top-1 w-5 h-5 rounded-full bg-foreground border-4 border-background hidden md:flex items-center justify-center z-10">
              <span className="text-[8px] text-background font-bold">
                {phaseIndex + 1}
              </span>
            </div>

            {/* Phase content */}
            <div className="md:ml-12">
              <div className="mb-4">
                <h4 className="font-bold text-foreground text-lg">
                  {phase.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {phase.subtitle}
                </p>
              </div>

              <div className="space-y-3">
                {phase.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border hover:border-foreground/20 transition-colors"
                  >
                    <div className="mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {item.action}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        → {item.outcome}
                      </p>
                    </div>
                  </div>
                ))}
                {phase.items.length === 0 && (
                  <p className="text-sm text-muted-foreground italic p-4 bg-muted/30 rounded-lg">
                    Aucune action définie pour cette période
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
