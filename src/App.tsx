import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AlgReferenceTab } from './components/AlgReferenceTab';
import { TimerTab } from './components/TimerTab';
import { TrainerTab } from './components/TrainerTab';

/**
 * Inner layout that keeps TimerTab always mounted so that navigating
 * to /train or /algs does not discard a running or armed solve,
 * regenerate the scramble, or leak timer intervals.
 *
 * TimerTab is rendered outside the Routes switch and hidden via CSS
 * when the user is on another tab. The other tabs are route-mounted
 * normally since they have no long-lived session state to preserve.
 */
function AppLayout() {
  const location = useLocation();
  const isTimerRoute = location.pathname === '/' || location.pathname.startsWith('/timer');

  return (
    <div className="min-h-screen bg-[#191919] text-[#d4d4d4] flex flex-col selection:bg-[#eab308] selection:text-black font-sans">
      <Navbar />

      <main className="flex-1 px-4 py-6">
        {/* TimerTab is always mounted; hidden when not on the timer route */}
        <div style={{ display: isTimerRoute ? 'block' : 'none' }}>
          <TimerTab />
        </div>

        {/* Other tabs render via Routes normally */}
        {!isTimerRoute && (
          <Routes>
            <Route path="/train" element={<TrainerTab />} />
            <Route path="/algs" element={<AlgReferenceTab />} />
            <Route path="/algs/:step" element={<AlgReferenceTab />} />
            <Route path="/algs/:step/:caseId" element={<AlgReferenceTab />} />
            <Route path="*" element={<Navigate to="/timer" replace />} />
          </Routes>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2d2d2d] bg-[#191919] py-6 text-center text-xs text-[#888888]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
          <p>Cube • Speedcubing & Algorithm Suite</p>
          <p className="text-[#888888]">Speedsolving Timer • Flashcards • Algorithms</p>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
