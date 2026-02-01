import { 
  ClipboardList, 
  Users, 
  MapPin, 
  DollarSign, 
  LayoutGrid, 
  Calendar,
  ArrowUpRight
} from 'lucide-react';

const features = [
  {
    icon: ClipboardList,
    feature: "Questionnaire intelligent",
    outcome: "Pas de page blanche — on vous guide étape par étape",
    color: "from-primary/20 to-primary/5"
  },
  {
    icon: Users,
    feature: "Comparaison concurrents",
    outcome: "Sachez où vous gagnez et où vous perdez",
    color: "from-chart-2/20 to-chart-2/5"
  },
  {
    icon: MapPin,
    feature: "Angle marché local",
    outcome: "Insights pertinents pour votre ville et région",
    color: "from-primary/20 to-primary/5"
  },
  {
    icon: DollarSign,
    feature: "Stratégie pricing",
    outcome: "Packagez et pricez avec confiance",
    color: "from-chart-2/20 to-chart-2/5"
  },
  {
    icon: LayoutGrid,
    feature: "Matrice de positionnement",
    outcome: "Différenciation claire en un coup d'œil",
    color: "from-primary/20 to-primary/5"
  },
  {
    icon: Calendar,
    feature: "Plan d'action 30/60/90",
    outcome: "Exécutez étape par étape avec des jalons clairs",
    color: "from-chart-2/20 to-chart-2/5"
  }
];

export const FeatureCards = () => {
  return (
    <section id="product" className="py-24 md:py-32 bg-card relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-chart-2/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary font-medium mb-3 opacity-0-initial animate-fade-up">Fonctionnalités</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 opacity-0-initial animate-fade-up stagger-1">
            Tout ce qu'il faut pour décider
          </h2>
          <p className="text-lg text-muted-foreground opacity-0-initial animate-fade-up stagger-2">
            Chaque rapport inclut six sections clés conçues pour l'action, pas juste l'information.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((item, index) => (
            <div 
              key={index}
              className={`opacity-0-initial animate-fade-up stagger-${Math.min(index + 3, 6)} group relative bg-background rounded-2xl p-6 lg:p-8 shadow-sm border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden`}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-lg">{item.feature}</h3>
                  <ArrowUpRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <p className="text-muted-foreground">{item.outcome}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};