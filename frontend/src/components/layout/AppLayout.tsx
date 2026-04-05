import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-gradient-to-b from-earth-cream via-garden-sage/30 to-earth-cream overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 overflow-y-hidden w-full relative">
        <div className="mx-auto w-full min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
