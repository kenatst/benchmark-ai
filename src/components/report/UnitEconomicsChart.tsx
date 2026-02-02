import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip, ReferenceLine } from 'recharts';

interface UnitEconomicsChartProps {
    data: {
        customer_acquisition_cost: number;
        lifetime_value: number;
        ltv_cac_ratio: number;
        payback_period_months: number;
        gross_margin_percent: number;
        comparison_to_benchmarks?: string;
    };
}

export const UnitEconomicsChart = ({ data }: UnitEconomicsChartProps) => {
    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M€`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k€`;
        }
        return `${Math.round(value)}€`;
    };

    // LTV/CAC ratio visualization
    const getRatioColor = (ratio: number) => {
        if (ratio >= 3) return '#22c55e'; // Green - excellent
        if (ratio >= 2) return '#eab308'; // Yellow - good
        return '#ef4444'; // Red - needs improvement
    };

    const getRatioLabel = (ratio: number) => {
        if (ratio >= 3) return 'Excellent';
        if (ratio >= 2) return 'Bon';
        return 'À améliorer';
    };

    // Payback period color
    const getPaybackColor = (months: number) => {
        if (months <= 12) return '#22c55e';
        if (months <= 18) return '#eab308';
        return '#ef4444';
    };

    return (
        <div className="w-full space-y-6">
            {/* Main Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">CAC</p>
                    <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(data.customer_acquisition_cost)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Coût d'acquisition</p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">LTV</p>
                    <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(data.lifetime_value)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Valeur client</p>
                </div>

                <div
                    className="p-4 rounded-lg border-2"
                    style={{
                        borderColor: getRatioColor(data.ltv_cac_ratio),
                        backgroundColor: `${getRatioColor(data.ltv_cac_ratio)}10`
                    }}
                >
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">LTV/CAC</p>
                    <p
                        className="text-2xl font-bold"
                        style={{ color: getRatioColor(data.ltv_cac_ratio) }}
                    >
                        {data.ltv_cac_ratio.toFixed(1)}x
                    </p>
                    <p
                        className="text-xs font-medium mt-1"
                        style={{ color: getRatioColor(data.ltv_cac_ratio) }}
                    >
                        {getRatioLabel(data.ltv_cac_ratio)}
                    </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Payback</p>
                    <p
                        className="text-2xl font-bold"
                        style={{ color: getPaybackColor(data.payback_period_months) }}
                    >
                        {data.payback_period_months}
                        <span className="text-sm font-normal text-muted-foreground ml-1">mois</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Délai rentabilité</p>
                </div>
            </div>

            {/* LTV vs CAC Visual Bar */}
            <div className="p-6 bg-muted/20 rounded-lg border border-border">
                <h4 className="text-sm font-medium text-foreground mb-4">LTV vs CAC</h4>
                <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                    {/* CAC portion */}
                    <div
                        className="absolute left-0 top-0 h-full bg-foreground rounded-l-full flex items-center justify-center text-xs font-medium text-background"
                        style={{
                            width: `${Math.min(100 / (data.ltv_cac_ratio + 1), 50)}%`
                        }}
                    >
                        CAC
                    </div>
                    {/* LTV portion */}
                    <div
                        className="absolute right-0 top-0 h-full rounded-r-full flex items-center justify-center text-xs font-medium text-white"
                        style={{
                            width: `${Math.min((100 * data.ltv_cac_ratio) / (data.ltv_cac_ratio + 1), 100)}%`,
                            backgroundColor: getRatioColor(data.ltv_cac_ratio)
                        }}
                    >
                        LTV
                    </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{formatCurrency(data.customer_acquisition_cost)}</span>
                    <span>{formatCurrency(data.lifetime_value)}</span>
                </div>
            </div>

            {/* Gross Margin */}
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Marge brute</span>
                    <span className="text-lg font-bold text-foreground">{data.gross_margin_percent}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-foreground rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(data.gross_margin_percent, 100)}%` }}
                    />
                </div>
            </div>

            {/* Benchmark comparison */}
            {data.comparison_to_benchmarks && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <span className="font-medium">Comparaison marché: </span>
                        {data.comparison_to_benchmarks}
                    </p>
                </div>
            )}
        </div>
    );
};
