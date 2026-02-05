import { Link } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, FileText, Users, TrendingUp, Target, Calendar, CheckCircle2, BarChart2, Lightbulb, Lock } from 'lucide-react';

const Example = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 md:pt-40 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-12">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 group">
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Retour à l'accueil
            </Link>

            <div className="text-center">
              <div className="inline-flex items-center gap-3 text-sm text-muted-foreground mb-6">
                <div className="w-8 h-0.5 bg-coral rounded-full" />
                <span className="font-semibold tracking-wide">EXEMPLE</span>
                <div className="w-8 h-0.5 bg-coral rounded-full" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 opacity-0-initial animate-fade-up">
                Aperçu d'un{' '}
                <span className="text-gradient-lavender italic">rapport type</span>
              </h1>
              <p className="text-lg text-muted-foreground opacity-0-initial animate-fade-up stagger-1">
                Découvrez le niveau de détail et les insights que vous obtiendrez
              </p>
            </div>
          </div>

          {/* Report Preview */}
          <div className="max-w-4xl mx-auto opacity-0-initial animate-fade-up stagger-2">
            {/* Browser chrome */}
            <div className="rounded-t-[2rem] bg-secondary/50 border border-border border-b-0 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-coral/60" />
                  <div className="w-3 h-3 rounded-full bg-gold/60" />
                  <div className="w-3 h-3 rounded-full bg-mint/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-6 py-2 rounded-xl bg-card text-sm text-muted-foreground font-medium border border-border flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    benchmark-saas-paris-2024.pdf
                  </div>
                </div>
              </div>
            </div>

            {/* Report content */}
            <div className="rounded-b-[2rem] bg-card border border-border overflow-hidden">
              {/* Cover */}
              <div className="bg-gradient-to-br from-lavender/20 to-sky/20 p-12 text-center border-b border-border">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm text-muted-foreground mb-6">
                  <span className="w-2 h-2 rounded-full bg-mint" />
                  Rapport Pro • Janvier 2024
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">
                  Benchmark de Positionnement
                </h2>
                <p className="text-xl text-lavender-foreground font-semibold mb-2">TechStart Solutions</p>
                <p className="text-muted-foreground">
                  SaaS B2B • Paris, France
                </p>
              </div>

              {/* Sections */}
              <div className="p-8 md:p-12 space-y-10">
                {/* Executive Summary */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-mint/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-mint-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Résumé Exécutif</h3>
                  </div>
                  <div className="space-y-3 text-muted-foreground">
                    <p className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-lavender mt-2 flex-shrink-0" />
                      Positionnement solide sur le segment mid-market avec un potentiel de différenciation fort
                    </p>
                    <p className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-lavender mt-2 flex-shrink-0" />
                      Opportunité pricing identifiée : +30% possible vs positionnement actuel
                    </p>
                    <p className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-lavender mt-2 flex-shrink-0" />
                      3 axes stratégiques prioritaires pour les 90 prochains jours
                    </p>
                  </div>
                </div>

                {/* Competitor Table - Blurred */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-sky/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-sky-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Analyse Concurrentielle</h3>
                  </div>
                  
                  <div className="relative rounded-2xl overflow-hidden">
                    <div className="blur-sm select-none p-6 bg-secondary/30 border border-border rounded-2xl">
                      <div className="grid grid-cols-4 gap-4 text-sm font-semibold text-foreground pb-4 border-b border-border">
                        <span>Concurrent</span>
                        <span>Forces</span>
                        <span>Faiblesses</span>
                        <span>Pricing</span>
                      </div>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="grid grid-cols-4 gap-4 py-4 border-b border-border/50">
                          <div className="h-4 bg-foreground/10 rounded w-24" />
                          <div className="h-4 bg-foreground/10 rounded w-32" />
                          <div className="h-4 bg-foreground/10 rounded w-28" />
                          <div className="h-4 bg-foreground/10 rounded w-20" />
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
                      <div className="text-center">
                        <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <span className="text-sm text-muted-foreground">
                          Données concurrentielles complètes dans votre rapport
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Positioning Matrix */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-coral/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-coral-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Matrice de Positionnement</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { label: 'Score global', value: '4.8/5', color: 'card-mint' },
                      { label: 'Position marché', value: '#3', color: 'card-lavender' },
                      { label: 'Potentiel', value: 'Élevé', color: 'card-coral' },
                    ].map((item, i) => (
                      <div key={i} className={`p-6 rounded-2xl border ${item.color}`}>
                        <div className="text-3xl font-black text-foreground mb-1">{item.value}</div>
                        <div className="text-sm text-muted-foreground">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Recommendations */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-gold" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Recommandations Pricing</h3>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-gold/10 to-coral/10 border border-gold/30">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Pricing actuel</div>
                        <div className="text-2xl font-bold text-foreground">€49-199/mois</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Pricing recommandé</div>
                        <div className="text-2xl font-bold text-mint-foreground">€79-299/mois</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Plan */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-lavender/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-lavender-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Plan d'Action 30/60/90 jours</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { period: '30 jours', color: 'card-coral', tasks: ['Ajuster le messaging principal', 'Tester nouveau pricing sur 20% trafic', 'Créer landing page segment Enterprise'] },
                      { period: '60 jours', color: 'card-sky', tasks: ['Lancer campagne positionnement', 'Développer 3 case studies', 'Optimiser funnel conversion', 'Outreach partenaires stratégiques'] },
                      { period: '90 jours', color: 'card-mint', tasks: ['Valider nouveau pricing', 'Expansion segment vertical', 'Mesurer et itérer'] },
                    ].map((phase, index) => (
                      <div key={index} className={`p-6 rounded-2xl border ${phase.color}`}>
                        <div className="font-bold text-foreground mb-4">{phase.period}</div>
                        <div className="space-y-2">
                          {phase.tasks.map((task, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-foreground/30 mt-2 flex-shrink-0" />
                              {task}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* More sections indicator */}
                <div className="text-center py-8 border-t border-border">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
                    <BarChart2 className="w-5 h-5" />
                    <Lightbulb className="w-5 h-5" />
                    <Target className="w-5 h-5" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">
                    + Aperçu marché, risques & checks, sources citées, annexes...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Le rapport complet contient toutes les analyses stratégiques détaillées
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16 opacity-0-initial animate-fade-up stagger-3">
            <p className="text-muted-foreground mb-6">
              Prêt à obtenir votre propre benchmark personnalisé ?
            </p>
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <Link to="/app/new">
                <Button size="lg" className="group">
                  Générer mon benchmark — 14,99€
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline">
                  Voir tous les plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Example;
