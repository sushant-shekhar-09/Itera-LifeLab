import { Search, Bell, Camera, LogOut, X, Target, Award, Flame, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Experiment, StatsOverview } from '@/types';
import { experimentsAPI } from '@/services/api';

// Helper for dynamic plant image
function getStageImage(progress: number): string {
  if (progress === 0) return '/stage-0.png';
  if (progress <= 30) return '/stage-1.png';
  if (progress <= 70) return '/stage-2.png';
  return '/stage-3.png';
}

function getDaysProgress(exp: Experiment): number {
  if (!exp.duration_days) return 0;
  const completed = exp.completed_days ?? 0;
  return Math.min(Math.round((completed / exp.duration_days) * 100), 100);
}

interface DashboardHeaderProps {
  experiments?: Experiment[];
  stats?: StatsOverview | null;
  currentExperiment?: Experiment | null;
}

export default function DashboardHeader({ experiments = [], stats = null, currentExperiment = null }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Derive page label from current route
  const getPageLabel = () => {
    const path = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Experiment | null>(null);
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [glowColor, setGlowColor] = useState<string>('rgba(139, 163, 126, 0.4)');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    const key = `userAvatar_base64_${user.id}`;
    const savedAvatar = localStorage.getItem(key);
    if (savedAvatar) setAvatarUrl(savedAvatar);
    else setAvatarUrl(null); // Clear avatar if logging into a profile without one
  }, [user?.id]);

  useEffect(() => {
    if (!avatarUrl) {
      setGlowColor('rgba(139, 163, 126, 0.4)'); // Default garden tone
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 50;
      canvas.height = 50;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0, 50, 50);
        const data = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0, count = 0;
        
        // Sum every 4th pixel for performance (stride=16 bytes: RGBA)
        for (let i = 0; i < data.length; i += 16) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        
        // True image structural average
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        
        // Ensure the glow is visibly bright enough to "glow" instead of casting a shadow
        const lux = (r * 0.299 + g * 0.587 + b * 0.114);
        let boost = 0;
        if (lux < 80) boost = 80;
        else if (lux < 130) boost = 40;
        else if (lux > 220) boost = -20; // Slightly dim pure whites
        
        setGlowColor(`rgba(${Math.min(r + boost, 255)}, ${Math.min(g + boost, 255)}, ${Math.min(b + boost, 255)}, 0.8)`);
      }
    };
    img.src = avatarUrl;
  }, [avatarUrl]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user?.id) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Shrink avatar before saving to bypass LocalStorage 5MB Quota, but keep high res
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress heavily using webp to assure < 5MB payload
            const compressedBase64 = canvas.toDataURL('image/webp', 0.85);
            
            try {
              setAvatarUrl(compressedBase64);
              localStorage.setItem(`userAvatar_base64_${user.id}`, compressedBase64);
            } catch (err) {
              console.error('Failed to save avatar to localStorage:', err);
              // Fallback to storing only in memory if browser completely blocks storage
            }
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Dynamic Search Results (filters all active/completed experiments in user's garden)
  const searchResults = experiments.filter(e => 
    searchQuery && e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic Notifications based on today's logs
  const notifications = stats?.today_logs?.map(log => ({
    id: log.id,
    text: log.status === 'completed' 
          ? `🌱 Watered: ${(log as any).experiment_title || 'A plant'}` 
          : `🍂 Missed: ${(log as any).experiment_title || 'A plant'}`,
    time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: log.status
  })) || [];

  return (
    <header className="flex w-full items-center justify-between mb-8 z-20 relative">
      {/* Left: Page Label + Current Experiment */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/40 p-1.5 rounded-full backdrop-blur-sm border border-white/60 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)]">
          <div className="bg-white text-earth-dark shadow-sm rounded-full px-6 h-10 font-medium flex items-center">
            {getPageLabel()}
          </div>
        </div>
        {location.pathname.includes('/analytics') && currentExperiment && (
          <div className="bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/80 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] font-bold text-earth-dark flex items-center gap-2.5 transition-all">
            <div className="w-2.5 h-2.5 rounded-full bg-garden-green shadow-[0_0_8px_rgba(175,209,152,0.8)]"></div>
            {currentExperiment.title}
          </div>
        )}
      </div>

      {/* Right: Search & Profile */}
      <div className="flex items-center gap-4">
        
        {/* Search Bar */}
        <div className="relative group hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-mid group-focus-within:text-earth-dark transition-colors z-[101]" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(e.target.value.length > 0);
            }}
            onFocus={(e) => {
              if (e.target.value.length > 0) setIsSearchOpen(true);
            }}
            placeholder="Search your garden..."
            className="w-64 h-11 pl-10 rounded-full bg-white/60 border border-white/80 focus:bg-white focus:ring-4 focus:ring-garden-green/20 transition-all text-sm placeholder:text-earth-mid shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] outline-none relative z-[101]"
          />
        </div>

        {/* Notifications Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-full bg-white/60 border border-white/80 hover:bg-white transition-all shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] outline-none focus:ring-2 focus:ring-garden-green/30">
              <Bell className="h-5 w-5 text-earth-dark" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 bg-white/95 backdrop-blur-md border border-white/60 shadow-xl rounded-2xl p-4 z-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-earth-dark">Today's Alerts</h4>
            </div>
            <div className="space-y-2">
              {notifications.length > 0 ? notifications.map(n => (
                <div key={n.id} className={`flex justify-between items-start text-sm p-3 rounded-xl transition-colors border border-transparent hover:border-white/40 ${n.status === 'completed' ? 'bg-garden-sage/20 hover:bg-garden-sage/30' : 'bg-destructive/10 hover:bg-destructive/20'}`}>
                  <span className="text-earth-dark font-medium leading-tight">{n.text}</span>
                  <span className="text-xs text-earth-mid mt-0.5 shrink-0 ml-2">{n.time}</span>
                </div>
              )) : (
                <p className="text-sm text-earth-mid text-center py-4">No daily logs created yet.</p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile Avatar Trigger */}
        <button 
          onClick={() => setIsProfileOpen(true)}
          className="rounded-full outline-none focus:ring-2 focus:ring-garden-green/auto transition-shadow"
        >
          <Avatar className="h-11 w-11 border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-105 hover:shadow-lg">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <AvatarFallback className="bg-garden-wood text-white text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
        </button>
      </div>

      {/* Centered Search Modal Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-earth-dark/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => setIsSearchOpen(false)} 
          />
          <div className="relative w-[380px] bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2rem] p-8 flex flex-col items-center animate-in zoom-in-95 duration-200 object-contain overflow-hidden max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="absolute top-5 right-5 text-earth-mid hover:text-earth-dark p-1 rounded-full hover:bg-earth-soft/20 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold text-earth-dark leading-snug mb-6 w-full text-center">
              Plant Search
            </h3>
            <div className="w-full">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map(res => (
                    <div 
                      key={res.id} 
                      onClick={() => {
                        setSelectedPlant(res);
                        setIsSearchOpen(false);
                      }}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-garden-sage/10 hover:bg-garden-sage/30 cursor-pointer transition-colors border border-transparent hover:border-white/50 group/item"
                    >
                      <div className="h-14 w-14 rounded-full bg-garden-green/20 flex items-center justify-center group-hover/item:scale-110 transition-transform shadow-sm overflow-hidden p-2">
                        <img src={getStageImage(getDaysProgress(res))} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-earth-dark">{res.title}</p>
                        <p className="text-sm text-garden-green font-medium">{res.current_streak} day streak • {res.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-earth-mid text-center py-8">No seeds match "{searchQuery}".</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Centered Plant Details Modal (from Search click) */}
      {selectedPlant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-earth-dark/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedPlant(null)} />
          
          <div className="relative w-[340px] sm:w-[400px] bg-garden-parchment border border-white/60 shadow-2xl rounded-[2rem] p-0 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             <button 
                onClick={() => setSelectedPlant(null)}
                className="absolute top-5 right-5 z-20 text-white hover:text-white/80 p-1 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
             >
                <X className="w-5 h-5" />
             </button>

             {/* Top Stage Graphic Header */}
             <div className="relative w-full h-56 bg-gradient-to-t from-garden-parchment to-[#E6EFE1] flex items-end justify-center pt-8">
               <img 
                 src={getStageImage(getDaysProgress(selectedPlant))} 
                 alt="Plant Stage" 
                 className="h-[80%] object-contain drop-shadow-xl z-10 animate-spin-slow-once" 
               />
             </div>

             {/* Details Info */}
             <div className="px-8 pb-8 pt-4 w-full text-center">
                <h3 className="text-3xl font-black text-earth-dark tracking-wide mb-1 break-words leading-tight">{selectedPlant.title}</h3>
                <p className="text-earth-mid text-sm font-medium mb-6 uppercase tracking-widest">{selectedPlant.status} Seed</p>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shadow-inner shrink-0">
                      <Flame className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-earth-mid uppercase leading-tight font-bold tracking-wider">Streak</p>
                      <p className="text-xl font-black text-earth-dark leading-none mt-0.5">{selectedPlant.current_streak}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white">
                    <div className="h-10 w-10 rounded-full bg-garden-wood/20 flex items-center justify-center shadow-inner shrink-0">
                      <Target className="h-5 w-5 text-garden-wood" />
                    </div>
                    <div>
                      <p className="text-[10px] text-earth-mid uppercase leading-tight font-bold tracking-wider">Best</p>
                      <p className="text-xl font-black text-earth-dark leading-none mt-0.5">{selectedPlant.longest_streak}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white">
                    <div className="h-10 w-10 rounded-full bg-garden-green/20 flex items-center justify-center shadow-inner shrink-0">
                       <Award className="h-5 w-5 text-garden-green" />
                    </div>
                    <div>
                      <p className="text-[10px] text-earth-mid uppercase leading-tight font-bold tracking-wider">Progress</p>
                      <p className="text-xl font-black text-earth-dark leading-none mt-0.5">{getDaysProgress(selectedPlant)}<span className="text-sm">%</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center shadow-inner shrink-0">
                       <Calendar className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-earth-mid uppercase leading-tight font-bold tracking-wider">Days</p>
                      <p className="text-xl font-black text-earth-dark leading-none mt-0.5">{selectedPlant.duration_days ?? '∞'}</p>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Centered Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-earth-dark/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsProfileOpen(false)} />
          <div className="relative w-[340px] bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2rem] p-8 flex flex-col items-center animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsProfileOpen(false)} className="absolute top-5 right-5 text-earth-mid hover:text-earth-dark p-1 rounded-full hover:bg-earth-soft/20 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="relative w-28 h-28 mb-5 group cursor-pointer mt-2" onClick={() => fileInputRef.current?.click()}>
              {/* Dynamic Sub-Image Ambient Glow */}
              <div 
                className="absolute inset-[-10px] sm:inset-[-15px] rounded-full blur-[20px] opacity-100 z-0 transition-colors duration-1000 animate-pulse-slow"
                style={{ backgroundColor: glowColor }}
              />

              <Avatar className="w-full h-full border-[6px] border-white shadow-md transition-transform group-hover:scale-105 relative z-10 bg-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-garden-wood text-white text-4xl font-bold">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Camera className="text-white w-7 h-7" />
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarSelect} />
            </div>
            <h3 className="text-2xl font-bold text-earth-dark leading-snug">{user?.username || 'Gardener'}</h3>
            <p className="text-sm text-earth-mid font-medium mb-8">{user?.email || 'user@itera.lab'}</p>
            <div className="w-full space-y-3">
              <Button variant="ghost" onClick={() => { setIsProfileOpen(false); window.location.href = '/settings'; }} className="w-full justify-start text-earth-mid hover:text-earth-dark hover:bg-garden-sage/30 rounded-xl transition-colors h-12 text-base">Settings</Button>
              <Button variant="ghost" className="w-full justify-start text-earth-mid hover:text-earth-dark hover:bg-garden-sage/30 rounded-xl transition-colors h-12 text-base">Contact</Button>
              {user?.email === 'demo@itera.lab' && (
                <Button 
                  variant="ghost" 
                  onClick={async () => {
                     try {
                       setIsProfileOpen(false); // Close modal first
                       await experimentsAPI.resetAll();
                       window.location.reload();
                     } catch (error: any) {
                       console.error('Failed to reset:', error);
                       alert('Failed to reset: ' + (error.response?.data?.error || error.message));
                     }
                  }}
                  className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-xl transition-colors h-12 text-base font-bold"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  Reset Demo Data
                </Button>
              )}
            </div>
            <div className="w-full h-px bg-earth-soft/20 my-6" />
            <Button onClick={() => { setIsProfileOpen(false); logout(); }} variant="destructive" className="w-full bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700 font-bold rounded-xl shadow-sm transition-colors py-6 text-base">
              <LogOut className="w-5 h-5 mr-3" /> Sign Out
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
