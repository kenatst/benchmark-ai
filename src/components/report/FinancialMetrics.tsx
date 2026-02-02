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
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const scenarioData = [
    {
      key: 'conservative',
      title: 'Conservatif',
      data: scenarios.conservative,
    },
    {
      key: 'baseline',
      title: 'Baseline',
      data: scenarios.baseline,
      highlight: true
    },
    {
      key: 'optimistic',
      title: 'Optimiste',
      data: scenarios.optimistic,
    },
  ];

  const metrics = [
    {
      label: 'Coût d\'acquisition',
      abbr: 'CAC',
      value: formatCurrency(unitEconomics.customer_acquisition_cost)
    },
    {
      label: 'Valeur vie client',
      abbr: 'LTV',
      value: formatCurrency(unitEconomics.lifetime_value)
    },
    {
      label: 'Ratio LTV/CAC',
      abbr: 'Ratio',
      value: `${unitEconomics.ltv_cac_ratio}x`
    },
    {
      label: 'Délai de récupération',
      abbr: 'Payback',
      value: `${unitEconomics.payback_period_months} mois`
    },
  ];

  return (
    <div className="space-y-8">
      {/* Revenue Scenarios */}
      <div>
        <h4 className="font-semibold text-foreground mb-4">Projections de revenus</h4>
        <div className="grid md:grid-cols-3 gap-4">
          {scenarioData.map((scenario) => (
            <div
              key={scenario.key}
              className={`
                rounded-lg border p-5 text-center
                ${scenario.highlight
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card border-border'
                }
              `}
            >
              <p className={`text-xs uppercase tracking-wider mb-3 ${scenario.highlight ? 'text-background/70' : 'text-muted-foreground'
                }`}>
                {scenario.title}
              </p>
              <p className={`text-3xl font-bold ${scenario.highlight ? 'text-background' : 'text-foreground'
                }`}>
                {formatCurrency(scenario.data.year_1)}
              </p>
              <p className={`text-xs mt-1 ${scenario.highlight ? 'text-background/60' : 'text-muted-foreground'
                }`}>
                Année 1
              </p>
              {scenario.data.year_2 && (
                <div className={`mt-3 pt-3 border-t ${scenario.highlight ? 'border-background/20' : 'border-border'
                  }`}>
                  <p className={`text-sm ${scenario.highlight ? 'text-background/80' : 'text-muted-foreground'
                    }`}>
                    A2: {formatCurrency(scenario.data.year_2)}
                    {scenario.data.year_3 && ` • A3: ${formatCurrency(scenario.data.year_3)}`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Unit Economics */}
      <div>
        <h4 className="font-semibold text-foreground mb-4">Unit Economics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.abbr}
              className="bg-muted/50 rounded-lg p-4 border border-border/50"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {metric.abbr}
              </p>
              <p className="text-xl font-bold text-foreground">
                {metric.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
