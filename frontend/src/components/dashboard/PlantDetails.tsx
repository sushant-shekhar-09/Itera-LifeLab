import { Card } from '@/components/ui/card';
import { Target, Clock, Zap, Target as GoalIcon } from 'lucide-react';
import type { Experiment } from '@/types';

interface PlantDetailsProps {
  experiment: Experiment | null;
}

export function PlantDetails({ experiment }: PlantDetailsProps) {
  
  // Calculations
  const totalLogs = experiment?.total_logged_days ?? 0;
  const completed = experiment?.completed_days ?? 0;
  const misses = Math.max(0, totalLogs - completed);
  const duration = experiment?.duration_days ?? 30;

  const consistencyScore = totalLogs > 0 ? Math.round((completed / totalLogs) * 100) : 0;
  const dropRate = totalLogs > 0 ? (misses / totalLogs) * 100 : 0;
  
  let frictionLevel = 'Low';
  let frictionSubtext = 'Smooth habit';
  if (dropRate > 30) {
     frictionLevel = 'High';
     frictionSubtext = 'Resistance detected';
  } else if (dropRate > 10) {
     frictionLevel = 'Med';
     frictionSubtext = 'Occasional skips';
  }

  const items = [
    {
      icon: Target,
      label: 'Consistency Score',
      value: `${consistencyScore}%`,
      subtext: 'of days completed',
      iconColor: 'text-garden-green'
    },
    {
      icon: Clock,
      label: 'Avg Time Invested',
      value: 'N/A',
      subtext: 'Coming soon',
      iconColor: 'text-orange-300'
    },
    {
      icon: Zap,
      label: 'Friction Level',
      value: frictionLevel,
      subtext: frictionSubtext,
      iconColor: frictionLevel === 'High' ? 'text-destructive' : 'text-earth-dark'
    },
    {
      icon: GoalIcon,
      label: 'Goal Alignment',
      value: `${completed} / ${duration}`,
      subtext: 'days planned',
      iconColor: 'text-blue-500'
    }
  ];

  if (!experiment) {
    return (
      <Card className="h-full w-full bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-[2rem] p-6 flex flex-col opacity-50">
         <h3 className="text-lg font-bold text-earth-dark mb-4 drop-shadow-sm flex items-center justify-between">
          Track Insights
         </h3>
         <div className="flex-1 flex items-center justify-center">
             <p className="text-earth-mid font-medium text-sm">Select a seed to view insights.</p>
         </div>
      </Card>
    );
  }

  return (
    <Card className="h-full w-full bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-[2rem] p-6 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <div className="h-8 w-8 bg-white rounded-full shadow-sm flex items-center justify-center">
          <span className="text-earth-dark text-lg leading-none mt-1 hover:text-garden-green transition-colors cursor-pointer">↗</span>
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-earth-dark drop-shadow-sm mb-1">
        Track Insights
      </h3>
      <p className="text-xs text-earth-mid font-medium mb-4">Real-time habit conditions.</p>
      
      <div className="grid grid-cols-2 gap-3 h-full">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white/80 rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-white flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${item.iconColor}`} />
                <p className="text-[10px] font-bold text-earth-mid uppercase tracking-wider">{item.label}</p>
              </div>
              <p className="text-xl font-black text-earth-dark leading-none">{item.value}</p>
              <p className="text-[11px] text-earth-mid font-medium mt-1">{item.subtext}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
