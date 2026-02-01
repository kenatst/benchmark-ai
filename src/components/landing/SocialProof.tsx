import { Star, Shield, Clock, Sparkles, Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "J'ai enfin compris où je me situais face à mes concurrents. Le plan 30/60/90 jours m'a permis de convaincre mes investisseurs.",
    author: "Sarah Chen",
    role: "Fondatrice, TechStart",
    avatar: "SC",
    rating: 5
  },
  {
    quote: "J'ai économisé des semaines de recherche. Les recommandations pricing ont rentabilisé l'achat x10.",
    author: "Marcus Johnson",
    role: "Directeur d'agence",
    avatar: "MJ",
    rating: 5
  },
  {
    quote: "Le benchmark m'a aidé à pivoter mon positionnement. +40% de CA en 3 mois.",
    author: "Elena Rodriguez",
    role: "CEO, LocalServ",
    avatar: "ER",
    rating: 5
  }
];

const trustBadges = [
  { icon: Clock, label: "Livraison instantanée", description: "PDF prêt en 2 min" },
  { icon: Shield, label: "Paiement sécurisé", description: "Stripe & SSL" },
  { icon: Sparkles, label: "Conçu pour décider", description: "Pas de blabla" }
];

const logos = [
  { name: "TechCorp", opacity: "opacity-40" },
  { name: "StartupXYZ", opacity: "opacity-30" },
  { name: "GrowthCo", opacity: "opacity-50" },
  { name: "InnovateLab", opacity: "opacity-35" },
  { name: "ScaleUp", opacity: "opacity-45" }
];

export const SocialProof = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/30 to-background" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-primary font-medium mb-3 opacity-0-initial animate-fade-up">Témoignages</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 opacity-0-initial animate-fade-up stagger-1">
            Ils ont déjà généré leur benchmark
          </h2>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className={`opacity-0-initial animate-fade-up stagger-${index + 2} group relative bg-card rounded-2xl p-6 lg:p-8 shadow-sm border border-border hover-lift`}
            >
              {/* Quote icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/10" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              
              <p className="text-foreground leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Logo row */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mb-16">
          {logos.map((logo, index) => (
            <div 
              key={index}
              className={`text-muted-foreground font-semibold text-xl tracking-wider ${logo.opacity} hover:opacity-60 transition-opacity`}
            >
              {logo.name}
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          {trustBadges.map((badge, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-card border border-border shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <badge.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{badge.label}</p>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};