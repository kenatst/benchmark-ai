import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail } from 'lucide-react';

const Legal = () => {
  const contactEmail = "benchmarkaiapp@outlook.com";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
            Mentions Légales
          </h1>

          <Tabs defaultValue="terms" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="terms">CGV</TabsTrigger>
              <TabsTrigger value="privacy">Confidentialité</TabsTrigger>
              <TabsTrigger value="legal">Mentions</TabsTrigger>
              <TabsTrigger value="disclaimer">Avertissement</TabsTrigger>
            </TabsList>

            <TabsContent value="terms" id="terms" className="prose prose-sm max-w-none">
              <div className="space-y-6 text-foreground">
                <section>
                  <h2 className="text-xl font-semibold mb-4">Conditions Générales de Vente</h2>
                  <p className="text-muted-foreground mb-4">
                    Dernière mise à jour : Février 2026
                  </p>
                  
                  <h3 className="text-lg font-medium mt-6 mb-3">Article 1 - Objet</h3>
                  <p className="text-muted-foreground">
                    Les présentes Conditions Générales de Vente régissent les relations contractuelles entre 
                    BenchmarkAI (ci-après "le Prestataire") et tout utilisateur (ci-après "le Client") 
                    du service de génération de benchmarks de positionnement.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Article 2 - Description du service</h3>
                  <p className="text-muted-foreground">
                    BenchmarkAI propose un service de génération de rapports de benchmark de positionnement 
                    utilisant l'intelligence artificielle. Les rapports sont générés sur la base des informations 
                    fournies par le Client et comprennent une analyse concurrentielle, des recommandations 
                    de pricing et un plan d'action personnalisé.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Article 3 - Tarifs et paiement</h3>
                  <p className="text-muted-foreground mb-2">
                    Les tarifs sont indiqués en euros TTC. Trois formules sont proposées :
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li><strong>Standard</strong> : 14,99€ - Analyse stratégique, 3-5 concurrents, PDF</li>
                    <li><strong>Pro</strong> : 34,99€ - Intelligence compétitive approfondie, 5-10 concurrents, PDF premium</li>
                    <li><strong>Agence</strong> : 69,99€ - Rapport institutionnel, 10-15 concurrents, analyse multi-marchés, PDF</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    Le paiement s'effectue en ligne par carte bancaire via la plateforme sécurisée Stripe. 
                    Le rapport est généré et accessible immédiatement après confirmation du paiement.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Article 4 - Droit de rétractation et remboursement</h3>
                  <p className="text-muted-foreground">
                    Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation 
                    ne peut être exercé pour les services pleinement exécutés avant la fin du délai de rétractation 
                    et dont l'exécution a commencé avec l'accord du consommateur. Toutefois, BenchmarkAI 
                    s'engage à rembourser intégralement le Client dans les 24 heures suivant l'achat si le 
                    rapport ne correspond pas aux attentes raisonnables du Client. Contactez-nous à {contactEmail}.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Article 5 - Propriété intellectuelle</h3>
                  <p className="text-muted-foreground">
                    Le Client acquiert un droit d'utilisation personnel et non-exclusif du rapport généré. 
                    Il peut le partager avec ses équipes et parties prenantes. La revente ou redistribution 
                    commerciale des rapports est interdite.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Article 6 - Responsabilité</h3>
                  <p className="text-muted-foreground">
                    Le Prestataire s'engage à fournir un service de qualité mais ne garantit pas l'exactitude 
                    absolue des informations générées par l'IA. Les rapports constituent des outils d'aide 
                    à la décision et ne sauraient se substituer à l'avis de professionnels qualifiés. 
                    La responsabilité du Prestataire est limitée au montant payé par le Client.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Article 7 - Litiges</h3>
                  <p className="text-muted-foreground">
                    Les présentes CGV sont soumises au droit français. En cas de litige, les parties 
                    s'engagent à rechercher une solution amiable. À défaut, les tribunaux français 
                    seront seuls compétents.
                  </p>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="privacy" id="privacy" className="prose prose-sm max-w-none">
              <div className="space-y-6 text-foreground">
                <section>
                  <h2 className="text-xl font-semibold mb-4">Politique de Confidentialité</h2>
                  <p className="text-muted-foreground mb-4">
                    Dernière mise à jour : Février 2026
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">1. Responsable du traitement</h3>
                  <p className="text-muted-foreground">
                    Le responsable du traitement des données personnelles est BenchmarkAI, 
                    joignable à l'adresse : {contactEmail}
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">2. Données collectées</h3>
                  <p className="text-muted-foreground mb-2">Nous collectons les données suivantes :</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li><strong>Données d'identification</strong> : adresse email</li>
                    <li><strong>Données de benchmark</strong> : informations sur votre entreprise, offre, concurrents</li>
                    <li><strong>Données de paiement</strong> : traitées de manière sécurisée par Stripe (nous ne stockons pas vos données bancaires)</li>
                    <li><strong>Données de navigation</strong> : cookies techniques et analytiques</li>
                  </ul>

                  <h3 className="text-lg font-medium mt-6 mb-3">3. Finalités du traitement</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Génération de vos rapports de benchmark</li>
                    <li>Traitement des paiements et envoi des factures</li>
                    <li>Livraison des rapports par email et via le tableau de bord</li>
                    <li>Amélioration de nos services</li>
                    <li>Communication sur nos offres (avec votre consentement)</li>
                  </ul>

                  <h3 className="text-lg font-medium mt-6 mb-3">4. Base légale</h3>
                  <p className="text-muted-foreground">
                    Le traitement de vos données repose sur : l'exécution du contrat (génération du rapport), 
                    nos intérêts légitimes (amélioration du service), et votre consentement (emails marketing).
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">5. Conservation des données</h3>
                  <p className="text-muted-foreground">
                    Vos données sont conservées pendant toute la durée de votre compte. 
                    Après suppression du compte, les données sont effacées sous 30 jours, 
                    à l'exception des données nécessaires aux obligations légales (3 ans pour les factures).
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">6. Vos droits (RGPD)</h3>
                  <p className="text-muted-foreground mb-2">Vous disposez des droits suivants :</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Droit d'accès à vos données</li>
                    <li>Droit de rectification</li>
                    <li>Droit à l'effacement ("droit à l'oubli")</li>
                    <li>Droit à la portabilité</li>
                    <li>Droit d'opposition</li>
                    <li>Droit de retirer votre consentement</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    Pour exercer vos droits, contactez-nous à : {contactEmail}
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">7. Sous-traitants</h3>
                  <p className="text-muted-foreground">
                    Nous faisons appel aux sous-traitants suivants : Stripe (paiements), 
                    Lovable/Supabase (hébergement et base de données), Resend (emails transactionnels).
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">8. Réclamation</h3>
                  <p className="text-muted-foreground">
                    Vous pouvez introduire une réclamation auprès de la CNIL (Commission Nationale 
                    de l'Informatique et des Libertés) : www.cnil.fr
                  </p>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="legal" id="legal" className="prose prose-sm max-w-none">
              <div className="space-y-6 text-foreground">
                <section>
                  <h2 className="text-xl font-semibold mb-4">Mentions Légales</h2>
                  <p className="text-muted-foreground mb-4">
                    Dernière mise à jour : Février 2026
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Éditeur du site</h3>
                  <p className="text-muted-foreground">
                    <strong>BenchmarkAI</strong><br />
                    Service de génération de benchmarks de positionnement<br />
                    Email : {contactEmail}
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Hébergement</h3>
                  <p className="text-muted-foreground">
                    Le site est hébergé par Lovable / Supabase<br />
                    Infrastructure cloud sécurisée
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Propriété intellectuelle</h3>
                  <p className="text-muted-foreground">
                    L'ensemble du contenu du site (textes, graphismes, logos, icônes, images) 
                    est la propriété exclusive de BenchmarkAI, à l'exception des éléments 
                    fournis par des partenaires ou sous licence. Toute reproduction, représentation, 
                    modification ou exploitation non autorisée est interdite.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Cookies</h3>
                  <p className="text-muted-foreground">
                    Le site utilise des cookies techniques nécessaires au fonctionnement du service 
                    et des cookies analytiques pour améliorer l'expérience utilisateur. Vous pouvez 
                    gérer vos préférences dans les paramètres de votre navigateur.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Contact</h3>
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <Mail className="w-5 h-5 text-primary" />
                    <a href={`mailto:${contactEmail}`} className="text-primary hover:underline font-medium">
                      {contactEmail}
                    </a>
                  </div>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="disclaimer" id="disclaimer" className="prose prose-sm max-w-none">
              <div className="space-y-6 text-foreground">
                <section>
                  <h2 className="text-xl font-semibold mb-4">Avertissement</h2>
                  <p className="text-muted-foreground mb-4">
                    Dernière mise à jour : Février 2026
                  </p>

                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
                    <p className="text-foreground font-medium mb-2">⚠️ Avis important</p>
                    <p className="text-muted-foreground text-sm">
                      Les rapports BenchmarkAI sont des outils d'aide à la décision. 
                      Ils ne constituent en aucun cas une étude de marché officielle, 
                      un conseil juridique, financier ou comptable.
                    </p>
                  </div>

                  <h3 className="text-lg font-medium mt-6 mb-3">Nature des rapports</h3>
                  <p className="text-muted-foreground">
                    Les rapports sont générés par intelligence artificielle sur la base des informations 
                    fournies par l'utilisateur et de modèles de marché généraux. Ils offrent des 
                    orientations stratégiques et doivent être utilisés en complément d'autres analyses.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Exactitude et sources</h3>
                  <p className="text-muted-foreground">
                    Nous nous efforçons d'assurer l'exactitude des informations mais ne pouvons 
                    garantir qu'elles soient toujours actuelles ou complètes. Les URL de concurrents 
                    que vous fournissez sont citées telles quelles. <strong>Nous n'inventons jamais de sources.</strong> 
                    Les conditions de marché évoluent rapidement : validez les recommandations avant 
                    toute décision critique.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Responsabilité de l'utilisateur</h3>
                  <p className="text-muted-foreground">
                    L'utilisateur est responsable de la validation des prix, des exigences 
                    réglementaires et des hypothèses spécifiques à sa situation. Consultez des 
                    professionnels qualifiés pour les décisions juridiques, financières ou de conformité.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Limitation de responsabilité</h3>
                  <p className="text-muted-foreground">
                    BenchmarkAI ne saurait être tenu responsable des décisions commerciales prises 
                    sur la base des recommandations des rapports. La responsabilité maximale est 
                    limitée au prix d'achat du rapport concerné.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Contact</h3>
                  <p className="text-muted-foreground">
                    Pour toute question concernant ces avertissements, contactez-nous à : {contactEmail}
                  </p>
                </section>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Legal;
