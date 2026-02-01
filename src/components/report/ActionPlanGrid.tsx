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
  const columns = [
    {
      title: 'J1-7 : Quick Wins',
      emoji: '🚀',
      items: now_7_days || [],
      bg: 'bg-primary/5',
      border: 'border-primary/20',
      accent: 'text-primary'
    },
    {
      title: 'J8-30 : Fondations',
      emoji: '🔧',
      items: days_8_30 || [],
      bg: 'bg-sky/5',
      border: 'border-sky/20',
      accent: 'text-sky-foreground'
    },
    {
      title: 'J31-90 : Croissance',
      emoji: '📈',
      items: days_31_90 || [],
      bg: 'bg-mint/5',
      border: 'border-mint/20',
      accent: 'text-mint-foreground'
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {columns.map((column, colIndex) => (
        <div 
          key={column.title}
          className={`${column.bg} rounded-2xl p-5 border ${column.border} transition-all duration-300 hover:shadow-md animate-fade-up`}
          style={{ animationDelay: `${colIndex * 150}ms`, animationFillMode: 'forwards' }}
        >
          <h4 className={`font-bold ${column.accent} mb-5 flex items-center gap-2 text-lg`}>
            <span className="text-xl">{column.emoji}</span>
            {column.title}
          </h4>
          <ul className="space-y-4">
            {column.items.map((item, i) => (
              <li 
                key={i} 
                className="text-sm bg-card/50 rounded-xl p-3 border border-border/50 transition-all duration-200 hover:bg-card/80 animate-fade-up"
                style={{ animationDelay: `${(colIndex * 150) + (i * 50)}ms`, animationFillMode: 'forwards' }}
              >
                <p className="font-semibold text-foreground mb-1">{item.action}</p>
                <p className="text-muted-foreground text-xs flex items-center gap-1">
                  <span className={column.accent}>→</span> {item.outcome}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
