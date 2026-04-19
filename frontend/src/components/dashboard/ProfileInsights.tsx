import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Sprout, Flame, Trophy, Award } from 'lucide-react';
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

// Extract dominant color from an image URL via canvas sampling
function useDominantColor(imageUrl: string | null): { solid: string; soft: string } {
  const [colors, setColors] = useState({ solid: 'rgb(236, 202, 156)', soft: 'rgb(244, 235, 225)' });

  useEffect(() => {
    if (!imageUrl) {
      setColors({ solid: 'rgb(236, 202, 156)', soft: 'rgb(244, 235, 225)' });
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0, 64, 64);
        const data = ctx.getImageData(0, 0, 64, 64).data;

        // Find the most vibrant (saturated) color instead of averaging all pixels.
        // Simple average produces muddy gray for colorful images.
        let bestR = 128, bestG = 128, bestB = 128;
        let bestScore = -1;

        // Bucket pixels into 4x4x4 color bins, score each by saturation * count
        const bins = new Map<string, { r: number; g: number; b: number; count: number; satSum: number }>();

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];

          // Skip near-black and near-white pixels (backgrounds, borders)
          const lum = r * 0.299 + g * 0.587 + b * 0.114;
          if (lum < 25 || lum > 235) continue;

          // Quantize to 4-bit bins (16 levels per channel)
          const qr = (r >> 4) << 4;
          const qg = (g >> 4) << 4;
          const qb = (b >> 4) << 4;
          const key = `${qr},${qg},${qb}`;

          // Saturation: max(r,g,b) - min(r,g,b) normalized
          const mx = Math.max(r, g, b);
          const mn = Math.min(r, g, b);
          const sat = mx > 0 ? (mx - mn) / mx : 0;

          const bin = bins.get(key);
          if (bin) {
            bin.r += r; bin.g += g; bin.b += b;
            bin.count++;
            bin.satSum += sat;
          } else {
            bins.set(key, { r, g, b, count: 1, satSum: sat });
          }
        }

        // Score: prefer bins with high saturation AND reasonable count
        bins.forEach(bin => {
          const avgSat = bin.satSum / bin.count;
          const score = avgSat * Math.sqrt(bin.count); // saturation weighted by coverage
          if (score > bestScore) {
            bestScore = score;
            bestR = Math.round(bin.r / bin.count);
            bestG = Math.round(bin.g / bin.count);
            bestB = Math.round(bin.b / bin.count);
          }
        });

        // Brighten dark results so the background isn't too dim
        const lux = bestR * 0.299 + bestG * 0.587 + bestB * 0.114;
        let boost = 0;
        if (lux < 80) boost = 70;
        else if (lux < 130) boost = 35;

        const sr = Math.min(bestR + boost, 255);
        const sg = Math.min(bestG + boost, 255);
        const sb = Math.min(bestB + boost, 255);

        // Soft pastel: 60% white + 40% vibrant color
        const softR = Math.round(255 * 0.6 + sr * 0.4);
        const softG = Math.round(255 * 0.6 + sg * 0.4);
        const softB = Math.round(255 * 0.6 + sb * 0.4);

        setColors({
          solid: `rgb(${sr}, ${sg}, ${sb})`,
          soft: `rgb(${softR}, ${softG}, ${softB})`,
        });
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  return colors;
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

  const { soft: softBgColor } = useDominantColor(avatarUrl);

  const hasName = user?.first_name && user.first_name.trim().length > 0;
  const fullName = hasName ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'User';
  const displaySubname = hasName ? `@${user?.username}` : '';
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  // Compute achievement values
  const completionRate = stats
    ? (stats.total_experiments > 0
      ? Math.round((stats.completed_experiments / stats.total_experiments) * 100)
      : 0)
    : 0;

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

      <DialogContent className="sm:max-w-md border-earth-soft/40 p-0 overflow-hidden rounded-[2rem] shadow-2xl !bg-transparent">
        <div style={{ backgroundColor: softBgColor }} className="rounded-[2rem] overflow-hidden">
        <DialogTitle className="sr-only">{fullName}'s Achievements</DialogTitle>
        {/* Top Header - Image with dynamic color fade */}
        <div className="bg-earth-dark h-56 relative w-full">
           {avatarUrl ? (
             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full bg-garden-green/60 flex items-center justify-center">
                <span className="text-8xl font-black text-white/60">{initial}</span>
             </div>
           )}
           {/* Dynamic gradient fade — seamlessly blends photo into background */}
           <div
             className="absolute inset-x-0 bottom-0 h-16"
             style={{
               background: `linear-gradient(to top, ${softBgColor}, transparent)`,
             }}
           />
        </div>

        {/* Achievements Section */}
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
                <Sprout className="h-5 w-5 text-garden-green" />
              </div>
              <div>
                <p className="text-[10px] text-earth-mid uppercase leading-tight font-bold tracking-wider">Seeds Planted</p>
                <p className="text-xl font-black text-earth-dark leading-none mt-0.5">{stats?.total_experiments ?? 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shadow-inner shrink-0">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] text-earth-mid uppercase leading-tight font-bold tracking-wider">Best Streak</p>
                <p className="text-xl font-black text-earth-dark leading-none mt-0.5">{stats?.best_streak ?? 0}<span className="text-xs font-bold text-earth-mid ml-1">days</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shadow-inner shrink-0">
                <Trophy className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-earth-mid uppercase leading-tight font-bold tracking-wider">Completion Rate</p>
                <p className="text-xl font-black text-earth-dark leading-none mt-0.5">{completionRate}<span className="text-xs font-bold text-earth-mid ml-0.5">%</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white">
              <div className="h-10 w-10 rounded-full bg-garden-sage flex items-center justify-center shadow-inner shrink-0">
                <Award className="h-5 w-5 text-earth-dark" />
              </div>
              <div>
                <p className="text-[10px] text-earth-mid uppercase leading-tight font-bold tracking-wider">Seeds Completed</p>
                <p className="text-xl font-black text-earth-dark leading-none mt-0.5">{stats?.completed_experiments ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
