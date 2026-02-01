import { Clock, FileCheck, ShieldCheck } from 'lucide-react';

const stats = [
  {
    icon: Clock,
    value: '8-12 min',
    label: 'Temps moyen',
    color: 'text-sky-foreground',
    bg: 'bg-sky/20',
  },
  {
    icon: FileCheck,
    value: 'PDF Premium',
    label: 'Format export',
    color: 'text-lavender-foreground',
    bg: 'bg-lavender/20',
  },
  {
    icon: ShieldCheck,
    value: '24h',
    label: 'Remboursement',
    color: 'text-mint-foreground',
    bg: 'bg-mint/20',
  },
];

export const SecondaryProof = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="opacity-0-initial animate-fade-up text-center p-8 rounded-3xl bg-card border border-border hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-black text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Trust message */}
          <div className="text-center p-10 rounded-[2rem] bg-secondary/50 border border-border">
            <p className="text-xl md:text-2xl text-foreground font-medium leading-relaxed mb-4">
              "Nous ne fabriquons pas de sources. Si vous fournissez des URLs, nous les citons."
            </p>
            <p className="text-muted-foreground">
              Outil d'aide à la décision, pas un conseil juridique ou financier.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
