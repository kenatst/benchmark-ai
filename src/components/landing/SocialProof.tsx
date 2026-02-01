import { Shield, Clock, Sparkles } from 'lucide-react';

const testimonials = [
  {
    quote: "Finally understood where we stand against competitors. The 30/60/90 plan was exactly what I needed to present to my board.",
    author: "Sarah Chen",
    role: "Founder, TechStart",
    avatar: "SC"
  },
  {
    quote: "Saved me weeks of research. The pricing recommendations alone paid for itself 10x over.",
    author: "Marcus Johnson",
    role: "Agency Owner",
    avatar: "MJ"
  },
  {
    quote: "Used the benchmark to pivot our positioning. Revenue up 40% in 3 months.",
    author: "Elena Rodriguez",
    role: "CEO, LocalServ",
    avatar: "ER"
  }
];

const trustBadges = [
  { icon: Clock, label: "Instant delivery" },
  { icon: Shield, label: "Secure payments" },
  { icon: Sparkles, label: "Designed for decision-making" }
];

const logos = ["TechCorp", "StartupXYZ", "GrowthCo", "InnovateLab", "ScaleUp"];

export const SocialProof = () => {
  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-background rounded-xl p-6 shadow-sm border border-border"
            >
              <p className="text-foreground mb-4 text-sm leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{testimonial.author}</p>
                  <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Logo row */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 mb-12 opacity-50">
          {logos.map((logo, index) => (
            <div 
              key={index}
              className="text-muted-foreground font-semibold text-lg tracking-wider"
            >
              {logo}
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          {trustBadges.map((badge, index) => (
            <div key={index} className="flex items-center gap-2">
              <badge.icon className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground text-sm font-medium">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
