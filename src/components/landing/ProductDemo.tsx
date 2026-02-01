import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Users, Calendar, TrendingUp, ChevronRight } from 'lucide-react';

const tabs = [
  { 
    id: 'overview', 
    label: 'Vue d\'ensemble', 
    icon: FileText,
    content: {
      title: "Résumé Exécutif",
      subtitle: "TechStart • Paris • SaaS B2B",
      sections: [
        { label: "Score de positionnement", value: "78/100", color: "text-primary" },
        { label: "Concurrents analysés", value: "5", color: "text-chart-1" },
        { label: "Opportunités identifiées", value: "8", color: "text-primary" },
        { label: "Risques à surveiller", value: "3", color: "text-destructive" }
      ],
      bullets: [
        "Position forte sur le segment PME avec différenciation UX",
        "Prix 15% sous la moyenne marché — marge d'augmentation",
        "Opportunité de croissance sur le segment mid-market"
      ]
    }
  },
  { 
    id: 'competitors', 
    label: 'Concurrents', 
    icon: Users,
    content: {
      title: "Analyse Concurrentielle",
      competitors: [
        { name: "CompetitorA", price: "€49/mois", strength: "Notoriété", weakness: "UX complexe", position: "Leader" },
        { name: "CompetitorB", price: "€29/mois", strength: "Prix bas", weakness: "Fonctionnalités limitées", position: "Low-cost" },
        { name: "CompetitorC", price: "€79/mois", strength: "Intégrations", weakness: "Support lent", position: "Premium" }
      ]
    }
  },
  { 
    id: 'pricing', 
    label: 'Pricing', 
    icon: TrendingUp,
    content: {
      title: "Recommandations Pricing",
      recommendations: [
        { tier: "Starter", current: "€19/mois", suggested: "€29/mois", reason: "Sous-évalué vs marché" },
        { tier: "Pro", current: "€49/mois", suggested: "€59/mois", reason: "Alignement valeur perçue" },
        { tier: "Enterprise", current: "Sur devis", suggested: "À partir de €199/mois", reason: "Ancrage psychologique" }
      ]
    }
  },
  { 
    id: 'action', 
    label: 'Plan d\'action', 
    icon: Calendar,
    content: {
      title: "Plan 30/60/90 Jours",
      phases: [
        { 
          period: "J1-30",
          title: "Quick Wins", 
          tasks: ["Ajuster pricing Starter", "Refonte page d'accueil", "Setup tracking concurrentiel"],
          priority: "high"
        },
        { 
          period: "J31-60",
          title: "Consolidation", 
          tasks: ["Lancer offre Enterprise", "Automatiser onboarding", "Créer cas d'études"],
          priority: "medium"
        },
        { 
          period: "J61-90",
          title: "Expansion", 
          tasks: ["Attaquer segment mid-market", "Partenariats stratégiques", "Expansion géographique"],
          priority: "low"
        }
      ]
    }
  }
];

export const ProductDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    const tab = tabs.find(t => t.id === activeTab);
    if (!tab) return null;

    if (activeTab === 'overview') {
      return (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground">{tab.content.title}</h3>
              <p className="text-muted-foreground">{tab.content.subtitle}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tab.content.sections.map((section, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-accent/50 border border-border">
                <p className={`text-2xl font-bold ${section.color}`}>{section.value}</p>
                <p className="text-sm text-muted-foreground">{section.label}</p>
              </div>
            ))}
          </div>
          
          <div className="p-5 rounded-xl bg-background border border-border">
            <h4 className="font-medium text-foreground mb-3">Points clés</h4>
            <ul className="space-y-2">
              {tab.content.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                  <ChevronRight className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (activeTab === 'competitors') {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">{tab.content.title}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Concurrent</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Prix</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Force</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Faiblesse</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Position</th>
                </tr>
              </thead>
              <tbody>
                {tab.content.competitors.map((comp, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="py-3 px-4 font-medium text-foreground">{comp.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{comp.price}</td>
                    <td className="py-3 px-4 text-primary">{comp.strength}</td>
                    <td className="py-3 px-4 text-destructive/80">{comp.weakness}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full bg-accent text-xs font-medium text-foreground">
                        {comp.position}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'pricing') {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">{tab.content.title}</h3>
          <div className="space-y-4">
            {tab.content.recommendations.map((rec, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">{rec.tier}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground line-through">{rec.current}</span>
                    <span className="text-primary font-semibold">{rec.suggested}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'action') {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">{tab.content.title}</h3>
          <div className="space-y-4">
            {tab.content.phases.map((phase, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-background border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    phase.priority === 'high' ? 'bg-primary/20 text-primary' :
                    phase.priority === 'medium' ? 'bg-chart-1/20 text-chart-1' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {phase.period}
                  </span>
                  <h4 className="font-semibold text-foreground">{phase.title}</h4>
                </div>
                <ul className="space-y-2">
                  {phase.tasks.map((task, taskIdx) => (
                    <li key={taskIdx} className="flex items-center gap-2 text-muted-foreground text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-card via-background to-card" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary font-medium mb-3 opacity-0-initial animate-fade-up">Aperçu du rapport</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 opacity-0-initial animate-fade-up stagger-1">
            Un rapport complet et actionnable
          </h2>
          <p className="text-lg text-muted-foreground opacity-0-initial animate-fade-up stagger-2">
            Découvrez ce que contient votre benchmark personnalisé.
          </p>
        </div>

        <div className="max-w-5xl mx-auto opacity-0-initial animate-fade-up stagger-3">
          <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-6 py-4 bg-muted/30 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-chart-1/60" />
                <div className="w-3 h-3 rounded-full bg-primary/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1.5 rounded-lg bg-background text-xs text-muted-foreground font-medium">
                  Exemple: TechStart • Secteur SaaS B2B
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6 md:p-8">
              <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 bg-accent/50 p-1.5 rounded-xl">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg py-2.5"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="mt-8 min-h-[400px]">
                {renderContent()}
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  );
};