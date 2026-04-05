import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Flame, Droplets, Target, Sprout } from 'lucide-react';
import type { Experiment } from '@/types';

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

interface PlantHeroProps {
  experiment: Experiment | null;
  onNext: () => void;
  onPrev: () => void;
  onLogEntry: (experimentId: number, status: 'completed' | 'missed') => Promise<void>;
  totalActive: number;
  currentIndex: number;
}

export function PlantHero({ experiment, onNext, onPrev, onLogEntry, totalActive, currentIndex }: PlantHeroProps) {
  if (!experiment) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 h-full min-h-0">
        <p className="text-8xl mb-6 opacity-80">🪴</p>
        <p className="text-earth-dark font-black text-2xl tracking-tight">No active seeds.</p>
        <p className="text-earth-mid font-medium mt-2">Plant a seed to analyze your growth.</p>
      </div>
    );
  }

  const progress = getDaysProgress(experiment);
  const completed = Number(experiment.completed_days ?? 0);
  const totalLogged = Number(experiment.total_logged_days ?? 0);
  const missedDays = Math.max(0, totalLogged - completed);

  // Completion Rate = completed days / total duration (same formula as Active Seeds progress)
  // e.g. 3 days completed out of 30 day experiment = 10%
  const completionRate = experiment.duration_days
    ? Math.min(100, Math.round((completed / experiment.duration_days) * 100))
    : 0;

  // Drop Rate = missed / total logged days (how often you miss when you DO log)
  // Shows 0% if no logs yet
  const dropRate = totalLogged > 0
    ? Math.min(100, Math.round((missedDays / totalLogged) * 100))
    : 0;

  return (
    <div className="w-full h-full flex flex-col min-h-0 relative">
      
      {/* Top Section: Navigation & Title Layout (Handled in Header mostly, but we add local context here if needed) */}
      <div className="absolute top-0 right-0 z-30 flex gap-2">
         {totalActive > 1 && (
           <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md rounded-full shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] p-1 border border-white/60">
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white text-earth-dark" onClick={onPrev}>
               <ChevronLeft className="h-4 w-4" />
             </Button>
             <span className="text-xs font-bold text-earth-dark px-2">
               {currentIndex + 1} / {totalActive}
             </span>
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white text-earth-dark" onClick={onNext}>
               <ChevronRight className="h-4 w-4" />
             </Button>
           </div>
         )}
      </div>

      <div className="absolute top-0 left-0 z-10 w-2/3 pointer-events-none">
        <h2 className="text-4xl sm:text-5xl font-black text-earth-dark tracking-tighter leading-[1.1] drop-shadow-sm break-words">
          {experiment.title}
        </h2>
        <p className="text-earth-mid font-medium mt-3 text-lg leading-relaxed max-w-sm">
          {experiment.description || "N/A"}
        </p>
      </div>

      {/* Main Center Image */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none pt-16">
        <div className="relative w-full h-[85%] flex items-center justify-center">
           {/* Abstract Glowing Rings behind plant */}
           <div className="absolute inset-0 flex items-center justify-center transform -translate-y-8 -translate-x-12 opacity-40">
              <div className="w-[300px] h-[300px] rounded-full border-[1.5px] border-white/80 shadow-[0_0_40px_rgba(255,255,255,0.8)] backdrop-blur-[2px]"></div>
           </div>
           
           <img 
             src={getStageImage(progress)} 
             alt="Plant Stage" 
             className="max-h-full max-w-full min-h-0 object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)] animate-spin-slow-once z-10 mb-12 mr-20" 
             key={experiment.id} // Re-animate when switching plants
           />
        </div>
      </div>

      {/* Floating Badges */}
      <div className="absolute z-20 top-[35%] right-[5%] animate-fade-in-up stagger-1">
         <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-earth-mid ml-2">Completion</span>
            <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white shadow-sm flex items-center gap-2">
               <Target className="h-4 w-4 text-garden-green" />
               <span className="font-bold text-xl text-earth-dark">{completionRate}%</span>
            </div>
         </div>
      </div>

      <div className="absolute z-20 bottom-[15%] left-[10%] animate-fade-in-up stagger-2">
         <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-earth-mid ml-2">Drop Rate</span>
            <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white shadow-sm flex items-center gap-2">
               <Droplets className="h-4 w-4 text-orange-500" />
               <span className="font-bold text-xl text-earth-dark">{dropRate}%</span>
            </div>
         </div>
      </div>

      <div className="absolute z-20 bottom-[20%] right-[10%] animate-fade-in-up stagger-3">
         <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-earth-mid mr-2">Streak</span>
            <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white shadow-sm flex items-center gap-2">
               <span className="font-bold text-xl text-earth-dark">{experiment.current_streak}</span>
               <Flame className="h-4 w-4 text-orange-500" />
            </div>
         </div>
      </div>

      {/* Action Area at very bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center z-30">
        {(() => {
          // Don't show action buttons for non-active experiments
          if (experiment.status !== 'active') {
            return (
              <div className="bg-white/60 backdrop-blur-xl px-6 py-3 rounded-full shadow-sm border border-white flex items-center gap-2 text-earth-mid text-sm font-medium capitalize">
                {experiment.status === 'abandoned' && '🍂'}
                {experiment.status === 'completed' && '✅'}
                {experiment.status === 'paused' && '⏸️'}
                {experiment.status}
              </div>
            );
          }

          const _n = new Date();
          const todayStr = `${_n.getFullYear()}-${String(_n.getMonth()+1).padStart(2,'0')}-${String(_n.getDate()).padStart(2,'0')}`;
          const sd = new Date(experiment.start_date);
          const startStr = `${sd.getFullYear()}-${String(sd.getMonth()+1).padStart(2,'0')}-${String(sd.getDate()).padStart(2,'0')}`;
          const hasStarted = startStr <= todayStr;

          if (!hasStarted) {
            return (
              <div className="bg-white/60 backdrop-blur-xl px-6 py-3 rounded-full shadow-sm border border-white flex items-center gap-2 text-earth-mid text-sm font-medium">
                <Sprout className="w-4 h-4 text-garden-green" />
                Starts on {new Date(experiment.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            );
          }

          return (
            <div className="bg-white/60 backdrop-blur-xl p-2 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-white flex gap-2 w-full max-w-[300px]">
               <Button 
                 className="flex-1 rounded-full bg-garden-green hover:bg-garden-green/90 text-white font-bold h-12 shadow-sm text-base"
                 onClick={(e) => { e.stopPropagation(); onLogEntry(experiment.id, 'completed'); }}
               >
                 <Sprout className="w-5 h-5 mr-2" /> Water
               </Button>
               <Button 
                 variant="outline"
                 className="flex-[0.5] rounded-full text-destructive border-white bg-white/80 hover:bg-destructive/10 font-bold h-12"
                 onClick={(e) => { e.stopPropagation(); onLogEntry(experiment.id, 'missed'); }}
               >
                 Missed
               </Button>
            </div>
          );
        })()}
      </div>

    </div>
  );
}
