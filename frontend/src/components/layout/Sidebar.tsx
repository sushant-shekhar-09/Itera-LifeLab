import { Link, useLocation } from 'react-router-dom';
import { Home, Leaf, TrendingUp, Sliders, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/analytics', icon: Leaf, label: 'Analytics' },
    { path: '/garden', icon: TrendingUp, label: 'Growth' },
    { path: '/settings', icon: Sliders, label: 'Settings' },
  ];

  return (
    <aside className="w-[80px] h-screen sticky top-0 left-0 bg-transparent flex flex-col items-center py-8 z-40 border-r border-earth-soft/20 shrink-0">
      {/* Logo — opens landing page in a new tab */}
      <a href="/?landing=1" target="_blank" rel="noopener noreferrer" className="mb-12 transition-transform hover:scale-[1.1] scale-100" title="Home">
        <Logo className="w-[60px] h-auto" />
      </a>

      {/* Nav Icons */}
      <div className="flex-1 flex flex-col gap-6 w-full items-center">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className="relative group" title={item.label}>
              <Button
                variant="ghost"
                size="icon"
                className={clsx(
                  "h-12 w-12 rounded-2xl transition-all duration-300",
                  isActive
                    ? "bg-white shadow-sm text-garden-green"
                    : "text-earth-mid hover:text-earth-dark hover:bg-white/50"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-white/40 rounded-2xl animate-in fade-in zoom-in-95 duration-200" />
                )}
                <Icon
                  className={`w-8 h-8 relative z-10 transition-colors duration-200 ${
                    isActive ? 'text-earth-dark' : 'text-earth-mid group-hover:text-earth-dark'
                  }`}
                />
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Bottom Action */}
      <button onClick={logout} className="p-4 rounded-2xl text-earth-mid hover:text-earth-dark hover:bg-white/40 transition-all group flex items-center justify-center relative w-14 h-14" title="Logout">
        <LogOut className="w-8 h-8 rotate-180 relative z-10 group-hover:scale-110 transition-transform duration-200" />
      </button>
    </aside>
  );
}
