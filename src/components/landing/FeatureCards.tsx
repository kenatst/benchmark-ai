import { 
  ClipboardList, 
  Users, 
  MapPin, 
  DollarSign, 
  LayoutGrid, 
  Calendar 
} from 'lucide-react';

const features = [
  {
    icon: ClipboardList,
    feature: "Smart questionnaire",
    outcome: "No blank page — we guide you step by step"
  },
  {
    icon: Users,
    feature: "Competitor comparison",
    outcome: "Know where you win and where you lose"
  },
  {
    icon: MapPin,
    feature: "Local market angle",
    outcome: "Insights relevant to your city & region"
  },
  {
    icon: DollarSign,
    feature: "Pricing strategy",
    outcome: "Package & price with confidence"
  },
  {
    icon: LayoutGrid,
    feature: "Positioning matrix",
    outcome: "Clear differentiation at a glance"
  },
  {
    icon: Calendar,
    feature: "Action plan 30/60/90",
    outcome: "Execute step-by-step with clear milestones"
  }
];

export const FeatureCards = () => {
  return (
    <section id="product" className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything you need to compete smarter
          </h2>
          <p className="text-muted-foreground">
            Each report includes six key sections designed for action, not just information.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((item, index) => (
            <div 
              key={index}
              className="bg-background rounded-xl p-6 shadow-sm border border-border hover:border-primary/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{item.feature}</h3>
              <p className="text-muted-foreground text-sm">{item.outcome}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
