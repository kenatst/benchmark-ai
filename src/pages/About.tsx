import { Link } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Target, Shield, Gem, Rocket, Users, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Recommandations actionnables',
    description: 'Chaque insight est conçu pour être mis en œuvre. Pas de blabla, pas de remplissage — juste des étapes claires à suivre.',
    color: 'card-coral'
  },
  {
    icon: Shield,
    title: 'Analyse honnête',
    description: 'On ne fabrique pas de sources. Si vous fournissez des URLs, on les cite. Si on fait des hypothèses, on vous le dit.',
    color: 'card-sky'
  },
  {
    icon: Gem,
    title: 'Qualité premium',
    description: 'Des rapports que vous serez fier de partager avec votre équipe, vos investisseurs ou vos partenaires.',
    color: 'card-lavender'
  }
];

const methodology = [
  {
    question: 'Quelles données sont utilisées ?',
    answer: 'Votre benchmark est généré à partir des informations que vous fournissez : détails de l\'entreprise, secteur, localisation, pricing, différenciateurs, objectifs et concurrents. Plus vous êtes précis, plus le rapport sera pertinent.'
  },
  {
    question: 'Comment le rapport est-il structuré ?',
    answer: 'Notre système analyse vos inputs contre les patterns de marché et génère un rapport structuré incluant : résumé exécutif, aperçu du marché, analyse concurrentielle, matrice de positionnement, recommandations pricing, stratégie go-to-market, évaluation des risques, et plan d\'action 30/60/90 jours.'
  },
  {
    question: 'Que dois-je valider ?',
    answer: 'Validez les prix des concurrents (les marchés évoluent), vérifiez les exigences réglementaires pour votre localisation, et confirmez les hypothèses sur votre marché cible. Le rapport est un support de décision, pas une recherche définitive.'
  },
  {
    question: 'Comment les URLs de concurrents aident-elles ?',
    answer: 'Quand vous fournissez des URLs de sites concurrents, nous pouvons analyser leur positionnement public et les citer comme sources. Sans URLs, les recommandations sont basées sur les patterns généraux du marché pour votre secteur.'
  }
];

const stats = [
  { value: '10 min', label: 'Temps moyen de complétion' },
  { value: '2 min', label: 'Génération du rapport' },
  { value: '4.9/5', label: 'Note satisfaction client' },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 md:pt-40 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-3 text-sm text-muted-foreground mb-6">
              <div className="w-8 h-0.5 bg-lavender rounded-full" />
              <span className="font-semibold tracking-wide">À PROPOS</span>
              <div className="w-8 h-0.5 bg-lavender rounded-full" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6 opacity-0-initial animate-fade-up">
              L'intelligence marché,{' '}
              <span className="text-gradient-coral italic">démocratisée.</span>
            </h1>
            <p className="text-lg text-muted-foreground opacity-0-initial animate-fade-up stagger-1 max-w-2xl mx-auto">
              Les études de marché traditionnelles coûtent des milliers d'euros et prennent des semaines. 
              Nous rendons l'intelligence concurrentielle accessible à tous en 10 minutes.
            </p>
          </div>

          {/* Mission Card */}
          <div className="max-w-4xl mx-auto mb-20 opacity-0-initial animate-fade-up stagger-2">
            <div className="relative rounded-[2.5rem] p-10 md:p-14 bg-gradient-to-br from-card to-secondary/30 border border-border overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-lavender/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-coral/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-lavender/20 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-lavender-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Notre Mission</h2>
                </div>
                
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  Nous combinons l'intelligence artificielle avec les frameworks stratégiques utilisés par les meilleurs consultants. 
                  En 10 minutes, obtenez la même clarté stratégique que les entreprises Fortune 500 paient des dizaines de milliers d'euros.
                </p>

                <div className="grid sm:grid-cols-3 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center p-4 rounded-2xl bg-card border border-border">
                      <div className="text-3xl font-black text-foreground mb-1">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 text-sm text-muted-foreground mb-6">
                <div className="w-8 h-0.5 bg-mint rounded-full" />
                <span className="font-semibold tracking-wide">NOS VALEURS</span>
                <div className="w-8 h-0.5 bg-mint rounded-full" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground">
                Ce qui nous guide
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {values.map((value, index) => (
                <div 
                  key={index}
                  className={`opacity-0-initial animate-fade-up rounded-[2rem] p-8 border ${value.color} hover-lift transition-all duration-500`}
                  style={{ animationDelay: `${(index + 3) * 0.1}s` }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center mb-6 border border-border">
                    <value.icon className="w-7 h-7 text-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 text-sm text-muted-foreground mb-6">
                <div className="w-8 h-0.5 bg-coral rounded-full" />
                <span className="font-semibold tracking-wide">FONCTIONNEMENT</span>
                <div className="w-8 h-0.5 bg-coral rounded-full" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground">
                Comment ça marche ?
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '01', icon: Users, title: 'Répondez au questionnaire', desc: 'En 10 minutes, partagez les infos clés sur votre business et vos objectifs.' },
                { step: '02', icon: Lightbulb, title: 'Analyse automatique', desc: 'Notre système croise vos données avec les patterns de marché et vos concurrents.' },
                { step: '03', icon: CheckCircle2, title: 'Rapport livré', desc: 'Téléchargez votre benchmark PDF avec plan d\'action 30/60/90 jours.' },
              ].map((item, index) => (
                <div key={index} className="text-center opacity-0-initial animate-fade-up" style={{ animationDelay: `${(index + 4) * 0.1}s` }}>
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 rounded-3xl bg-card border border-border flex items-center justify-center">
                      <item.icon className="w-8 h-8 text-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold flex items-center justify-center">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Methodology */}
          <div id="methodology" className="max-w-3xl mx-auto mb-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 text-sm text-muted-foreground mb-6">
                <div className="w-8 h-0.5 bg-sky rounded-full" />
                <span className="font-semibold tracking-wide">MÉTHODOLOGIE</span>
                <div className="w-8 h-0.5 bg-sky rounded-full" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground">
                Questions fréquentes
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {methodology.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card rounded-2xl border border-border px-6 data-[state=open]:border-sky/50 transition-colors"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline py-5 font-semibold">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="inline-flex flex-col sm:flex-row gap-4 opacity-0-initial animate-fade-up">
              <Link to="/app/new">
                <Button size="lg" className="group">
                  Générer mon benchmark
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/example">
                <Button size="lg" variant="outline">
                  Voir un exemple de rapport
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

export default About;
