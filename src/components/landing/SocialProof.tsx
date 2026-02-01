import { ArrowRight } from 'lucide-react';

const testimonials = [
  {
    initial: 'S',
    name: 'Sophie L.',
    role: 'Founder @ TechStartup',
    color: 'card-sky',
  },
  {
    initial: 'M',
    name: 'Marc K.',
    role: 'CEO @ Agency',
    color: 'card-mint',
  },
  {
    initial: 'I',
    name: 'Inès R.',
    role: 'Product Manager',
    color: 'card-lavender',
  },
  {
    initial: 'L',
    name: 'Lucas M.',
    role: 'CTO @ Startup',
    color: 'card-peach',
  },
  {
    initial: 'E',
    name: 'Elena G.',
    role: 'Marketing Lead',
    color: 'card-coral',
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
              className={`flex-shrink-0 w-72 p-6 rounded-3xl border ${testimonial.color} hover-lift cursor-pointer group`}
            >
              {/* Initial avatar */}
              <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center mb-8 shadow-sm">
                <span className="font-bold text-foreground">{testimonial.initial}</span>
              </div>

              {/* Name & role */}
              <h3 className="text-xl font-bold text-foreground mb-1">{testimonial.name}</h3>
              <p className="text-muted-foreground text-sm mb-6">{testimonial.role}</p>

              {/* Skeleton lines */}
              <div className="space-y-2 mb-8">
                <div className="h-2.5 bg-foreground/10 rounded-full w-full" />
                <div className="h-2.5 bg-foreground/10 rounded-full w-4/5" />
                <div className="h-2.5 bg-foreground/10 rounded-full w-3/5" />
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                <span>VOIR LE DOSSIER</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
