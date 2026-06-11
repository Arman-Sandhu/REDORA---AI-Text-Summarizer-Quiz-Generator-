import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthContext } from './context/AuthContext';
import LandingScreen from './screens/LandingScreen';
import InputScreen from './screens/InputScreen';
import SummaryScreen from './screens/SummaryScreen';
import AttemptScreen from './screens/AttemptScreen';
import HistoryScreen from './screens/HistoryScreen';
import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import SummaryHistoryScreen from './screens/SummaryHistoryScreen';
import AdvancedPipelineScreen from './screens/AdvancedPipelineScreen';
import GoogleCallbackScreen from './screens/GoogleCallbackScreen';
import { LogOut, User, LayoutDashboard } from 'lucide-react';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4 pointer-events-none">
      <nav
        className={`pointer-events-auto flex justify-between items-center px-6 md:px-8 py-3 border transition-all duration-500 ease-out shadow-2xl ${
          scrolled 
            ? 'w-[92%] max-w-[1200px] bg-[#0a0a0a]/80 border-white/[0.06] rounded-[24px] backdrop-blur-lg translate-y-2' 
            : 'w-full max-w-full bg-transparent border-transparent rounded-[0px] backdrop-blur-none translate-y-0'
        }`}
      >
        <Link to="/" className="flex items-center gap-2 text-xl font-black logo-gradient select-none active:scale-95 transition-transform">
          REDORA
        </Link>
        <div className="flex items-center gap-4 font-sans">
          {user ? (
            <>
              <Link 
                to="/dashboard" 
                className="flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent px-3 py-1.5 rounded-xl transition-all text-xs font-semibold"
              >
                <LayoutDashboard size={14} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              
              <div className="flex items-center gap-2 bg-[#111111]/80 border border-white/[0.06] rounded-xl px-3 py-1.5 select-none">
                <div className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse"></div>
                <span className="text-zinc-400 text-xs max-w-[120px] truncate font-mono font-medium">{user.email}</span>
              </div>

              <button 
                onClick={logout} 
                className="text-zinc-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/[0.08] border border-transparent rounded-xl" 
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-[#111111] border border-white/[0.04] rounded-xl px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              <span className="text-zinc-500 text-xs font-mono font-medium uppercase tracking-wider">Guest Mode</span>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Instant scroll reset for clean transitions
    });
  }, [pathname]);

  return null;
}

function AppContent() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#07080f] text-white font-sans relative selection:bg-accent-blue/20 selection:text-accent-blue pt-24 pb-12">
      <Navbar />
      <main className="container mx-auto px-4 h-full relative z-10">
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/input" element={<InputScreen />} />
          <Route path="/summary" element={<SummaryScreen />} />
          <Route path="/summaries" element={<SummaryHistoryScreen />} />
          <Route path="/attempt" element={<AttemptScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/pipeline" element={<AdvancedPipelineScreen />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-background font-sans text-zinc-400 animate-pulse">
        <div className="text-2xl font-black tracking-tighter text-white select-none">REDORA</div>
        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;
