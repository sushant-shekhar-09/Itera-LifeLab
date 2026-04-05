import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  // Step 1
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Pass the new fields to the register function
      await register(username, email, password, firstName, lastName, dob);
      toast.success('🌱 Garden created! Welcome to LifeLab!');
      navigate('/dashboard');
    } catch {
      toast.error('Registration failed. Email or username may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-earth-cream via-garden-sage/30 to-earth-cream p-4">
      <div className="fixed top-16 right-16 text-5xl animate-sway opacity-25">🌻</div>
      <div className="fixed bottom-16 left-16 text-4xl animate-float opacity-25">🌿</div>
      <div className="fixed top-1/4 left-1/4 text-2xl animate-float stagger-3 opacity-15">🦋</div>

      <Card className="w-full max-w-md bg-garden-parchment/80 backdrop-blur-md border-earth-soft/40 shadow-xl animate-fade-in-up">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3">
            <Logo className="h-16 w-auto mx-auto" />
          </div>
          <CardTitle className="text-2xl text-earth-dark">Begin Your Journey</CardTitle>
          <p className="text-sm text-earth-mid">Create an account to start growing habits</p>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4 animate-fade-in-up">
              <div className="space-y-2">
                <Label htmlFor="reg-username" className="text-earth-dark">Username</Label>
                <Input
                  id="reg-username"
                  placeholder="GreenThumb42"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="bg-white/60 border-earth-soft focus:border-garden-green"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-earth-dark">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="gardener@itera.lab"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-white/60 border-earth-soft focus:border-garden-green"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-earth-dark">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Min. 6 chars"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-white/60 border-earth-soft focus:border-garden-green"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm" className="text-earth-dark">Confirm</Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    placeholder="Repeat"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="bg-white/60 border-earth-soft focus:border-garden-green"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-garden-green hover:bg-garden-green/80 text-earth-dark font-bold mt-2"
              >
                Next Step →
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="space-y-2">
                  <Label htmlFor="reg-firstname" className="text-earth-dark">First Name</Label>
                  <Input
                    id="reg-firstname"
                    placeholder="Miles"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="bg-white/60 border-earth-soft focus:border-garden-green"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-lastname" className="text-earth-dark">Last Name</Label>
                  <Input
                    id="reg-lastname"
                    placeholder="Morales"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="bg-white/60 border-earth-soft focus:border-garden-green"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 pb-2">
                <Label htmlFor="reg-dob" className="text-earth-dark">Date of Birth</Label>
                <Input
                  id="reg-dob"
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="bg-white/60 border-earth-soft focus:border-garden-green block w-full"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="w-1/3 border-earth-soft text-earth-dark hover:bg-earth-soft/20"
                >
                  ← Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-garden-green hover:bg-garden-green/80 text-earth-dark font-bold"
                >
                  {loading ? 'Creating garden...' : '🌿 Create Garden'}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-earth-mid border-t border-earth-soft/20 pt-4">
            Already have a garden?{' '}
            <Link to="/login" className="text-garden-wood hover:underline font-medium">
              Sign in →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
