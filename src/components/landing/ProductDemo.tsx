import { useState } from 'react';
import { FileText, Users, Calendar, CheckCircle2, TrendingUp, Target } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'APERÇU', icon: FileText },
  { id: 'competitors', label: 'CONCURRENTS', icon: Users },
  { id: 'action', label: 'PLAN D\'ACTION', icon: Calendar },
];

export const ProductDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 text-sm text-muted-foreground mb-6">
            <div className="w-8 h-0.5 bg-coral rounded-full" />
            <span className="font-semibold tracking-wide">DÉMONSTRATION</span>
            <div className="w-8 h-0.5 bg-coral rounded-full" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-4">
            Votre rapport,
            <span className="text-gradient-lavender italic"> en un clic.</span>
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-3 mb-12 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-foreground text-background shadow-lg'
                  : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Demo content */}
        <div className="max-w-4xl mx-auto">
          <div className="rounded-[2.5rem] bg-card border border-border shadow-2xl overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-3 px-6 py-4 bg-secondary/50 border-b border-border">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-coral/60" />
                <div className="w-3 h-3 rounded-full bg-gold/60" />
                <div className="w-3 h-3 rounded-full bg-mint/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-6 py-2 rounded-xl bg-background text-xs text-muted-foreground font-medium border border-border">
                  benchmark-startup-paris.pdf
                </div>
              </div>
            </div>

            {/* Content area */}
            <div className="p-8 md:p-12 bg-gradient-to-b from-card to-background min-h-[400px]">
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-start gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">Benchmark de Positionnement</h3>
                      <p className="text-muted-foreground">MonEntreprise SAS • Tech B2B • Paris</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-lavender/30 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-lavender-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Score positionnement', value: '4.8', icon: Target },
                      { label: 'Pricing recommandé', value: '€249', icon: TrendingUp },
                      { label: 'Quick wins', value: '12', icon: CheckCircle2 },
                    ].map((item, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-secondary/50 border border-border">
                        <item.icon className="w-5 h-5 text-muted-foreground mb-2" />
                        <div className="text-2xl font-black text-foreground mb-1">{item.value}</div>
                        <div className="text-xs text-muted-foreground font-medium">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 rounded-2xl bg-mint/10 border border-mint/30">
                    <div className="flex items-center gap-2 text-mint-foreground font-semibold mb-3">
                      <CheckCircle2 className="w-5 h-5" />
                      Résumé exécutif
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-mint mt-2" />
                        Positionnement solide sur le segment mid-market B2B
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-mint mt-2" />
                        Opportunité pricing de +25% vs concurrents directs
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-mint mt-2" />
                        3 axes différenciants identifiés à exploiter
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'competitors' && (
                <div className="space-y-4 animate-fade-in">
                  {[
                    { name: 'Concurrent Alpha', type: 'Direct', match: '85%', pricing: '€199-499/mo' },
                    { name: 'Concurrent Beta', type: 'Indirect', match: '72%', pricing: '€99-299/mo' },
                    { name: 'Concurrent Gamma', type: 'Direct', match: '68%', pricing: '€149-399/mo' },
                    { name: 'Concurrent Delta', type: 'Émergent', match: '54%', pricing: '€79-199/mo' },
                  ].map((competitor, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-secondary/30 border border-border">
                      <div className="w-12 h-12 rounded-xl bg-lavender/20 flex items-center justify-center font-bold text-lavender-foreground">
                        {competitor.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground mb-1">{competitor.name}</div>
                        <div className="text-sm text-muted-foreground">{competitor.type} • {competitor.pricing}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">{competitor.match}</div>
                        <div className="text-xs text-muted-foreground">Similarité</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'action' && (
                <div className="space-y-6 animate-fade-in">
                  {[
                    { period: '30 jours', color: 'card-coral', tasks: ['Ajuster messaging page d\'accueil', 'Lancer test pricing A/B', 'Créer 2 case studies clients'] },
                    { period: '60 jours', color: 'card-sky', tasks: ['Campagne positionnement LinkedIn', 'Refonte page pricing', 'Outreach 50 prospects qualifiés', 'Webinar expertise sectorielle'] },
                    { period: '90 jours', color: 'card-mint', tasks: ['Valider nouveau pricing', 'Expansion vertical adjacent', 'Mesurer et documenter résultats'] },
                  ].map((phase, index) => (
                    <div key={index} className={`p-6 rounded-2xl ${phase.color} border`}>
                      <div className="font-bold text-foreground mb-4">{phase.period}</div>
                      <div className="space-y-2">
                        {phase.tasks.map((task, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-foreground/30" />
                            </div>
                            <span className="text-sm text-foreground">{task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
