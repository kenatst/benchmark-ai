interface RevenueScenario {
  year_1: number;
  year_2?: number;
  year_3?: number;
}

interface UnitEconomics {
  customer_acquisition_cost: number;
  lifetime_value: number;
  ltv_cac_ratio: number;
  payback_period_months: number;
}

interface FinancialMetricsProps {
  scenarios: {
    conservative: RevenueScenario;
    baseline: RevenueScenario;
    optimistic: RevenueScenario;
  };
  unitEconomics: UnitEconomics;
}

export const FinancialMetrics = ({ scenarios, unitEconomics }: FinancialMetricsProps) => {
  const scenarioCards = [
    { 
      key: 'conservative', 
      title: 'Conservatif', 
      data: scenarios.conservative,
      bg: 'bg-muted/50',
      border: 'border-border'
    },
    { 
      key: 'baseline', 
      title: 'Baseline', 
      data: scenarios.baseline,
      bg: 'bg-primary/10',
      border: 'border-primary/30'
    },
    { 
      key: 'optimistic', 
      title: 'Optimiste', 
      data: scenarios.optimistic,
      bg: 'bg-mint/10',
      border: 'border-mint/30'
    },
  ];

  const metrics = [
    { label: 'CAC', value: `${unitEconomics.customer_acquisition_cost}€`, icon: '💰' },
    { label: 'LTV', value: `${unitEconomics.lifetime_value}€`, icon: '📊' },
    { label: 'LTV/CAC', value: `${unitEconomics.ltv_cac_ratio}x`, icon: '⚡' },
    { label: 'Payback', value: `${unitEconomics.payback_period_months} mois`, icon: '⏱️' },
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Scenarios */}
      <div className="grid md:grid-cols-3 gap-4">
        {scenarioCards.map((scenario, index) => (
          <div 
            key={scenario.key}
            className={`${scenario.bg} rounded-2xl p-5 border ${scenario.border} text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-up`}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{scenario.title} Y1</p>
            <p className="text-3xl font-black text-foreground">{scenario.data.year_1.toLocaleString()}€</p>
            {scenario.data.year_2 && (
              <p className="text-sm text-muted-foreground mt-2">Y2: {scenario.data.year_2.toLocaleString()}€</p>
            )}
          </div>
        ))}
      </div>

      {/* Unit Economics */}
      <div 
        className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-6 animate-fade-up"
        style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
      >
        <h5 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="text-xl">📈</span>
          Unit Economics
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div 
              key={metric.label}
              className="text-center bg-card/50 rounded-xl p-4 border border-border/50 transition-all duration-300 hover:bg-card/80 animate-fade-up"
              style={{ animationDelay: `${400 + (index * 50)}ms`, animationFillMode: 'forwards' }}
            >
              <span className="text-2xl mb-2 block">{metric.icon}</span>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{metric.label}</p>
              <p className="text-xl font-bold text-foreground">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
