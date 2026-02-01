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
      bg: 'bg-mint/10', 
      border: 'border-mint/20',
      text: 'text-mint-foreground',
      icon: '+'
    },
    { 
      key: 'weaknesses', 
      title: 'Faiblesses', 
      items: data.weaknesses, 
      bg: 'bg-coral/10', 
      border: 'border-coral/20',
      text: 'text-coral-foreground',
      icon: '-'
    },
    { 
      key: 'opportunities', 
      title: 'Opportunités', 
      items: data.opportunities, 
      bg: 'bg-sky/10', 
      border: 'border-sky/20',
      text: 'text-sky-foreground',
      icon: '↗'
    },
    { 
      key: 'threats', 
      title: 'Menaces', 
      items: data.threats, 
      bg: 'bg-gold/10', 
      border: 'border-gold/20',
      text: 'text-gold',
      icon: '⚠'
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {sections.map((section, index) => (
        <div 
          key={section.key}
          className={`${section.bg} rounded-2xl p-5 border ${section.border} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fade-up`}
          style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
        >
          <h5 className={`font-bold ${section.text} mb-4 text-lg flex items-center gap-2`}>
            <span className={`w-8 h-8 rounded-lg ${section.bg} flex items-center justify-center text-xl`}>
              {section.icon}
            </span>
            {section.title}
          </h5>
          <ul className="space-y-2">
            {section.items?.map((item, i) => (
              <li key={i} className="text-sm flex items-start gap-2 animate-fade-up" style={{ animationDelay: `${(index * 100) + (i * 50)}ms`, animationFillMode: 'forwards' }}>
                <span className={section.text}>{section.icon}</span>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
