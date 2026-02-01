import { Clock, FileText, RefreshCw, Shield, CheckCircle } from 'lucide-react';

const stats = [
  { icon: Clock, value: "8-12 min", label: "Temps moyen de complétion" },
  { icon: FileText, value: "PDF Premium", label: "Format professionnel" },
  { icon: RefreshCw, value: "24h", label: "Garantie satisfaction" }
];

const additionalTestimonials = [
  {
    quote: "Le format PDF est impeccable. J'ai pu le partager directement avec mon équipe et mes partenaires.",
    author: "Thomas Martin",
    role: "Entrepreneur",
    avatar: "TM"
  },
  {
    quote: "C'est exactement ce dont j'avais besoin pour préparer mon pitch deck. Recommandation claire et structurée.",
    author: "Julie Dupont",
    role: "Startup Founder",
    avatar: "JD"
  }
];

const guarantees = [
  "PDF structuré et prêt à partager",
  "Sources citées si URLs fournis",
  "Plan d'action personnalisé",
  "Régénération possible si problème"
];

export const SecondaryProof = () => {
  return (
    <section className="py-24 md:py-32 bg-card relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-chart-1/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Stats row */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="opacity-0-initial animate-fade-up flex items-center gap-5 p-6 bg-background rounded-2xl border border-border shadow-sm"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
                <stat.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Additional testimonials */}
          <div className="space-y-6 opacity-0-initial animate-fade-up stagger-3">
            {additionalTestimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-6 bg-background rounded-2xl border border-border shadow-sm hover-lift"
              >
                <p className="text-foreground leading-relaxed mb-4">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-semibold text-sm">
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

          {/* Guarantees */}
          <div className="opacity-0-initial animate-fade-up stagger-4">
            <div className="p-8 bg-gradient-to-br from-accent via-background to-accent rounded-3xl border border-border">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Ce que vous obtenez</h3>
              </div>
              
              <ul className="space-y-4">
                {guarantees.map((guarantee, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground">{guarantee}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8 p-4 bg-background/50 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Important :</span> Ceci est un outil d'aide à la décision, pas un conseil juridique ou financier. Validez les recommandations critiques avec vos experts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};