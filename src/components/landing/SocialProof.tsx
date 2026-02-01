import { ArrowRight, TrendingUp, Target, Zap, BarChart2, Lightbulb } from 'lucide-react';

const testimonials = [
  {
    initial: 'S',
    name: 'Sophie L.',
    role: 'Fondatrice • E-commerce Mode',
    color: 'card-sky',
    icon: TrendingUp,
    quote: 'J\'ai enfin compris pourquoi mes concurrents captaient tout le marché. Le plan d\'action m\'a permis de repositionner mon offre en 2 semaines.',
    result: '+34% de conversions'
  },
  {
    initial: 'M',
    name: 'Marc K.',
    role: 'Directeur • Agence Marketing',
    color: 'card-mint',
    icon: Target,
    quote: 'On utilise Benchmark pour nos clients avant chaque lancement. Ça nous fait économiser 3 jours de recherche manuelle.',
    result: '12 clients accompagnés'
  },
  {
    initial: 'I',
    name: 'Inès R.',
    role: 'Product Manager • SaaS B2B',
    color: 'card-lavender',
    icon: Zap,
    quote: 'Le pricing recommandé était 40% au-dessus de ce qu\'on prévoyait. On a testé, et ça a marché. Merci !',
    result: 'ARPU x1.4'
  },
  {
    initial: 'L',
    name: 'Lucas M.',
    role: 'CTO • Startup FinTech',
    color: 'card-peach',
    icon: BarChart2,
    quote: 'La matrice de positionnement a convaincu nos investisseurs. Ils ont vu qu\'on avait fait nos devoirs.',
    result: 'Seed round bouclé'
  },
  {
    initial: 'E',
    name: 'Elena G.',
    role: 'CMO • Cosmétiques Bio',
    color: 'card-coral',
    icon: Lightbulb,
    quote: 'En 10 minutes j\'ai eu plus d\'insights que 3 mois d\'observation. Le rapport est devenu notre boussole stratégique.',
    result: '3 nouveaux marchés'
  },
];

export const SocialProof = () => {
  return (
    <section className="py-24 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center">
          <div className="w-8 h-0.5 bg-sky rounded-full" />
          <span className="font-semibold tracking-wide">ILS ONT TRANSFORMÉ LEUR STRATÉGIE</span>
          <div className="w-8 h-0.5 bg-sky rounded-full" />
        </div>
      </div>

      {/* Horizontal scrolling cards */}
      <div className="relative">
        <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused]">
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <div
              key={index}
              className={`flex-shrink-0 w-80 p-6 rounded-3xl border ${testimonial.color} hover-lift cursor-pointer group`}
            >
              {/* Header with avatar and icon */}
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center shadow-sm">
                  <span className="font-bold text-foreground">{testimonial.initial}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-card/80 flex items-center justify-center">
                  <testimonial.icon className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              {/* Name & role */}
              <h3 className="text-lg font-bold text-foreground mb-1">{testimonial.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{testimonial.role}</p>

              {/* Quote */}
              <p className="text-sm text-foreground/80 leading-relaxed mb-4 min-h-[72px]">
                "{testimonial.quote}"
              </p>

              {/* Result badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card text-xs font-semibold text-foreground border border-border">
                <span className="w-2 h-2 rounded-full bg-mint" />
                {testimonial.result}
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors mt-6 pt-4 border-t border-border/50">
                <span>VOIR SON RAPPORT</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
