import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authMethod, setAuthMethod] = useState<'password' | 'magic'>('password');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate auth delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(authMode === 'signin' ? 'Welcome back!' : 'Account created successfully!');
    navigate('/app');
    setIsLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Magic link sent! Check your email.');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {authMode === 'signin' ? 'Welcome back' : 'Create your account'}
            </CardTitle>
            <CardDescription>
              {authMode === 'signin' 
                ? 'Sign in to access your benchmark reports' 
                : 'Get started with your first benchmark report'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'signin' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'password' | 'magic')}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="magic">Magic Link</TabsTrigger>
                  </TabsList>

                  <TabsContent value="password">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input 
                          id="signin-email" 
                          type="email" 
                          placeholder="you@example.com" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <Input 
                          id="signin-password" 
                          type="password" 
                          placeholder="••••••••" 
                          required 
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="magic">
                    <form onSubmit={handleMagicLink} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="magic-email">Email</Label>
                        <Input 
                          id="magic-email" 
                          type="email" 
                          placeholder="you@example.com" 
                          required 
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Magic Link'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="you@example.com" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input 
                      id="signup-password" 
                      type="password" 
                      placeholder="••••••••" 
                      minLength={8}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input 
                      id="signup-confirm" 
                      type="password" 
                      placeholder="••••••••" 
                      minLength={8}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-center text-muted-foreground text-xs mt-6">
              By continuing, you agree to our{' '}
              <a href="/legal#terms" className="text-primary hover:underline">Terms</a>
              {' '}and{' '}
              <a href="/legal#privacy" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
