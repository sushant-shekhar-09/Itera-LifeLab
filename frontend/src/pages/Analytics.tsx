import { useEffect, useState, useCallback } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { PlantHero } from '@/components/dashboard/PlantHero';
import { GrowthAnalysis } from '@/components/dashboard/GrowthAnalysis';
import { PlantDetails } from '@/components/dashboard/PlantDetails';
import { ActivityPattern } from '@/components/dashboard/PlantsMonitored';
import { BehavioralInsights } from '@/components/dashboard/BehavioralInsights';
import { experimentsAPI, statsAPI, logsAPI } from '@/services/api';
import type { Experiment, StatsOverview } from '@/types';
import { toast } from 'sonner';

export default function Analytics() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [expRes, statsRes] = await Promise.all([
        experimentsAPI.list(), // Fetch ALL seeds for full analytics
        statsAPI.overview(),
      ]);
      setExperiments(expRes.data.experiments);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogEntry = async (experimentId: number, status: 'completed' | 'missed') => {
    try {
      await logsAPI.create(experimentId, { status });
      if (status === 'completed') {
        toast.success('🌱 Great job! Seed watered!');
      } else {
        toast.error('Your seed needs water...');
      }
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to log entry');
    }
  };

  const handleNext = useCallback(() => {
    if (experiments.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % experiments.length);
  }, [experiments.length]);

  const handlePrev = useCallback(() => {
    if (experiments.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + experiments.length) % experiments.length);
  }, [experiments.length]);

  if (loading) {
    return (
      <div className="h-[100dvh] w-full max-w-[1600px] mx-auto pt-6 px-4 sm:px-8 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="text-4xl mb-4">🔬</div>
            <p className="text-earth-mid font-medium">Analyzing garden data...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentExperiment = experiments.length > 0 ? experiments[currentIndex] : null;

  return (
    <div className="h-[100dvh] w-full max-w-[1600px] mx-auto pt-6 px-4 sm:px-8 flex flex-col overflow-hidden pb-6">
      
      {/* Header with dynamic path pill */}
      <div className="shrink-0 z-20">
        <DashboardHeader experiments={experiments} stats={stats} currentExperiment={currentExperiment} />
      </div>
      
      {/* Main Content: 60/40 Split using min-h-0 to constrain flex children perfectly */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Left Column: Interactive Plant Carousel Hero */}
        <div className="lg:flex-[1.4] xl:flex-[1.6] relative rounded-[2rem] bg-gradient-to-br from-[#E6EFE1]/40 to-transparent p-6 sm:p-10 flex flex-col border border-white shadow-sm min-h-0 overflow-hidden">
          <PlantHero 
            experiment={currentExperiment} 
            onNext={handleNext}
            onPrev={handlePrev}
            onLogEntry={handleLogEntry}
            totalActive={experiments.length}
            currentIndex={currentIndex}
          />
        </div>

        {/* Right Column: Stacked Interactive Insight Cards */}
        <div className="lg:flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto pr-2 pb-6 custom-scrollbar">
          
          <div className="shrink-0 min-h-[280px]">
            <GrowthAnalysis experiment={currentExperiment} stats={stats} />
          </div>
          
          <div className="shrink-0 min-h-[180px]">
            <PlantDetails experiment={currentExperiment} />
          </div>

          <div className="shrink-0 min-h-[260px]">
            <ActivityPattern experiment={currentExperiment} stats={stats} />
          </div>

          <div className="shrink-0 min-h-[120px]">
            <BehavioralInsights experiment={currentExperiment} />
          </div>

        </div>
      </div>
    </div>
  );
}
