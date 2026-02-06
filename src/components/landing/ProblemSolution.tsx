const features = [
  {
    icon: '🎯',
    title: "Benchmark\ninstantané.",
    description: "Notre IA analyse vos concurrents, leur positionnement, leurs prix et leurs forces en quelques minutes. Résultat : un ",
    highlight: "rapport stratégique actionnable",
    stat: { label: "TEMPS DE GÉNÉRATION", value: "<5 min" },
    color: "card-sky",
    iconBg: "bg-card",
  },
  {
    icon: '🔒',
    title: "Données\nfiables.",
    description: "Zéro hallucination. Chaque chiffre est sourcé, chaque recommandation est quantifiée. Qualité cabinet de conseil, prix accessible.",
    color: "card-peach",
    iconBg: "bg-card",
  },
];

export const ProblemSolution = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`opacity-0-initial animate-fade-up stagger-${index + 1} rounded-[2.5rem] p-10 border ${feature.color} hover-lift transition-all duration-500`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-10 text-3xl shadow-sm border border-border`}>
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-4xl md:text-5xl font-black text-foreground mb-6 whitespace-pre-line leading-[1.1]">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {feature.description}
                {feature.highlight && (
                  <span className="text-foreground underline decoration-sky decoration-2 underline-offset-4 font-medium">
                    {feature.highlight}
                  </span>
                )}
                .
              </p>

              {/* Stat (if exists) */}
              {feature.stat && (
                <div className="flex items-center justify-between p-5 rounded-2xl bg-card border border-border">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                    {feature.stat.label}
                  </span>
                  <span className="text-3xl font-black text-sky-foreground">
                    {feature.stat.value}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
