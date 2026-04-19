import { useEffect, useState, useCallback } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProfileInsights from '@/components/dashboard/ProfileInsights';
import TodayContent from '@/components/dashboard/TodayContent';
import GrowthSnapshot from '@/components/dashboard/GrowthSnapshot';
import ActiveSeeds from '@/components/dashboard/ActiveSeeds';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { experimentsAPI, statsAPI, logsAPI } from '@/services/api';
import type { Experiment, StatsOverview } from '@/types';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [expRes, statsRes] = await Promise.all([
        experimentsAPI.list('active'),
        statsAPI.overview(),
      ]);
      setExperiments(expRes.data.experiments);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Trigger auto-miss backfill first (silent, no-op if disabled), then fetch data
    experimentsAPI.autoMiss().catch(() => {}).finally(() => fetchData());
  }, [fetchData]);

  const handleLogEntry = async (experimentId: number, status: 'completed' | 'missed') => {
    try {
      await logsAPI.create(experimentId, { status });
      if (status === 'completed') {
        toast.success('🌱 Great job! Seed watered!');
      } else {
        toast.error('Your seed needs water...');
      }
      fetchData(); // Refresh everything
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to log entry';
      toast.error(msg);
    }
  };

  const activeCount = experiments.filter(e => e.status === 'active').length;

  if (loading) {
    return (
      <div className="h-full w-full max-w-[1600px] mx-auto pt-2 px-4 sm:px-8 flex flex-col min-h-screen">
        <DashboardHeader experiments={experiments} stats={stats} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="text-4xl mb-4">🪴</div>
            <p className="text-earth-mid font-medium">Loading garden...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full max-w-[1600px] mx-auto pt-2 px-4 sm:px-8 flex flex-col min-h-screen">
      <DashboardHeader experiments={experiments} stats={stats} />
      
      {/* Header Typography */}
      <div className="mb-8 pl-2">
        <h1 className="text-3xl font-bold text-earth-dark tracking-tight">
          {(() => {
            const isFirst = (user?.login_count || 1) <= 1;
            const hasName = user?.first_name && user.first_name.trim().length > 0;
            const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
            
            if (isFirst) {
              return hasName 
                ? `Hello, ${fullName}`
                : `Hello, ${user?.username || 'Gardener'}`;
            } else {
              return hasName
                ? `Welcome back, ${user.first_name}`
                : `Welcome back, ${user?.username || 'Gardener'}`;
            }
          })()}
        </h1>
        <p className="text-earth-mid mt-1 font-medium">
          You have {activeCount} active seed{activeCount !== 1 ? 's' : ''} today
        </p>
      </div>

      {/* Main Grid Layout (Left / Right Column) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 pb-8">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Top Row: Profile Insights & Today Content side-by-side */}
          <div className="flex flex-col sm:flex-row gap-6 min-h-[288px]">
            {/* Profile Insights Card */}
            <div className="flex-1">
              <ProfileInsights stats={stats} user={user} />
            </div>

            {/* Today's Content Card */}
            <div className="flex-1">
              <TodayContent stats={stats} experiments={experiments} />
            </div>
          </div>

          {/* Bottom Area: Growth Snapshot (Chart) */}
          <div className="flex-1 min-h-[260px] relative">
            <GrowthSnapshot stats={stats} />
          </div>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="flex-[0.9] flex flex-col gap-6">
          
          {/* Top Area: Active Seeds Carousel */}
          <div className="flex-1 flex flex-col mb-1 relative">
            <div className="absolute inset-0 z-0">
               <ActiveSeeds experiments={experiments} onLogEntry={handleLogEntry} />
            </div>
          </div>

          {/* Bottom Area: 2 Square Cards */}
          <div className="flex gap-6 h-[160px] shrink-0 z-10">
            {/* Longest Streak Card — uses stats API (all experiments) */}
            <div className="flex-1 bg-white/60 backdrop-blur-sm border border-white rounded-[2rem] p-5 shadow-sm flex flex-col justify-center items-center text-center hover:bg-white/80 transition-colors cursor-default animate-fade-in-up stagger-4">
              <span className="text-4xl font-black text-garden-green">
                {stats?.best_streak_pct ?? 0}%
              </span>
              <span className="text-xs font-bold text-earth-mid mt-2 uppercase tracking-wide">Longest Streak ( in % )</span>
            </div>

            {/* My Garden Link Card */}
            <Link to="/garden" className="flex-1 bg-garden-wood rounded-[2rem] p-5 shadow-sm flex flex-col justify-between group hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden block animate-fade-in-up stagger-4">
              <h3 className="font-bold text-2xl leading-tight text-white relative z-10 drop-shadow-sm">My Garden</h3>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center relative z-10 self-end transition-transform group-hover:scale-110">
                <ArrowRight className="h-5 w-5 text-white transform group-hover:-rotate-45 transition-transform" />
              </div>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
