import { XCircle, CheckCircle, ArrowRight, Lightbulb, TrendingUp, Clock } from 'lucide-react';

const problems = [
  {
    icon: Clock,
    title: "Difficile de comprendre la concurrence",
    description: "Vous passez des heures à chercher sans vue d'ensemble claire"
  },
  {
    icon: Lightbulb,
    title: "Les rapports génériques sont inutiles",
    description: "Études coûteuses qui ne correspondent pas à votre réalité"
  },
  {
    icon: TrendingUp,
    title: "Paralysie décisionnelle",
    description: "Trop d'informations, pas de plan d'action concret"
  }
];

const solutions = [
  "Répondez à un questionnaire guidé (10 min)",
  "On génère votre benchmark structuré",
  "Obtenez un plan d'action 30/60/90 jours"
];

export const ProblemSolution = () => {
  return (
    <section id="use-cases" className="py-24 md:py-32 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-primary font-medium mb-3 opacity-0-initial animate-fade-up">Comment ça marche</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 opacity-0-initial animate-fade-up stagger-1">
              De la confusion à la clarté
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto opacity-0-initial animate-fade-up stagger-2">
              Arrêtez de deviner. Obtenez un benchmark structuré et actionnable.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Problems */}
            <div className="opacity-0-initial animate-fade-up stagger-3">
              <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider mb-6">Le problème</h3>
              <div className="space-y-4">
                {problems.map((problem, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-5 bg-destructive/5 rounded-2xl border border-destructive/20 group hover:border-destructive/30 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">{problem.title}</p>
                      <p className="text-sm text-muted-foreground">{problem.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div className="opacity-0-initial animate-fade-up stagger-4">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-6">La solution</h3>
              <div className="space-y-4">
                {solutions.map((solution, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-5 bg-accent rounded-2xl border border-primary/20 group hover:border-primary/40 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold">{index + 1}</span>
                    </div>
                    <p className="font-medium text-foreground">{solution}</p>
                    {index < solutions.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-primary/40 ml-auto hidden lg:block" />
                    )}
                    {index === solutions.length - 1 && (
                      <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Result highlight */}
              <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-chart-2/10 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  <span className="font-semibold text-foreground">Résultat</span>
                </div>
                <p className="text-muted-foreground">
                  Un PDF premium avec positionnement, analyse concurrentielle, recommandations pricing et plan d'action personnalisé.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};