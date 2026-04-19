import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Sprout, ArrowRight, Leaf, BarChart3, Bell } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  // When opened from sidebar logo (?landing=1), always show Sign In / Register
  const isFreshLanding = searchParams.get('landing') === '1';
  const showDashboardLink = user && !isFreshLanding;

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-b from-earth-cream via-garden-sage/30 to-earth-cream">
      {/* Top Navigation */}
      <nav className="w-full px-12 pt-4 flex items-center justify-end">
        <div className="flex gap-3 items-center">
          {showDashboardLink ? (
            <Link to="/dashboard">
              <Button size="default" className="bg-garden-green hover:bg-garden-green/80 text-earth-dark gap-2 shadow-lg hover:shadow-xl transition-all">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button size="default" variant="outline" className="border-earth-soft text-earth-dark gap-4 hover:bg-garden-sage/40">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="default" className="bg-garden-green hover:bg-garden-green/80 text-earth-dark shadow-lg hover:shadow-xl transition-all">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-10 text-center">
        {/* Logo */}
        <div className="mb-4 animate-fade-in-up">
          <Logo className="h-24 w-auto mx-auto mb-2" />
        </div>

        {/* Floating decorations */}
        <div className="relative">
          <span className="absolute -top-8 left-1/4 text-4xl animate-float opacity-40">🌿</span>
          <span className="absolute -top-4 right-1/4 text-3xl animate-sway opacity-30">🍃</span>
          <span className="absolute top-8 right-1/3 text-2xl animate-float stagger-3 opacity-20">✨</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-earth-dark mb-3 animate-fade-in-up stagger-1">
          Grow Habits,<br />
          <span className="text-garden-green">Cultivate Life</span>
        </h1>
        <p className="text-lg sm:text-xl text-earth-mid max-w-2xl mx-auto mb-4 animate-fade-in-up stagger-2">
          Track experiments, nurture daily rituals, and watch your personal garden flourish.
          Every completed habit is a seed that grows into something beautiful.
        </p>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Sprout,
              title: 'Plant Seeds',
              desc: 'Create experiments and habits. Each one is a seed in your personal garden.',
            
            },
            {
              icon: BarChart3,
              title: 'Track Growth',
              desc: 'Log daily completions, build streaks, and watch your plants evolve.',
            
            },
            {
              icon: Bell,
              title: 'Stay Motivated',
              desc: 'Get celebratory or gentle nudge notifications to keep you on track.',
            
            },
          ].map((feature, idx) => (
            <div
              key={feature.title}
              className={`p-4 rounded-2xl bg-garden-parchment/40 border border-earth-soft/30 text-center hover:shadow-lg hover:-translate-y-1 transition-all animate-fade-in-up stagger-${idx + 1}`}
            >
              <div className="h-10 w-10 mx-auto mb-3 rounded-xl bg-garden-green/20 flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-garden-green" />
              </div>
              <h3 className="text-lg font-bold text-earth-dark mb-2">{feature.title}</h3>
              <p className="text-sm text-earth-mid">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-3 text-xs text-earth-mid border-t border-earth-soft/30 mt-auto">
        <div className="flex items-center justify-center gap-1">
          <Leaf className="h-3 w-3 text-garden-green" />
          <span>Itera LifeLab — Grow through life, one experiment at a time.</span>
        </div>
      </footer>
    </div>
  );
}
