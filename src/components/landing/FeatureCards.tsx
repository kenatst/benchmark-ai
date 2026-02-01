import { ArrowRight } from 'lucide-react';

const features = [
  {
    emoji: '📋',
    title: "Générateur\nBenchmark",
    description: "Créez un rapport structuré optimisé avec 3 formats au choix.",
    tags: ["3 formats", "Export PDF", "Compatible IA"],
    color: "card-coral",
    emojiColor: "bg-coral/20",
  },
  {
    emoji: '✉️',
    title: "Analyse\nConcurrents",
    description: "Comparez vos concurrents avec une analyse automatique basée sur leurs sites.",
    tags: ["Personnalisé", "Vérification IA", "Multi-ton"],
    color: "card-sky",
    emojiColor: "bg-sky/20",
  },
  {
    emoji: '✨',
    title: "Plan\nd'Action",
    description: "Découvrez des opportunités adaptées à votre positionnement.",
    tags: ["30/60/90 jours", "Priorités", "Objectifs"],
    color: "card-lavender",
    emojiColor: "bg-lavender/30",
  },
];

export const FeatureCards = () => {
  return (
    <section id="product" className="py-24 md:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 text-sm text-muted-foreground mb-6">
            <div className="w-8 h-0.5 bg-mint rounded-full" />
            <span className="font-semibold tracking-wide">FONCTIONNALITÉS</span>
            <div className="w-8 h-0.5 bg-mint rounded-full" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-4">
            Vos outils de
            <span className="text-gradient-lavender italic"> benchmark.</span>
          </h2>
        </div>

        {/* Feature cards grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`opacity-0-initial animate-fade-up stagger-${index + 1} group relative rounded-[2rem] p-8 border ${feature.color} hover-lift cursor-pointer transition-all duration-500`}
            >
              {/* Emoji icon */}
              <div className={`w-16 h-16 rounded-2xl ${feature.emojiColor} flex items-center justify-center mb-8 text-3xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {feature.emoji}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-black text-foreground mb-3 whitespace-pre-line leading-tight">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {feature.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {feature.tags.map((tag, tagIndex) => (
                  <span 
                    key={tagIndex}
                    className="px-3 py-1.5 rounded-full bg-card text-xs font-medium text-muted-foreground border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 text-coral-foreground font-semibold text-sm group-hover:gap-3 transition-all">
                <span>OUVRIR</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
