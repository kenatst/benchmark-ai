import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList, Tooltip } from 'recharts';

interface PricingComparisonData {
    competitor: string;
    offer: string;
    price: string;
}

interface PricingComparisonChartProps {
    data: PricingComparisonData[];
    businessName?: string;
    businessPrice?: string;
}

export const PricingComparisonChart = ({
    data,
    businessName = 'Vous',
    businessPrice
}: PricingComparisonChartProps) => {
    // Parse prices from strings like "199€", "€199", "199 €/mois", etc.
    const parsePrice = (priceStr: string): number => {
        const match = priceStr.replace(/\s/g, '').match(/[\d.,]+/);
        if (match) {
            return parseFloat(match[0].replace(',', '.'));
        }
        return 0;
    };

    // Prepare chart data
    const chartData = data.map(item => ({
        name: item.competitor.length > 12 ? item.competitor.substring(0, 12) + '...' : item.competitor,
        fullName: item.competitor,
        price: parsePrice(item.price),
        priceLabel: item.price,
        offer: item.offer,
        isUser: false
    }));

    // Add user's price if provided
    if (businessPrice) {
        chartData.push({
            name: businessName.length > 12 ? businessName.substring(0, 12) + '...' : businessName,
            fullName: businessName,
            price: parsePrice(businessPrice),
            priceLabel: businessPrice,
            offer: 'Votre offre',
            isUser: true
        });
    }

    // Sort by price
    chartData.sort((a, b) => a.price - b.price);

    const formatCurrency = (value: number) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k€`;
        }
        return `${value}€`;
    };

    // Calculate average
    const avgPrice = chartData.reduce((sum, item) => sum + item.price, 0) / chartData.length;

    return (
        <div className="w-full">
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                        <XAxis
                            type="number"
                            tickFormatter={formatCurrency}
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fill: '#374151', fontSize: 12 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            width={80}
                        />
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => {
                                const item = chartData.find(d => d.name === label);
                                return item?.fullName || label;
                            }}
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Bar dataKey="price" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.isUser ? '#18181b' : '#9ca3af'}
                                />
                            ))}
                            <LabelList
                                dataKey="priceLabel"
                                position="right"
                                style={{ fill: '#374151', fontSize: 11, fontWeight: 500 }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Average indicator */}
            <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Prix moyen du marché:</span>
                <span className="font-bold text-foreground">{formatCurrency(avgPrice)}</span>
            </div>

            {/* Detailed breakdown */}
            <div className="mt-4 space-y-2">
                {chartData.map((item, index) => (
                    <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${item.isUser ? 'bg-foreground/5 border border-foreground' : 'bg-muted/30'
                            }`}
                    >
                        <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm truncate ${item.isUser ? 'text-foreground' : 'text-foreground'
                                }`}>
                                {item.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{item.offer}</p>
                        </div>
                        <span className={`font-bold text-sm ml-3 ${item.isUser ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                            {item.priceLabel}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
