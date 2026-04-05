import { Sprout } from 'lucide-react';

interface WelcomeBannerProps {
  username: string;
  activeSeeds: number;
}

export default function WelcomeBanner({ username, activeSeeds }: WelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-garden-green/40 via-garden-sage/60 to-earth-cream p-6 border border-earth-soft/40 animate-fade-in-up">
      {/* Decorative floating elements */}
      <div className="absolute top-3 right-8 text-3xl animate-float opacity-60">🌿</div>
      <div className="absolute bottom-2 right-24 text-2xl animate-sway opacity-40">🍃</div>
      <div className="absolute top-6 right-44 text-xl animate-float stagger-2 opacity-30">✨</div>

      <div className="relative z-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-earth-dark">
          Welcome back, <span className="text-garden-wood">{username}</span>
        </h1>
        <div className="flex items-center gap-2 mt-2 text-earth-mid">
          <Sprout className="h-5 w-5 text-garden-green" />
          <p className="text-base">
            You have <span className="font-bold text-earth-dark">{activeSeeds}</span> active seed{activeSeeds !== 1 ? 's' : ''} today
          </p>
        </div>
      </div>
    </div>
  );
}
