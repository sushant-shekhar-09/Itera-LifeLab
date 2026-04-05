import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';
import { logsAPI } from '@/services/api';
import type { Experiment, StatsOverview, DailyLog } from '@/types';

interface ActivityPatternProps {
  experiment: Experiment | null;
  stats: StatsOverview | null;
}

export function ActivityPattern({ experiment }: ActivityPatternProps) {
  const [logs, setLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    if (!experiment) return;
    const fetchLogs = async () => {
      try {
        const res = await logsAPI.list(experiment.id);
        setLogs(res.data.logs);
      } catch (err) {
         console.error('Failed to fetch logs for insights', err);
      }
    };
    fetchLogs();
  }, [experiment]);

  const { chartData, peakInsight } = useMemo(() => {
    if (!experiment || logs.length === 0) {
      return { chartData: [], peakInsight: "Water your seed to detect your rhythm!" };
    }

    // Initialize 24-hour buckets
    const hours = Array.from({ length: 24 }).map((_, i) => ({
      hour: i,
      label: i === 0 ? '12am' : i < 12 ? i + 'am' : i === 12 ? '12pm' : (i - 12) + 'pm',
      count: 0
    }));

    logs.forEach(log => {
      const d = new Date(log.created_at);
      if (log.status === 'completed') {
        hours[d.getHours()].count += 1;
      }
    });

    const blockData = [
      { label: 'Night', count: hours.slice(0,6).reduce((a,b)=>a+b.count,0) },
      { label: 'Morning', count: hours.slice(6,12).reduce((a,b)=>a+b.count,0) },
      { label: 'Afternoon', count: hours.slice(12,18).reduce((a,b)=>a+b.count,0) },
      { label: 'Evening', count: hours.slice(18,24).reduce((a,b)=>a+b.count,0) },
    ];

    let peakHour = hours[0];
    hours.forEach(h => {
      if (h.count > peakHour.count) peakHour = h;
    });

    const peakInsight = "You are most consistent around " + peakHour.label + ".";

    return { chartData: blockData, peakInsight };
  }, [experiment, logs]);

  if (!experiment) {
     return (
       <Card className="h-[250px] w-full bg-white/60 backdrop-blur-md rounded-[2rem] p-6 opacity-50 border border-white shrink-0" />
     );
  }

  return (
    <Card className="h-[250px] shrink-0 w-full bg-[#534340] border-white/20 shadow-lg rounded-[2rem] p-5 flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div>
          <h3 className="text-white font-bold text-lg mb-0.5">Habit Rhythm</h3>
          <p className="text-white/70 text-xs font-medium">Time-of-day activity frequency.</p>
        </div>
      </div>

      <div className="flex-1 mt-2 min-h-0 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }} 
              dy={5}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.1)' }}
              contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.9)', color: '#534340' }}
              itemStyle={{ color: '#5E8B4E', fontWeight: 'bold' }}
              formatter={(value: any) => [value + ' logs', 'Frequency']}
            />
            <Bar dataKey="count" fill="#AFD198" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-xl flex items-center gap-3 relative z-10 shrink-0">
         <div className="bg-[#afd198]/20 p-2 rounded-full shrink-0">
            <Clock className="w-4 h-4 text-[#afd198]" />
         </div>
         <p className="text-white/90 text-xs font-medium leading-relaxed italic">
           "{peakInsight}"
         </p>
      </div>

      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-garden-green/20 blur-[50px] rounded-full z-0 pointer-events-none" />
    </Card>
  );
}
