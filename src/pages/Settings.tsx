import { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { User, Bell, Shield, CreditCard, Globe, Moon, Sun, Save, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const handleSave = () => {
    toast.success('Paramètres sauvegardés avec succès');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 md:pt-40 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">
              Paramètres
            </h1>
            <p className="text-muted-foreground">
              Gérez votre compte et vos préférences
            </p>
          </div>

          <div className="space-y-8">
            {/* Profile Section */}
            <div className="rounded-[2rem] border border-border bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-lavender/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-lavender-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Profil</h2>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input id="firstName" placeholder="Jean" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input id="lastName" placeholder="Dupont" className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="jean@exemple.com" className="rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Entreprise (optionnel)</Label>
                  <Input id="company" placeholder="Ma Startup SAS" className="rounded-xl" />
                </div>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="rounded-[2rem] border border-border bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-sky/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-sky-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Notifications</h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Notifications par email</div>
                    <div className="text-sm text-muted-foreground">Recevez un email quand votre rapport est prêt</div>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Emails marketing</div>
                    <div className="text-sm text-muted-foreground">Recevez nos conseils et mises à jour</div>
                  </div>
                  <Switch 
                    checked={marketingEmails} 
                    onCheckedChange={setMarketingEmails}
                  />
                </div>
              </div>
            </div>

            {/* Appearance Section */}
            <div className="rounded-[2rem] border border-border bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-coral/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-coral-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Apparence</h2>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
                  <div>
                    <div className="font-medium text-foreground">Mode sombre</div>
                    <div className="text-sm text-muted-foreground">Basculer entre thème clair et sombre</div>
                  </div>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode}
                />
              </div>
            </div>

            {/* Billing Section */}
            <div className="rounded-[2rem] border border-border bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-mint/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-mint-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Facturation</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Historique des achats</div>
                  <div className="text-foreground font-medium">Aucun achat pour le moment</div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Les factures sont envoyées automatiquement par email après chaque achat.
                </p>
              </div>
            </div>

            {/* Security Section */}
            <div className="rounded-[2rem] border border-border bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gold" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Sécurité</h2>
              </div>

              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start rounded-xl">
                  Changer le mot de passe
                </Button>
                
                <Button variant="outline" className="w-full justify-start rounded-xl text-coral-foreground border-coral/30 hover:bg-coral/10">
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </Button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} size="lg" className="gap-2">
                <Save className="w-4 h-4" />
                Sauvegarder les modifications
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
