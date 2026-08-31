import React from 'react';
import { Layers, Timer, Box } from 'lucide-react';

interface NavbarProps {
  activeTab: 'timer' | 'reference';
  setActiveTab: (tab: 'timer' | 'reference') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'timer', label: 'Speedsolving Timer', icon: Timer },
    { id: 'reference', label: 'Algorithms', icon: Layers },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-[#191919] border-b border-[#2d2d2d] px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <button
          type="button"
          aria-label="Go to Speedsolving Timer"
          onClick={() => setActiveTab('timer')}
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
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveTab(item.id)}
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
