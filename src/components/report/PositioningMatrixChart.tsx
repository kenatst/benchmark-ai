import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts';

interface PositioningData {
    name: string;
    x: number;
    y: number;
    isUser?: boolean;
    isRecommended?: boolean;
}

interface PositioningMatrixChartProps {
    data: {
        x_axis: string;
        y_axis: string;
        competitors_plotted?: Array<{ name: string; x: number; y: number }>;
        positions?: Array<{ competitor: string; x: number; y: number }>;
        your_current_position?: { x: number; y: number };
        recommended_position?: { x: number; y: number };
    };
    businessName?: string;
}

export const PositioningMatrixChart = ({ data, businessName = 'Vous' }: PositioningMatrixChartProps) => {
    // Combine all positions into a single array
    const chartData: PositioningData[] = [];

    // Add competitors
    const competitors = data.competitors_plotted || data.positions || [];
    competitors.forEach(comp => {
        chartData.push({
            name: 'name' in comp ? comp.name : comp.competitor,
            x: comp.x,
            y: comp.y
        });
    });

    // Add user's current position
    if (data.your_current_position) {
        chartData.push({
            name: businessName,
            x: data.your_current_position.x,
            y: data.your_current_position.y,
            isUser: true
        });
    }

    // Separate recommended position for a different color
    const recommendedData: PositioningData[] = [];
    if (data.recommended_position) {
        recommendedData.push({
            name: `${businessName} (cible)`,
            x: data.recommended_position.x,
            y: data.recommended_position.y,
            isRecommended: true
        });
    }

    // Separate user data for different styling
    const userData = chartData.filter(d => d.isUser);
    const competitorData = chartData.filter(d => !d.isUser);

    return (
        <div className="w-full">
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            domain={[0, 10]}
                            name={data.x_axis || 'Prix'}
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            label={{
                                value: data.x_axis || 'Prix',
                                position: 'bottom',
                                fill: '#374151',
                                fontSize: 12,
                                fontWeight: 500
                            }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            domain={[0, 10]}
                            name={data.y_axis || 'Qualité Perçue'}
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            label={{
                                value: data.y_axis || 'Qualité Perçue',
                                angle: -90,
                                position: 'insideLeft',
                                fill: '#374151',
                                fontSize: 12,
                                fontWeight: 500
                            }}
                        />

                        {/* Reference lines at center */}
                        <ReferenceLine x={5} stroke="#d1d5db" strokeDasharray="5 5" />
                        <ReferenceLine y={5} stroke="#d1d5db" strokeDasharray="5 5" />

                        {/* Competitors */}
                        <Scatter
                            name="Concurrents"
                            data={competitorData}
                            fill="#6b7280"
                            shape="circle"
                        >
                            <LabelList
                                dataKey="name"
                                position="top"
                                offset={8}
                                style={{ fill: '#374151', fontSize: 11, fontWeight: 500 }}
                            />
                        </Scatter>

                        {/* User's current position */}
                        <Scatter
                            name={businessName}
                            data={userData}
                            fill="#18181b"
                            shape="circle"
                        >
                            <LabelList
                                dataKey="name"
                                position="top"
                                offset={8}
                                style={{ fill: '#18181b', fontSize: 11, fontWeight: 700 }}
                            />
                        </Scatter>

                        {/* Recommended position */}
                        {recommendedData.length > 0 && (
                            <Scatter
                                name="Position recommandée"
                                data={recommendedData}
                                fill="#22c55e"
                                shape="star"
                            >
                                <LabelList
                                    dataKey="name"
                                    position="top"
                                    offset={8}
                                    style={{ fill: '#16a34a', fontSize: 11, fontWeight: 600 }}
                                />
                            </Scatter>
                        )}
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                    <span className="text-sm text-muted-foreground">Concurrents</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-foreground"></span>
                    <span className="text-sm text-muted-foreground">{businessName}</span>
                </div>
                {recommendedData.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-sm text-muted-foreground">Position recommandée</span>
                    </div>
                )}
            </div>
        </div>
    );
};
