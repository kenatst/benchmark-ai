import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { z } from 'zod';

const emailSchema = z.string().email("Email invalide");
const passwordSchema = z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères");

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp, signInWithMagicLink } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authMethod, setAuthMethod] = useState<'password' | 'magic'>('password');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/app');
    }
  }, [user, loading, navigate]);

  const validateForm = (email: string, password?: string, confirmPassword?: string): boolean => {
    const newErrors: { email?: string; password?: string; confirm?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    if (password !== undefined) {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }
    
    if (confirmPassword !== undefined && password !== confirmPassword) {
      newErrors.confirm = "Les mots de passe ne correspondent pas";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (!validateForm(email, password)) return;
    
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou mot de passe incorrect');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Veuillez confirmer votre email avant de vous connecter');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Bienvenue !');
      navigate('/app');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm') as string;
    
    if (!validateForm(email, password, confirmPassword)) return;
    
    setIsLoading(true);
    
    const { error } = await signUp(email, password);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('Un compte existe déjà avec cet email');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
    }
    
    setIsLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    
    if (!validateForm(email)) return;
    
    setIsLoading(true);
    
    const { error } = await signInWithMagicLink(email);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Lien magique envoyé ! Vérifiez votre boîte mail.');
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-32 pb-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {authMode === 'signin' ? 'Content de vous revoir' : 'Créez votre compte'}
            </CardTitle>
            <CardDescription>
              {authMode === 'signin' 
                ? 'Connectez-vous pour accéder à vos benchmarks' 
                : 'Commencez avec votre premier benchmark'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(v) => { setAuthMode(v as 'signin' | 'signup'); setErrors({}); }}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <Tabs value={authMethod} onValueChange={(v) => { setAuthMethod(v as 'password' | 'magic'); setErrors({}); }}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="password">Mot de passe</TabsTrigger>
                    <TabsTrigger value="magic">Lien magique</TabsTrigger>
                  </TabsList>

                  <TabsContent value="password">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input 
                          id="signin-email" 
                          name="email"
                          type="email" 
                          placeholder="vous@exemple.com" 
                          required 
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Mot de passe</Label>
                        <Input 
                          id="signin-password" 
                          name="password"
                          type="password" 
                          placeholder="••••••••" 
                          required 
                        />
                        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Connexion...' : 'Se connecter'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="magic">
                    <form onSubmit={handleMagicLink} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="magic-email">Email</Label>
                        <Input 
                          id="magic-email" 
                          name="email"
                          type="email" 
                          placeholder="vous@exemple.com" 
                          required 
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Envoi...' : 'Envoyer le lien magique'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email" 
                      name="email"
                      type="email" 
                      placeholder="vous@exemple.com" 
                      required 
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input 
                      id="signup-password" 
                      name="password"
                      type="password" 
                      placeholder="••••••••" 
                      minLength={8}
                      required 
                    />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmer le mot de passe</Label>
                    <Input 
                      id="signup-confirm" 
                      name="confirm"
                      type="password" 
                      placeholder="••••••••" 
                      minLength={8}
                      required 
                    />
                    {errors.confirm && <p className="text-sm text-destructive">{errors.confirm}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Création du compte...' : 'Créer mon compte'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-center text-muted-foreground text-xs mt-6">
              En continuant, vous acceptez nos{' '}
              <a href="/legal#terms" className="text-primary hover:underline">CGV</a>
              {' '}et notre{' '}
              <a href="/legal#privacy" className="text-primary hover:underline">Politique de confidentialité</a>
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
