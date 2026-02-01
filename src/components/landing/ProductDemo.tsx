import { useState } from 'react';
import { FileText, Users, Calendar, CheckCircle2 } from 'lucide-react';

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
                  benchmark-techstartup-paris.pdf
                </div>
              </div>
            </div>

            {/* Content area */}
            <div className="p-8 md:p-12 bg-gradient-to-b from-card to-background min-h-[400px]">
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-start gap-6">
                    <div className="flex-1">
                      <div className="h-8 w-64 bg-foreground/10 rounded-xl mb-3" />
                      <div className="h-4 w-48 bg-foreground/5 rounded-lg" />
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-lavender/30 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-lavender-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {['Positionnement', 'Pricing', 'Go-to-market'].map((item, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-secondary/50 border border-border">
                        <div className="text-2xl font-black text-foreground mb-1">
                          {i === 0 ? '4.8' : i === 1 ? '€249' : '30j'}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">{item}</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 rounded-2xl bg-mint/10 border border-mint/30">
                    <div className="flex items-center gap-2 text-mint-foreground font-semibold mb-3">
                      <CheckCircle2 className="w-5 h-5" />
                      Résumé exécutif
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-foreground/5 rounded" />
                      <div className="h-3 w-4/5 bg-foreground/5 rounded" />
                      <div className="h-3 w-3/5 bg-foreground/5 rounded" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'competitors' && (
                <div className="space-y-4 animate-fade-in">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-secondary/30 border border-border">
                      <div className="w-12 h-12 rounded-xl bg-lavender/20 flex items-center justify-center font-bold text-lavender-foreground">
                        C{i}
                      </div>
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-foreground/10 rounded mb-2" />
                        <div className="h-3 w-48 bg-foreground/5 rounded" />
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">{85 - i * 5}%</div>
                        <div className="text-xs text-muted-foreground">Match</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'action' && (
                <div className="space-y-6 animate-fade-in">
                  {[
                    { period: '30 jours', color: 'coral', items: 3 },
                    { period: '60 jours', color: 'sky', items: 4 },
                    { period: '90 jours', color: 'mint', items: 3 },
                  ].map((phase, index) => (
                    <div key={index} className={`p-6 rounded-2xl card-${phase.color} border`}>
                      <div className="font-bold text-foreground mb-4">{phase.period}</div>
                      <div className="space-y-2">
                        {Array.from({ length: phase.items }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-foreground/30" />
                            </div>
                            <div className="h-3 flex-1 bg-foreground/5 rounded" />
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
