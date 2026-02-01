import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { User, Bell, Shield, CreditCard, Save, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuthContext();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    company: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, company')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile({
          full_name: data.full_name || '',
          company: data.company || '',
        });
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        company: profile.company,
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Erreur lors de la sauvegarde');
    } else {
      toast.success('Paramètres sauvegardés avec succès');
    }

    setIsSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Déconnexion réussie');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input 
                    id="fullName" 
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Jean Dupont" 
                    className="rounded-xl" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={user?.email || ''}
                    disabled
                    className="rounded-xl bg-muted" 
                  />
                  <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Entreprise (optionnel)</Label>
                  <Input 
                    id="company" 
                    value={profile.company}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Ma Startup SAS" 
                    className="rounded-xl" 
                  />
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

            {/* Security Section */}
            <div className="rounded-[2rem] border border-border bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-mint/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-mint-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Sécurité</h2>
              </div>

              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start rounded-xl">
                  Changer mon mot de passe
                </Button>
              </div>
            </div>

            {/* Billing Section */}
            <div className="rounded-[2rem] border border-border bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-peach/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-peach-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Facturation</h2>
              </div>

              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Paiement à l'acte - Pas d'abonnement
                </p>
                <p className="text-sm text-muted-foreground">
                  Chaque benchmark est facturé individuellement.
                  <br />
                  Consultez vos rapports pour voir l'historique de vos achats.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-1 rounded-xl gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="rounded-xl gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
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
