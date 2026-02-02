interface SWOTData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface SWOTGridProps {
  data: SWOTData;
}

export const SWOTGrid = ({ data }: SWOTGridProps) => {
  const sections = [
    {
      key: 'strengths',
      title: 'Forces',
      items: data.strengths,
      position: 'Interne • Positif'
    },
    {
      key: 'weaknesses',
      title: 'Faiblesses',
      items: data.weaknesses,
      position: 'Interne • Négatif'
    },
    {
      key: 'opportunities',
      title: 'Opportunités',
      items: data.opportunities,
      position: 'Externe • Positif'
    },
    {
      key: 'threats',
      title: 'Menaces',
      items: data.threats,
      position: 'Externe • Négatif'
    },
  ];

  return (
    <div className="grid md:grid-cols-2 border border-foreground rounded-lg overflow-hidden">
      {sections.map((section, index) => (
        <div
          key={section.key}
          className={`
            p-5 bg-card
            ${index < 2 ? 'border-b border-foreground' : ''}
            ${index % 2 === 0 ? 'md:border-r border-foreground' : ''}
          `}
        >
          <div className="mb-4">
            <h5 className="font-bold text-foreground text-lg">
              {section.title}
            </h5>
            <p className="text-xs text-muted-foreground">
              {section.position}
            </p>
          </div>
          <ul className="space-y-2">
            {section.items?.map((item, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-muted-foreground mt-1">•</span>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
            {(!section.items || section.items.length === 0) && (
              <li className="text-sm text-muted-foreground italic">
                Aucun élément identifié
              </li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
};
