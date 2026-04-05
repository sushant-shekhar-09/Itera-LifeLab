import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Trophy, Calendar } from 'lucide-react';
import type { StatsOverview, Experiment } from '@/types';

interface TodayContentProps {
  stats: StatsOverview | null;
  experiments: Experiment[];
}

export default function TodayContent({ stats, experiments }: TodayContentProps) {
  const todayLogs = stats?.today_logs ?? [];
  const completedToday = todayLogs.filter(l => l.status === 'completed').length;
  
  // Find active experiments that DO NOT have a log entry for today AND have started
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const pendingExperiments = experiments.filter(e => {
    if (e.status !== 'active') return false;
    if (todayLogs.some(log => log.experiment_id === e.id)) return false;
    // Only show if the experiment has already started (local timezone)
    const sd = new Date(e.start_date);
    const startStr = `${sd.getFullYear()}-${String(sd.getMonth()+1).padStart(2,'0')}-${String(sd.getDate()).padStart(2,'0')}`;
    return startStr <= todayStr;
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card className="bg-[#788B77] text-white border-white/20 animate-fade-in-up stagger-2 rounded-3xl h-72 flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3 border-b border-white/10 shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2 drop-shadow-sm">
              <Calendar className="h-5 w-5 opacity-80" />
              Today's Field
            </CardTitle>
            <p className="text-sm text-white/70 mt-1">{dateStr}</p>
          </div>
          {/* <Badge className="bg-[#A1ED5B]/20 text-[#A1ED5B] border-[#A1ED5B]/30 hover:bg-[#A1ED5B]/30 gap-1 font-bold">
            <Trophy className="h-3.5 w-3.5" />
            {completedToday} Wins
          </Badge> */}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
        {pendingExperiments.length > 0 ? (
          <div>
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Needs Water</h4>
            <ul className="space-y-3">
              {pendingExperiments.map(exp => (
                <li key={exp.id} className="flex items-center text-sm font-medium bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-colors border border-white/5 shadow-inner cursor-default">
                  <div className="h-8 w-8 rounded-full bg-[#A1ED5B]/20 flex items-center justify-center mr-3 shrink-0">
                    <Droplets className="h-4 w-4 text-[#A1ED5B]" />
                  </div>
                  <span className="truncate">{exp.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/70">
            <p className="font-bold text-lg text-white">All Clear!</p>
            <p className="text-sm">Every seed has been tended to today.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
