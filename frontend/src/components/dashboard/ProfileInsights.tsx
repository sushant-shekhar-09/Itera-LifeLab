import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, Target, Flame, Award } from 'lucide-react';
import type { StatsOverview } from '@/types';

interface ProfileInsightsProps {
  stats: StatsOverview | null;
  user: {
    id?: number;
    username: string;
    first_name?: string;
    last_name?: string;
  } | null;
}

export default function ProfileInsights({ stats, user }: ProfileInsightsProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const key = `userAvatar_base64_${user.id}`;
    
    const loadAvatar = () => {
      const savedAvatar = localStorage.getItem(key);
      if (savedAvatar !== avatarUrl) {
        setAvatarUrl(savedAvatar);
      }
    };
    
    loadAvatar();
    const interval = setInterval(loadAvatar, 1000);
    return () => clearInterval(interval);
  }, [avatarUrl, user?.id]);

  const hasName = user?.first_name && user.first_name.trim().length > 0;
  const fullName = hasName ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'User';
  const displaySubname = hasName ? `@${user?.username}` : '';
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="relative overflow-hidden group bg-garden-parchment/50 border-white/60 shadow-lg h-72 animate-fade-in-up stagger-1 cursor-pointer rounded-[2rem] hover:shadow-xl transition-all">
          {/* Background Avatar Image */}
          <div className="absolute inset-0 z-0 bg-earth-dark">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
            ) : (
              <div className="w-full h-full bg-garden-green/40 flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-110">
                 <span className="text-8xl font-black text-white/40">{initial}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 opacity-70 group-hover:opacity-90" />
          </div>

          {/* Bottom Name ALWAYS visible */}
          <div className="absolute bottom-0 left-0 w-full p-6 z-10 flex flex-col">
            <h3 className="text-3xl font-black text-white tracking-wide drop-shadow-xl leading-tight">{fullName}</h3>
            {displaySubname && (
              <p className="text-white/80 text-sm font-medium mt-0 tracking-wide drop-shadow-md">{displaySubname}</p>
            )}
          </div>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-garden-parchment border-earth-soft/40 p-0 overflow-hidden rounded-[2rem] shadow-2xl">
        <DialogTitle className="sr-only">{fullName}'s Profile Insights</DialogTitle>
        
        {/* Top Header - Image */}
        <div className="bg-earth-dark h-56 relative w-full">
           {avatarUrl ? (
             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full bg-garden-green/60 flex items-center justify-center">
                <span className="text-8xl font-black text-white/60">{initial}</span>
             </div>
           )}
           <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-garden-parchment to-transparent" />
        </div>

        {/* Bottom Details */}
        <div className="px-8 pb-8 pt-2 relative">
          <div className="text-center mb-6">
            <h3 className="text-4xl font-black text-earth-dark tracking-wide">{fullName}</h3>
            {displaySubname && (
              <p className="text-earth-mid text-sm font-bold mt-1 tracking-wide">{displaySubname}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white">
              <div className="h-10 w-10 rounded-full bg-garden-green/20 flex items-center justify-center shadow-inner shrink-0">
                <Target className="h-5 w-5 text-garden-green" />
              </div>
              <div>
                <p className="text-[10px] text-earth-mid uppercase leading-tight font-bold tracking-wider">Active Seeds</p>
                <p className="text-xl font-black text-earth-dark leading-none mt-0.5">{stats?.active_experiments ?? 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shadow-inner shrink-0">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] text-earth-mid uppercase leading-tight font-bold tracking-wider">Best Streak</p>
                <p className="text-xl font-black text-earth-dark leading-none mt-0.5">{stats?.best_streak ?? 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white">
              <div className="h-10 w-10 rounded-full bg-garden-wood/20 flex items-center justify-center shadow-inner shrink-0">
                <TrendingUp className="h-5 w-5 text-garden-wood" />
              </div>
              <div>
                <p className="text-[10px] text-earth-mid uppercase leading-tight font-bold tracking-wider">Today Logs</p>
                <p className="text-xl font-black text-earth-dark leading-none mt-0.5">{stats?.today_logs?.length ?? 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white">
              <div className="h-10 w-10 rounded-full bg-garden-sage flex items-center justify-center shadow-inner shrink-0">
                <Award className="h-5 w-5 text-earth-dark" />
              </div>
              <div>
                <p className="text-[10px] text-earth-mid uppercase leading-tight font-bold tracking-wider">Completed</p>
                <p className="text-xl font-black text-earth-dark leading-none mt-0.5">{stats?.completed_experiments ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
