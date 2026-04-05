import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { logsAPI } from '@/services/api';
import type { Experiment, DailyLog } from '@/types';

interface BehavioralInsightsProps {
  experiment: Experiment | null;
}

export function BehavioralInsights({ experiment }: BehavioralInsightsProps) {
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

  const smartInsight = useMemo(() => {
    if (!experiment || logs.length === 0) return "Plant a seed to begin tracking.";
    
    let completedCount = 0;
    let missedCount = 0;
    let weekendMisses = 0;
    let weekdayMisses = 0;
    let weekendCompleted = 0;
    let weekdayCompleted = 0;
    const dayOfWeekCompleted = [0, 0, 0, 0, 0, 0, 0]; // Sun=0...Sat=6

    logs.forEach(log => {
      // Use log_date (the actual date the log is for), NOT created_at (server timestamp)
      const d = new Date(log.log_date);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      if (log.status === 'completed') {
        completedCount++;
        dayOfWeekCompleted[dayOfWeek]++;
        if (isWeekend) weekendCompleted++;
        else weekdayCompleted++;
      } else if (log.status === 'missed') {
        missedCount++;
        if (isWeekend) weekendMisses++;
        else weekdayMisses++;
      }
    });

    const totalLogs = completedCount + missedCount;

    // Not enough data yet
    if (totalLogs < 3) {
      return "Keep watering to establish a reliable baseline.";
    }

    // Check: mostly misses overall
    if (missedCount > completedCount && totalLogs >= 5) {
      return `You've missed more than you've completed (${missedCount} misses vs ${completedCount} completions). Try setting a daily reminder.`;
    }

    // Check: weekend pattern
    if (weekendMisses > weekendCompleted && weekendMisses >= 2) {
      return `You tend to skip this habit on weekends (${weekendMisses} weekend misses). Consider adjusting your routine for Saturdays and Sundays.`;
    }

    // Check: weekday pattern
    if (weekdayMisses > weekdayCompleted && weekdayMisses >= 2) {
      return `You tend to miss more on weekdays (${weekdayMisses} misses). Try linking this habit to an existing weekday routine.`;
    }

    // Check: strong streak
    if (experiment.current_streak >= 7) {
      return `Amazing! You're on a ${experiment.current_streak}-day streak. Consistency is building strong roots. 🌿`;
    }

    // Check: broken streak
    if (experiment.current_streak === 0 && experiment.longest_streak >= 3 && totalLogs > 5) {
      return `Your streak was broken after ${experiment.longest_streak} days. Don't worry — restart today and rebuild momentum.`;
    }

    // Find the best day of the week
    const bestDayIndex = dayOfWeekCompleted.indexOf(Math.max(...dayOfWeekCompleted));
    const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
    if (dayOfWeekCompleted[bestDayIndex] >= 2) {
      return `You're most consistent on ${dayNames[bestDayIndex]} (${dayOfWeekCompleted[bestDayIndex]} completions). Build on that energy!`;
    }

    // General positive insight
    const completionPct = Math.round((completedCount / totalLogs) * 100);
    return `Your completion rate is ${completionPct}% across ${totalLogs} logged days. ${completionPct >= 70 ? 'Great consistency!' : 'Room to grow — keep at it!'}`;
  }, [experiment, logs]);

  if (!experiment) {
    return (
      <Card className="min-h-[100px] shrink-0 w-full bg-white/60 backdrop-blur-md rounded-[2rem] p-6 opacity-50 border border-white" />
    );
  }

  return (
    <Card className="min-h-[100px] shrink-0 w-full bg-[#ECCA9C] border-white/40 shadow-md rounded-[2rem] p-5 flex items-center gap-4 relative overflow-hidden">
      <div className="bg-white/40 p-3 rounded-2xl shadow-inner shrink-0 z-10">
        <Lightbulb className="w-6 h-6 text-orange-600" />
      </div>
      <div className="z-10">
        <h3 className="font-bold text-earth-dark text-sm mb-1">Behavioral Insight</h3>
        <p className="text-earth-dark/80 text-sm font-medium italic">"{smartInsight}"</p>
      </div>
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 blur-2xl rounded-full z-0" />
    </Card>
  );
}
