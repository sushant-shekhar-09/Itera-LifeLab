import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { logsAPI } from '@/services/api';
import type { Experiment, StatsOverview, DailyLog } from '@/types';

interface GrowthAnalysisProps {
  experiment: Experiment | null;
  stats: StatsOverview | null;
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function GrowthAnalysis({ experiment }: GrowthAnalysisProps) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'duration'>('month');

  useEffect(() => {
    if (!experiment) return;
    const fetchLogs = async () => {
      try {
        const res = await logsAPI.list(experiment.id);
        setLogs(res.data.logs);
      } catch (err) {
         console.error('Failed to fetch logs for chart', err);
      }
    };
    fetchLogs();
  }, [experiment]);

  const chartData = useMemo(() => {
    if (!experiment) return [];

    let daysToShow = 7;
    if (timeframe === 'month') daysToShow = 30;
    if (timeframe === 'duration') daysToShow = experiment.duration_days || 30;

    // Build a lookup map from log_date string → status
    const logMap = new Map<string, string>();
    logs.forEach(l => {
      const logD = new Date(l.log_date);
      const key = toLocalDateStr(logD);
      logMap.set(key, l.status);
    });

    const data = [];
    let cumCompleted = 0;
    let cumTotal = 0;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = toLocalDateStr(d);

      const dayLabel = timeframe === 'week' 
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const status = logMap.get(dateKey) || 'none';

      // Track cumulative stats for running completion rate
      if (status !== 'none') {
        cumTotal++;
        if (status === 'completed') cumCompleted++;
      }

      // "growth" value: spike on water, dip on miss, neutral for unlogged
      // Scale: completed = 100, missed = 10, none = previous value or 50
      let growth: number;
      if (status === 'completed') {
        growth = 100;
      } else if (status === 'missed') {
        growth = 10;
      } else {
        // No log for this day: show at midpoint (flat line)
        growth = data.length > 0 ? Math.max(30, (data[data.length - 1].growth ?? 50) * 0.85) : 50;
      }

      // Running completion rate (cumulative over the visible window)
      const runningRate = cumTotal > 0 ? Math.round((cumCompleted / cumTotal) * 100) : 0;

      data.push({
        date: dateKey,
        label: dayLabel,
        growth,
        rate: runningRate,
        status,
        isStreak: status === 'completed',
        isMiss: status === 'missed'
      });
    }

    return data;
  }, [experiment, logs, timeframe]);

  // Custom DOT renderer
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isStreak) {
      return (
        <circle cx={cx} cy={cy} r={5} fill="#5E8B4E" stroke="#fff" strokeWidth={2} />
      );
    }
    if (payload.isMiss) {
      return (
        <circle cx={cx} cy={cy} r={5} fill="#EF4444" stroke="#fff" strokeWidth={2} />
      );
    }
    return <circle cx={cx} cy={cy} r={2} fill="#BB9981" />;
  };

  return (
    <Card className="h-full w-full bg-gradient-to-br from-[#dcefb9]/60 to-[#c9e19d]/40 border-white/60 shadow-inner rounded-[2rem] overflow-hidden flex flex-col pt-6 px-6 pb-2 relative">
      <div className="flex justify-between items-center mb-4 z-10 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-earth-dark flex items-center gap-2">
            Growth Analysis
          </h3>
          <p className="text-xs text-[#5E8B4E] font-bold">
            {timeframe === 'week' ? '1 Week' : timeframe === 'month' ? '1 Month' : 'Full Phase'} Time-Lapse
          </p>
        </div>

        <select 
          value={timeframe} 
          onChange={(e: any) => setTimeframe(e.target.value)}
          className="w-24 h-7 px-2 text-xs bg-white text-earth-dark font-medium rounded-full shadow-sm border-white/60 focus:outline-none focus:ring-2 focus:ring-garden-green/50 cursor-pointer"
        >
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="duration">All</option>
        </select>
      </div>

      <div className="flex-1 min-h-0 relative z-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fff" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#fff" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.3)" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#5E8B4E', fontWeight: 600 }} 
              dy={10} 
            />
            <YAxis 
              hide 
              domain={[0, 110]} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(_value: any, name: any, props: any) => {
                const status = props.payload.status;
                if (name === 'growth') {
                  const label = status === 'completed' ? '🌱 Watered' : status === 'missed' ? '🥀 Missed' : '— No log';
                  return [label, 'Status'];
                }
                return [_value, name];
              }}
              labelStyle={{ color: '#AFD198', fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="growth" 
              stroke="#fff" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorGrowth)" 
              activeDot={{ r: 6, fill: "#1f2937", stroke: "#fff", strokeWidth: 2 }}
              dot={renderCustomDot}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
