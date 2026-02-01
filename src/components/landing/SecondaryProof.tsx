import { Clock, FileText, RotateCcw } from 'lucide-react';

const testimonials = [
  {
    quote: "The competitor table alone was worth 10x the price. I reference it weekly.",
    author: "David Park",
    role: "Consultant",
    avatar: "DP"
  },
  {
    quote: "Helped me negotiate better rates with clients by showing market positioning data.",
    author: "Lisa Martinez",
    role: "Freelance Designer",
    avatar: "LM"
  }
];

const stats = [
  { icon: Clock, value: "8-12 min", label: "Average completion time" },
  { icon: FileText, value: "Premium", label: "PDF format" },
  { icon: RotateCcw, value: "24h", label: "Refund policy" }
];

export const SecondaryProof = () => {
  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-2 gap-6">
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
        </div>
      </div>
    </section>
  );
};
