import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { TutorialTab } from './components/TutorialTab';
import { AlgReferenceTab } from './components/AlgReferenceTab';
import { TrainerTab } from './components/TrainerTab';
import { TimerTab } from './components/TimerTab';

export function App() {
  const [activeTab, setActiveTab] = useState<'tutorial' | 'reference' | 'trainer' | 'timer'>('timer');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 px-4 py-6">
        {activeTab === 'tutorial' && <TutorialTab />}
        {activeTab === 'reference' && <AlgReferenceTab />}
        {activeTab === 'trainer' && <TrainerTab />}
        {activeTab === 'timer' && <TimerTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
          <p>CFOP Speedcubing Trainer & Algorithm Reference • Built for Cubers</p>
          <p className="text-slate-600">Cross • F2L • OLL • PLL</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
