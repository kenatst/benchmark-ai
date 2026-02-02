import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell } from 'recharts';

interface RevenueScenario {
    year_1: number;
    year_2: number;
    year_3: number;
    assumptions: string[];
}

interface RevenueProjectionChartProps {
    data: {
        conservative: RevenueScenario;
        baseline: RevenueScenario;
        optimistic: RevenueScenario;
    };
}

export const RevenueProjectionChart = ({ data }: RevenueProjectionChartProps) => {
    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M€`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}k€`;
        }
        return `${value}€`;
    };

    const chartData = [
        {
            name: 'A1',
            conservative: data.conservative.year_1,
            baseline: data.baseline.year_1,
            optimistic: data.optimistic.year_1
        },
        {
            name: 'A2',
            conservative: data.conservative.year_2,
            baseline: data.baseline.year_2,
            optimistic: data.optimistic.year_2
        },
        {
            name: 'A3',
            conservative: data.conservative.year_3,
            baseline: data.baseline.year_3,
            optimistic: data.optimistic.year_3
        },
    ];

    // Summary data for the cards
    const scenarios = [
        {
            key: 'conservative',
            label: 'Conservateur',
            color: '#6b7280',
            data: data.conservative,
            total: data.conservative.year_1 + data.conservative.year_2 + data.conservative.year_3
        },
        {
            key: 'baseline',
            label: 'Base',
            color: '#18181b',
            data: data.baseline,
            total: data.baseline.year_1 + data.baseline.year_2 + data.baseline.year_3
        },
        {
            key: 'optimistic',
            label: 'Optimiste',
            color: '#22c55e',
            data: data.optimistic,
            total: data.optimistic.year_1 + data.optimistic.year_2 + data.optimistic.year_3
        },
    ];

    return (
        <div className="w-full space-y-6">
            {/* Chart */}
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis
                            tickFormatter={formatCurrency}
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <Bar dataKey="conservative" fill="#6b7280" radius={[4, 4, 0, 0]} name="Conservateur" />
                        <Bar dataKey="baseline" fill="#18181b" radius={[4, 4, 0, 0]} name="Base" />
                        <Bar dataKey="optimistic" fill="#22c55e" radius={[4, 4, 0, 0]} name="Optimiste" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6">
                {scenarios.map(scenario => (
                    <div key={scenario.key} className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: scenario.color }}
                        ></span>
                        <span className="text-sm text-muted-foreground">{scenario.label}</span>
                    </div>
                ))}
            </div>

            {/* Scenario Cards */}
            <div className="grid md:grid-cols-3 gap-4">
                {scenarios.map(scenario => (
                    <div
                        key={scenario.key}
                        className={`p-4 rounded-lg border ${scenario.key === 'baseline'
                                ? 'border-foreground bg-foreground/5'
                                : 'border-border bg-muted/30'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: scenario.color }}
                            ></span>
                            <h4 className="font-semibold text-sm text-foreground">{scenario.label}</h4>
                        </div>

                        <p className="text-2xl font-bold text-foreground mb-3">
                            {formatCurrency(scenario.total)}
                            <span className="text-xs font-normal text-muted-foreground ml-1">sur 3 ans</span>
                        </p>

                        <div className="space-y-1 text-xs text-muted-foreground">
                            <p>A1: {formatCurrency(scenario.data.year_1)}</p>
                            <p>A2: {formatCurrency(scenario.data.year_2)}</p>
                            <p>A3: {formatCurrency(scenario.data.year_3)}</p>
                        </div>

                        {scenario.data.assumptions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs font-medium text-foreground mb-1">Hypothèses:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    {scenario.data.assumptions.slice(0, 2).map((assumption, i) => (
                                        <li key={i} className="leading-tight">• {assumption}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
