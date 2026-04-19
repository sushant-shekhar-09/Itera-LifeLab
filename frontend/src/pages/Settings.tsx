import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/services/api';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Save, User, Mail, Shield, Calendar, Sliders } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function Settings() {
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoMiss, setAutoMiss] = useState(false);
  const [togglingAutoMiss, setTogglingAutoMiss] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form fields from user
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setUsername(user.username || '');
      setAutoMiss(!!user.auto_miss);
    }
  }, [user]);

  // Load avatar from localStorage
  useEffect(() => {
    if (!user?.id) return;
    const key = `userAvatar_base64_${user.id}`;
    const saved = localStorage.getItem(key);
    setAvatarUrl(saved);
  }, [user?.id]);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const MAX = 1024;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      ctx?.drawImage(img, 0, 0, w, h);

      const base64 = canvas.toDataURL('image/webp', 0.85);
      const key = `userAvatar_base64_${user.id}`;
      localStorage.setItem(key, base64);
      setAvatarUrl(base64);
      toast.success('Avatar updated!');
    };
    img.src = URL.createObjectURL(file);
    e.target.value = ''; // reset input
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await authAPI.updateProfile({
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        username: username.trim(),
      });
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const initial = user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex-1 overflow-y-auto h-screen px-8 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-earth-dark tracking-tight mb-1 animate-fade-in-up">Settings</h1>
        <p className="text-earth-mid font-medium mb-8 animate-fade-in-up stagger-1">Manage your profile and preferences.</p>

        {/* ─── Avatar Section ─── */}
        <Card className="bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-[2rem] p-8 mb-6 animate-fade-in-up stagger-2">
          <h2 className="text-lg font-bold text-earth-dark mb-5 flex items-center gap-2">
            <Camera className="w-5 h-5 text-garden-green" />
            Profile Picture
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg transition-transform group-hover:scale-105">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-garden-wood text-white text-3xl font-bold">
                    {initial}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white w-6 h-6" />
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarSelect} />
            </div>
            <div>
              <p className="text-sm font-bold text-earth-dark">Change your avatar</p>
              <p className="text-xs text-earth-mid mt-1">Click to upload a new photo. Max 1024px, WebP compressed.</p>
            </div>
          </div>
        </Card>

        {/* ─── Profile Info Section ─── */}
        <Card className="bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-[2rem] p-8 mb-6 animate-fade-in-up stagger-3">
          <h2 className="text-lg font-bold text-earth-dark mb-5 flex items-center gap-2">
            <User className="w-5 h-5 text-garden-green" />
            Personal Info
          </h2>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name" className="text-earth-dark font-medium text-sm">First Name</Label>
                <Input
                  id="first-name"
                  placeholder="Your first name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="bg-white/80 border-earth-soft/60 focus:border-garden-green rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name" className="text-earth-dark font-medium text-sm">Last Name</Label>
                <Input
                  id="last-name"
                  placeholder="Your last name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="bg-white/80 border-earth-soft/60 focus:border-garden-green rounded-xl h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-earth-dark font-medium text-sm">Username</Label>
              <Input
                id="username"
                placeholder="Your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="bg-white/80 border-earth-soft/60 focus:border-garden-green rounded-xl h-11"
              />
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-garden-green hover:bg-garden-green/80 text-earth-dark font-bold rounded-xl h-11 px-6 shadow-sm gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>

        {/* ─── Preferences Section ─── */}
        <Card className="bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-[2rem] p-8 mb-6 animate-fade-in-up stagger-4">
          <h2 className="text-lg font-bold text-earth-dark mb-5 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-garden-green" />
            Preferences
          </h2>

          <div className="flex items-center justify-between bg-white/80 p-4 rounded-2xl border border-white">
            <div className="flex-1 pr-4">
              <p className="text-sm font-bold text-earth-dark">Auto-miss unlogged days</p>
              <p className="text-xs text-earth-mid mt-1">When enabled, any day you don't log will automatically be marked as missed.</p>
            </div>
            <Switch
              checked={autoMiss}
              disabled={togglingAutoMiss}
              onCheckedChange={async (checked) => {
                setTogglingAutoMiss(true);
                try {
                  await authAPI.updateSettings({ auto_miss: checked });
                  setAutoMiss(checked);
                  await refreshUser();
                  toast.success(checked ? 'Auto-miss enabled' : 'Auto-miss disabled');
                } catch {
                  toast.error('Failed to update setting');
                } finally {
                  setTogglingAutoMiss(false);
                }
              }}
            />
          </div>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-[2rem] p-8 animate-fade-in-up stagger-4">
          <h2 className="text-lg font-bold text-earth-dark mb-5 flex items-center gap-2">
            <Shield className="w-5 h-5 text-garden-green" />
            Account
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/80 p-4 rounded-2xl border border-white">
              <div className="h-10 w-10 rounded-full bg-garden-green/15 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-garden-green" />
              </div>
              <div>
                <p className="text-[10px] text-earth-mid uppercase font-bold tracking-wider">Email</p>
                <p className="text-sm font-bold text-earth-dark">{user?.email || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/80 p-4 rounded-2xl border border-white">
              <div className="h-10 w-10 rounded-full bg-garden-green/15 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-garden-green" />
              </div>
              <div>
                <p className="text-[10px] text-earth-mid uppercase font-bold tracking-wider">Member Since</p>
                <p className="text-sm font-bold text-earth-dark">{joinedDate}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
