import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TreePine } from 'lucide-react';
import type { Experiment } from '@/types';
import { Link } from 'react-router-dom';

interface GardenPreviewProps {
  experiments: Experiment[];
}

function getPlantEmoji(streak: number): string {
  if (streak >= 30) return '🌳';
  if (streak >= 21) return '🌲';
  if (streak >= 14) return '🌻';
  if (streak >= 7) return '🌿';
  if (streak >= 3) return '🌱';
  return '🫘';
}

export default function GardenPreview({ experiments }: GardenPreviewProps) {
  const activeExps = experiments.filter(e => e.status === 'active').slice(0, 6);

  return (
    <Card className="bg-garden-parchment/50 border-earth-soft/40 animate-fade-in-up stagger-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-earth-dark flex items-center gap-2">
            <TreePine className="h-5 w-5 text-garden-green" />
            My Garden
          </CardTitle>
          <Link to="/garden">
            <Badge variant="outline" className="cursor-pointer hover:bg-garden-green/10 border-earth-soft text-earth-mid text-xs">
              View All →
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {activeExps.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {activeExps.map((exp, idx) => (
              <div
                key={exp.id}
                className={`flex flex-col items-center p-3 rounded-xl bg-garden-sage/30 border border-earth-soft/20 hover:bg-garden-sage/50 transition-all cursor-pointer group animate-grow stagger-${idx + 1}`}
              >
                <span className="text-3xl mb-1 group-hover:animate-sway">{getPlantEmoji(exp.current_streak)}</span>
                <p className="text-xs font-medium text-earth-dark text-center line-clamp-2">{exp.title}</p>
                <p className="text-xs text-earth-mid mt-1">🔥 {exp.current_streak}d</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">🏡</p>
            <p className="text-sm text-earth-mid">Your garden is empty.</p>
            <p className="text-xs text-earth-mid">Plant seeds to grow your garden!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
