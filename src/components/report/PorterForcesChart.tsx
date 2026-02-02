import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';

interface PorterForcesChartProps {
    data: {
        competitive_rivalry: { score: number; analysis: string };
        supplier_power: { score: number; analysis: string };
        buyer_power: { score: number; analysis: string };
        threat_of_substitution: { score: number; analysis: string };
        threat_of_new_entry: { score: number; analysis: string };
    };
}

export const PorterForcesChart = ({ data }: PorterForcesChartProps) => {
    const chartData = [
        {
            subject: 'Rivalité concurrentielle',
            score: data.competitive_rivalry.score,
            fullMark: 10
        },
        {
            subject: 'Pouvoir fournisseurs',
            score: data.supplier_power.score,
            fullMark: 10
        },
        {
            subject: 'Pouvoir clients',
            score: data.buyer_power.score,
            fullMark: 10
        },
        {
            subject: 'Menace substituts',
            score: data.threat_of_substitution.score,
            fullMark: 10
        },
        {
            subject: 'Menace nouveaux entrants',
            score: data.threat_of_new_entry.score,
            fullMark: 10
        },
    ];

    return (
        <div className="w-full">
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            tickLine={false}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 10]}
                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                            tickCount={6}
                        />
                        <Radar
                            name="Score"
                            dataKey="score"
                            stroke="#18181b"
                            fill="#18181b"
                            fillOpacity={0.2}
                            strokeWidth={2}
                        />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Analysis details */}
            <div className="mt-6 space-y-3">
                {[
                    { label: 'Rivalité concurrentielle', value: data.competitive_rivalry },
                    { label: 'Pouvoir fournisseurs', value: data.supplier_power },
                    { label: 'Pouvoir clients', value: data.buyer_power },
                    { label: 'Menace substituts', value: data.threat_of_substitution },
                    { label: 'Menace nouveaux entrants', value: data.threat_of_new_entry },
                ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <span className="w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold flex items-center justify-center flex-shrink-0">
                            {item.value.score}
                        </span>
                        <div>
                            <p className="font-medium text-foreground text-sm">{item.label}</p>
                            <p className="text-sm text-muted-foreground">{item.value.analysis}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
