import { useState, useEffect, useCallback } from 'react';
import { experimentsAPI, logsAPI } from '@/services/api';
import type { Experiment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Calendar, CheckCircle, XCircle, Sprout, TreePine, Trash2, AlertTriangle, X } from 'lucide-react';
import CreateExperimentDialog from '@/components/experiments/CreateExperimentDialog';
import { toast } from 'sonner';

function getPlantEmoji(streak: number): string {
  if (streak >= 30) return '🌳';
  if (streak >= 21) return '🌲';
  if (streak >= 14) return '🌻';
  if (streak >= 7) return '🌿';
  if (streak >= 3) return '🌱';
  return '🫘';
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-garden-green/20 text-garden-green border-garden-green/30';
    case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'paused': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'abandoned': return 'bg-red-100 text-red-500 border-red-200';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function Garden() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExperiments = useCallback(async () => {
    try {
      const res = await experimentsAPI.list(filter === 'all' ? undefined : filter);
      setExperiments(res.data.experiments);
    } catch {
      toast.error('Failed to load garden');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  const handleCreate = async (data: {
    title: string;
    description?: string;
    duration_days?: number;
    start_date: string;
  }) => {
    await experimentsAPI.create(data);
    toast.success('🌱 New seed planted!');
    fetchExperiments();
  };

  const handleLog = async (expId: number, status: 'completed' | 'missed') => {
    try {
      const res = await logsAPI.create(expId, { status });
      const { notification } = res.data;
      if (status === 'completed') {
        toast.success(notification.title, { description: notification.message });
      } else {
        toast.error(notification.title, { description: notification.message });
      }
      fetchExperiments();
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.warning('Already logged today');
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await experimentsAPI.delete(deleteTarget.id);
      const action = (res.data as any).action;
      if (action === 'abandoned') {
        toast.success('🍂 Seed marked as abandoned', { description: `"${deleteTarget.title}" has been archived with its history preserved.` });
      } else {
        toast.success('🗑️ Seed permanently removed', { description: `"${deleteTarget.title}" has been deleted from your garden.` });
      }
      fetchExperiments();
    } catch {
      toast.error('Failed to delete seed');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filters = ['all', 'active', 'completed', 'paused', 'abandoned'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-in-up">
          <p className="text-5xl mb-3 animate-sway">🌳</p>
          <p className="text-earth-mid text-lg">Loading your garden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto pt-6 px-4 sm:px-8 pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-earth-dark flex items-center gap-2">
            <TreePine className="h-8 w-8 text-garden-green" />
            My Garden
          </h1>
          <p className="text-earth-mid mt-1">All your seeds and experiments in one place</p>
        </div>
        <CreateExperimentDialog onSubmit={handleCreate} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f
              ? 'bg-garden-green text-earth-dark'
              : 'border-earth-soft text-earth-mid hover:bg-garden-sage/40'
            }
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Grid */}
      {experiments.length === 0 ? (
        <div className="text-center py-16 animate-fade-in-up">
          <h2 className="text-xl font-bold text-earth-dark mb-2">Your garden awaits</h2>
          <p className="text-earth-mid">Plant your first seed to begin your journey!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {experiments.map((exp, idx) => (
            <Card
              key={exp.id}
              className={`bg-garden-parchment/40 border-earth-soft/30 hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in-up stagger-${Math.min(idx + 1, 5)}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-4xl">{getPlantEmoji(exp.current_streak)}</span>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getStatusColor(exp.status)}`}>
                      {exp.status}
                    </Badge>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: exp.id, title: exp.title }); }}
                      className="h-7 w-7 rounded-full flex items-center justify-center text-earth-mid hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete seed"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-earth-dark mb-1">{exp.title}</h3>
                {exp.description && (
                  <p className="text-sm text-earth-mid line-clamp-2 mb-3">{exp.description}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-earth-mid mb-3">
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {exp.current_streak} streak
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {exp.duration_days ? `${exp.completed_days ?? 0}/${exp.duration_days}d` : 'Ongoing'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Sprout className="h-3 w-3 text-garden-green" />
                    {exp.total_logged_days ?? 0} logged
                  </span>
                </div>

                {exp.status === 'active' && (() => {
                  const _n = new Date();
                  const todayStr = `${_n.getFullYear()}-${String(_n.getMonth()+1).padStart(2,'0')}-${String(_n.getDate()).padStart(2,'0')}`;
                  const sd = new Date(exp.start_date);
                  const startStr = `${sd.getFullYear()}-${String(sd.getMonth()+1).padStart(2,'0')}-${String(sd.getDate()).padStart(2,'0')}`;
                  const hasStarted = startStr <= todayStr;

                  if (!hasStarted) {
                    return (
                      <div className="flex items-center gap-2 text-xs text-earth-mid bg-earth-soft/20 rounded-xl py-2 px-3 border border-earth-soft/30">
                        <Calendar className="h-3 w-3" />
                        <span>Starts on {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    );
                  }

                  return (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-garden-green hover:bg-garden-green/80 text-earth-dark gap-1 text-xs"
                        onClick={() => handleLog(exp.id, 'completed')}
                      >
                        <CheckCircle className="h-3 w-3" /> Water
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 gap-1 text-xs"
                        onClick={() => handleLog(exp.id, 'missed')}
                      >
                        <XCircle className="h-3 w-3" /> Missed
                      </Button>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-earth-dark/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative w-[360px] bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2rem] p-8 flex flex-col items-center animate-in zoom-in-95 duration-200">
            <button
              onClick={() => !deleting && setDeleteTarget(null)}
              className="absolute top-5 right-5 text-earth-mid hover:text-earth-dark p-1 rounded-full hover:bg-earth-soft/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>

            <h3 className="text-xl font-bold text-earth-dark text-center mb-2">Remove Seed?</h3>
            <p className="text-sm text-earth-mid text-center mb-6 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-earth-dark">"{deleteTarget.title}"</span> from your garden?
              <br />
              <span className="text-xs opacity-70 mt-1 block">Watered seeds will be archived. Unwatered seeds will be permanently deleted.</span>
            </p>

            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-earth-soft text-earth-mid hover:bg-earth-soft/20 h-11 font-medium"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white h-11 font-bold shadow-sm"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
