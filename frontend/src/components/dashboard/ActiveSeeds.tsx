import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sprout } from 'lucide-react';
import type { Experiment } from '@/types';

interface ActiveSeedsProps {
  experiments: Experiment[];
  onLogEntry: (experimentId: number, status: 'completed' | 'missed') => void;
}

function getDaysProgress(exp: Experiment): number {
  if (!exp.duration_days) return 0;
  const completed = exp.completed_days ?? 0;
  return Math.min(Math.round((completed / exp.duration_days) * 100), 100);
}

// Image stage logic based on completion percentage
function getStageImage(progress: number): string {
  if (progress === 0) return '/stage-0.png';
  if (progress <= 30) return '/stage-1.png';
  if (progress <= 70) return '/stage-2.png';
  return '/stage-3.png';
}

export default function ActiveSeeds({ experiments, onLogEntry }: ActiveSeedsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const _now = new Date();
  const todayStr = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`;
  const activeExps = experiments.filter(e => {
    if (e.status !== 'active') return false;
    const sd = new Date(e.start_date);
    const startStr = `${sd.getFullYear()}-${String(sd.getMonth()+1).padStart(2,'0')}-${String(sd.getDate()).padStart(2,'0')}`;
    return startStr <= todayStr;
  });

  const goNext = useCallback(() => {
    if (activeExps.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % activeExps.length);
  }, [activeExps.length]);

  const goPrev = useCallback(() => {
    if (activeExps.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + activeExps.length) % activeExps.length);
  }, [activeExps.length]);

  // Auto-swipe unless stopped by hover
  useEffect(() => {
    if (activeExps.length <= 1 || isHovered) return;
    const interval = setInterval(goNext, 5000);
    return () => clearInterval(interval);
  }, [goNext, activeExps.length, isHovered]);

  if (activeExps.length === 0) {
    return (
      <Card className="absolute inset-0 bg-[#E6EFE1] border-white/60 animate-fade-in-up stagger-2 rounded-[2rem] flex flex-col items-center justify-center text-center p-8 shadow-sm">
        <p className="text-6xl mb-4">🪴</p>
        <p className="text-earth-dark font-bold text-lg">No active seeds yet.</p>
        <p className="text-earth-mid text-sm mt-1">Plant your first seed to get started!</p>
      </Card>
    );
  }

  const current = activeExps[currentIndex];
  const progress = getDaysProgress(current);
  const stageImage = getStageImage(progress);

  return (
    <Card 
      className="absolute inset-0 bg-[#E6EFE1] overflow-hidden group rounded-[2rem] border-white/60 shadow-md animate-fade-in-up stagger-2 transition-shadow hover:shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic Plant Image (Centered & absolutely positioned, pulled upwards) */}
      <div className={`absolute inset-0 z-0 flex items-center justify-center -translate-y-4 sm:-translate-y-8 pointer-events-none transition-all duration-700 ease-out ${isHovered ? 'scale-[1.05] -translate-y-10 sm:-translate-y-16' : ''}`}>
        <img 
          src={stageImage} 
          alt={`Plant Stage at ${progress}%`}
          key={stageImage}
          className="h-[60%] sm:h-[70%] object-contain drop-shadow-2xl animate-spin-slow-once" 
        />
      </div>

      {/* Top Header (Absolute top) */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/50 shadow-sm flex items-center gap-2">
          <Sprout className="h-4 w-4 text-garden-green" />
          <span className="font-bold text-earth-dark text-sm">Active Seeds</span>
        </div>

        <div className="bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 text-earth-dark font-bold text-sm flex gap-1 shadow-inner">
          <span>{currentIndex + 1}</span>
          <span className="opacity-60">/</span>
          <span className="opacity-80">{activeExps.length}</span>
        </div>
      </div>

      {/* Manual Controls (Sides) */}
      {activeExps.length > 1 && (
        <div className="absolute inset-y-0 left-0 w-full z-20 flex justify-between items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 bg-white/40 hover:bg-white/90 text-earth-dark border border-white/60 shadow-lg rounded-full backdrop-blur-sm pointer-events-auto mb-20"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 bg-white/40 hover:bg-white/90 text-earth-dark border border-white/60 shadow-lg rounded-full backdrop-blur-sm pointer-events-auto mb-20"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Bottom Display (Absolute bottom, overlays gracefully without squishing) */}
      <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-white/30 backdrop-blur-md rounded-b-[2rem] border-t border-white/30 pointer-events-auto transition-colors duration-500 hover:bg-white/50">
         <div className="flex justify-between items-end">
           <div className="flex-1 pr-4">
             {/* Name unconditionally visible and wraps elegantly */}
             <h3 className="text-2xl sm:text-3xl font-black text-earth-dark drop-shadow-sm leading-none m-0 p-0 break-words">{current.title}</h3>
           </div>
           {/* Streak badge */}
           {/* <div className="bg-orange-50 px-3 py-1.5 rounded-xl flex items-center gap-1 border border-orange-100 shadow-inner shrink-0">
               <Flame className="h-5 w-5 text-orange-500" />
               <span className="font-bold text-orange-600 text-lg">{current.current_streak}</span>
           </div> */}
         </div>

         {/* Expandable details on hover */}
         <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isHovered ? 'max-h-[200px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0 pointer-events-none'}`}>
            <div className="flex flex-col gap-4">
              
              <div className="w-full bg-white/60 p-3 rounded-xl border border-white/50">
                <div className="flex justify-between text-[11px] font-bold text-earth-mid uppercase tracking-wider mb-2">
                  <span>Growth: {progress}%</span>
                  <span>{current.completed_days ?? 0} / {current.duration_days} Days</span>
                </div>
                <div className="w-full bg-earth-soft/20 rounded-full h-2.5 overflow-hidden shadow-inner border border-white/30">
                  <div className="h-full bg-garden-green rounded-full transition-all duration-1000 relative" style={{ width: `${progress}%` }}>
                     <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-garden-green hover:bg-garden-green/90 text-white font-bold h-11 rounded-xl shadow-md text-base" onClick={(e) => { e.stopPropagation(); onLogEntry(current.id, 'completed'); }}>
                   <Sprout className="h-5 w-5 mr-2" /> Water
                </Button>
                <Button variant="outline" className="px-6 border-destructive/20 text-destructive hover:bg-destructive/10 h-11 rounded-xl font-bold" onClick={(e) => { e.stopPropagation(); onLogEntry(current.id, 'missed'); }}>
                   Missed
                </Button>
              </div>
              
            </div>
         </div>
      </div>
    </Card>
  );
}
