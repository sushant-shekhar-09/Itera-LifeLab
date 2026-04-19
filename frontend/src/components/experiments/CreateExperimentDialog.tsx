import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

interface CreateExperimentDialogProps {
  onSubmit: (data: {
    title: string;
    description?: string;
    duration_days?: number;
    start_date: string;
  }) => Promise<void>;
}

export default function CreateExperimentDialog({ onSubmit }: CreateExperimentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        duration_days: durationDays ? parseInt(durationDays) : undefined,
        start_date: startDate,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setDurationDays('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-garden-green hover:bg-garden-green/80 text-earth-dark gap-2 shadow-md hover:shadow-lg transition-all">
          <Plus className="h-4 w-4" />
          Plant New Seed
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-earth-cream border-earth-soft">
        <DialogHeader>
          <DialogTitle className="text-xl text-earth-dark flex items-center gap-2">
            🌱 Plant a New Seed
          </DialogTitle>
          <DialogDescription className="text-earth-mid">
            Create a new experiment or habit to track daily.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seed-title" className="text-earth-dark font-medium">
              Seed Name *
            </Label>
            <Input
              id="seed-title"
              placeholder="e.g. No sugar for 30 days"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-white/60 border-earth-soft focus:border-garden-green"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seed-desc" className="text-earth-dark font-medium">
              Description
            </Label>
            <Textarea
              id="seed-desc"
              placeholder="What's this experiment about?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-white/60 border-earth-soft focus:border-garden-green resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seed-duration" className="text-earth-dark font-medium">
                Duration (days)
              </Label>
              <Input
                id="seed-duration"
                type="number"
                placeholder="Optional (e.g. 30)"
                value={durationDays}
                onChange={e => setDurationDays(e.target.value)}
                min="1"
                className="bg-white/60 border-earth-soft focus:border-garden-green"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seed-start" className="text-earth-dark font-medium">
                Start Date *
              </Label>
              <Input
                id="seed-start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-white/60 border-earth-soft focus:border-garden-green"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-earth-mid"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="bg-garden-green hover:bg-garden-green/80 text-earth-dark"
            >
              {loading ? 'Planting...' : '🌿 Plant Seed'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
