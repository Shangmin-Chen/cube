import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layers, Timer, Box } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'timer', path: '/timer', label: 'Speedsolving Timer', icon: Timer, match: (p: string) => p.startsWith('/timer') || p === '/' },
    { id: 'reference', path: '/algs', label: 'Algorithms', icon: Layers, match: (p: string) => p.startsWith('/algs') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#191919] border-b border-[#2d2d2d] px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <button
          type="button"
          aria-label="Go to Speedsolving Timer"
          onClick={() => navigate('/timer')}
          className="flex items-center gap-2.5 cursor-pointer outline-none group text-left bg-transparent border-0 p-0"
        >
          <div className="w-8 h-8 rounded-lg bg-[#202020] border border-[#2d2d2d] flex items-center justify-center text-[#eab308] group-hover:border-[#eab308]/40 transition-colors">
            <Box className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight group-hover:text-[#eab308] transition-colors">
            Cube
          </span>
        </button>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#202020] p-1 rounded-xl border border-[#2d2d2d]">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = item.match(location.pathname);
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#2d2d2d] text-[#eab308] border border-[#eab308]/30 shadow-none'
                    : 'text-[#888888] hover:text-white hover:bg-[#282828]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
