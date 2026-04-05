import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('🌿 Welcome back!');
      navigate('/dashboard');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-earth-cream via-garden-sage/30 to-earth-cream p-4">
      {/* Floating decorations */}
      <div className="fixed top-10 left-10 text-5xl animate-float opacity-30">🌿</div>
      <div className="fixed bottom-20 right-10 text-4xl animate-sway opacity-25">🍃</div>
      <div className="fixed top-1/3 right-20 text-3xl animate-float stagger-2 opacity-20">✨</div>

      <Card className="w-full max-w-md bg-garden-parchment/80 backdrop-blur-md border-earth-soft/40 shadow-xl animate-fade-in-up">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3">
            <Logo className="h-16 w-auto mx-auto" />
          </div>
          <CardTitle className="text-2xl text-earth-dark">Welcome Back</CardTitle>
          <p className="text-sm text-earth-mid">Sign in to tend your garden</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-earth-dark">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="gardener@itera.lab"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-white/60 border-earth-soft focus:border-garden-green"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-earth-dark">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-white/60 border-earth-soft focus:border-garden-green"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-garden-green hover:bg-garden-green/80 text-earth-dark font-bold"
            >
              {loading ? 'Signing in...' : '🌱 Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-earth-mid">
            Don't have an account?{' '}
            <Link to="/register" className="text-garden-wood hover:underline font-medium">
              Plant your first seed →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
