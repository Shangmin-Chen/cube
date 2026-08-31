import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { AlgReferenceTab } from './components/AlgReferenceTab';
import { TimerTab } from './components/TimerTab';

export function App() {
  const [activeTab, setActiveTab] = useState<'timer' | 'reference'>('timer');

  return (
    <div className="min-h-screen bg-[#191919] text-[#d4d4d4] flex flex-col selection:bg-[#eab308] selection:text-black font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 px-4 py-6">
        {activeTab === 'timer' && <TimerTab />}
        {activeTab === 'reference' && <AlgReferenceTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2d2d2d] bg-[#191919] py-6 text-center text-xs text-[#888888]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
          <p>Cube • Speedcubing Timer & Interactive Algorithm Reference</p>
          <p className="text-[#888888]">2-Look OLL • 2-Look PLL • Intuitive F2L</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
