import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { 
  FileText, 
  ListChecks, 
  ArrowRight, 
  Zap, 
  Sparkles, 
  GitCompare, 
  BrainCircuit, 
  Lock, 
  Cpu, 
  GraduationCap,
  CheckCircle2,
  XCircle,
  Check,
  HelpCircle,
  BookOpen,
  Award
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageWrapper } from '../components/ui/PageWrapper';

export default function LandingScreen() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Spotlight following the cursor across the hero
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      const { clientX, clientY } = e;
      mouseX.set(clientX);
      mouseY.set(clientY);
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [mouseX, mouseY]);

  // Soft tracking aura coordinates
  const auraX = useSpring(mouseX, { stiffness: 60, damping: 25 });
  const auraY = useSpring(mouseY, { stiffness: 60, damping: 25 });

  // --- STUDY SANDBOX PARALLAX TILT LOGIC ---
  const mockupRef = useRef(null);
  const mockX = useMotionValue(0);
  const mockY = useMotionValue(0);
  const mockRotateX = useSpring(useTransform(mockY, [-200, 200], [6, -6]), { stiffness: 120, damping: 24 });
  const mockRotateY = useSpring(useTransform(mockX, [-300, 300], [-8, 8]), { stiffness: 120, damping: 24 });

  const handleMockupMouseMove = (e) => {
    if (!mockupRef.current) return;
    const rect = mockupRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = e.clientX - rect.left - width / 2;
    const y = e.clientY - rect.top - height / 2;
    mockX.set(x);
    mockY.set(y);
  };

  const handleMockupMouseLeave = () => {
    mockX.set(0);
    mockY.set(0);
  };

  // --- STUDY SANDBOX CORE REACT LOGIC ---
  const [activeTab, setActiveTab] = useState('document');
  const [selectedOption, setSelectedOption] = useState(null);
  const [isDemoRunning, setIsDemoRunning] = useState(true);

  useEffect(() => {
    if (!isDemoRunning) return;

    // Timeline-based guided tour
    // Step 1: Switch to 'summary' at 3.5 seconds
    const summaryTimer = setTimeout(() => {
      setActiveTab('summary');
    }, 3500);

    // Step 2: Switch to 'quiz' at 8.0 seconds
    const quizTimer = setTimeout(() => {
      setActiveTab('quiz');
    }, 8000);

    // Step 3: Simulated click on Option B at 9.8 seconds
    const optionTimer = setTimeout(() => {
      setSelectedOption('B');
    }, 9800);

    // Step 4: Reset the cycle back to 'document' at 15.0 seconds
    const resetTimer = setTimeout(() => {
      setActiveTab('document');
      setSelectedOption(null);
    }, 15000);

    return () => {
      clearTimeout(summaryTimer);
      clearTimeout(quizTimer);
      clearTimeout(optionTimer);
      clearTimeout(resetTimer);
    };
  }, [isDemoRunning, activeTab, selectedOption]);

  const handleTabClick = (tabId) => {
    setIsDemoRunning(false); // Halt automated guided tour on interaction
    setActiveTab(tabId);
  };

  const handleOptionClick = (optionId) => {
    setIsDemoRunning(false); // Halt automated guided tour on interaction
    setSelectedOption(optionId);
  };

  return (
    <PageWrapper className="relative overflow-visible flex flex-col items-center min-h-[90vh] py-0">
      
      {/* 🌌 Ultra-Dynamic Glowing Mesh Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none">
        {/* Interactive Laser Aura Tracker */}
        <motion.div 
          style={{
            x: useTransform(auraX, (val) => val - 250),
            y: useTransform(auraY, (val) => val - 250),
          }}
          className="absolute w-[500px] h-[500px] bg-gradient-to-r from-accent-blue/15 via-accent-violet/12 to-transparent rounded-full blur-[130px] mix-blend-screen"
        />
        
        {/* Deep Atmosphere Fluid Waves */}
        <div className="absolute top-[-10%] right-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-indigo-500/8 to-transparent blur-[140px] animate-float-slow" />
        <div className="absolute bottom-[20%] left-[-10%] w-[750px] h-[750px] rounded-full bg-gradient-to-tr from-violet-500/8 to-transparent blur-[150px] animate-float-slow" style={{ animationDirection: 'reverse', animationDuration: '28s' }} />
        
        {/* Technical Grid Matrix */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_85%_60%_at_50%_-10%,#000_80%,transparent_100%)]" />
      </div>

      {/* 🚀 Hero Section Sequence */}
      <div className="text-center max-w-4xl px-4 pt-24 pb-12 flex flex-col items-center relative">
        
        {/* Fluid Animated Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-400 mb-8 select-none"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-blue"></span>
          </span>
          <span>Welcome to Redora AI</span>
        </motion.div>
        
        {/* Dynamic Title Sequence */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.2 }}
          className="text-7xl md:text-9xl font-black tracking-tighter leading-none text-white select-none relative group"
        >
          <span className="inline-block transform hover:scale-[1.02] transition-transform duration-500 ease-out bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-100 to-zinc-400 group-hover:shadow-[0_0_80px_rgba(255,255,255,0.05)]">
            REDORA
          </span>
        </motion.h1>

        {/* Subtitle tag */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.25 }}
          className="text-xs sm:text-sm md:text-base font-mono uppercase tracking-[0.22em] text-zinc-300 mt-4 select-none bg-clip-text text-transparent bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-500 font-bold"
        >
          An AI Text Summarizer & Quiz Generator
        </motion.div>
        
        {/* Animated Tagline */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.3 }}
          className="text-2xl md:text-4xl font-medium tracking-tight text-zinc-300 mt-8 max-w-2xl leading-tight"
        >
          Learn complex topics faster. <br />
          <span className="relative inline-block font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-accent-blue via-indigo-400 to-accent-violet animate-shimmer">
            Understand everything.
          </span>
        </motion.p>

        {/* Secondary Text */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.4 }}
          className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto mt-6 leading-relaxed font-medium tracking-tight"
        >
          Upload your PDFs, get instant organized summaries, and test your understanding with AI-generated practice quizzes in seconds.
        </motion.p>
        
        {/* Micro-Interactive Call to Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 w-full sm:w-auto"
        >
          <Button 
            onClick={() => navigate(user ? '/dashboard' : '/auth')}
            variant="primary"
            size="lg"
            magnetic
            className="w-full sm:w-auto min-w-[200px] h-14 text-sm font-bold relative group overflow-hidden rounded-2xl shadow-xl shadow-accent-blue/10 hover:shadow-accent-blue/20 transition-all duration-300"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-shimmer-slide"></span>
            <Zap size={16} className="fill-current mr-2 group-hover:scale-110 transition-transform duration-300" />
            <span>{user ? 'My Dashboard' : 'Get Started Free'}</span>
          </Button>
          
          <Button 
            onClick={() => navigate('/input')}
            variant="secondary"
            size="lg"
            magnetic
            className="w-full sm:w-auto min-w-[200px] h-14 text-sm font-semibold rounded-2xl hover:bg-white/[0.04] transition-all"
          >
            <span>Try as Guest</span>
            <ArrowRight size={16} className="text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 ml-2" />
          </Button>
        </motion.div>

        {/* ⚡ Non-Technical Friendly Value Strip */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-14 px-6 py-3.5 rounded-2xl border border-white/[0.03] bg-white/[0.01] backdrop-blur-md flex flex-wrap justify-center items-center gap-y-3 gap-x-6 sm:gap-x-10 text-xs text-zinc-500 font-medium select-none"
        >
          <div className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors">
            <Zap size={13} className="text-accent-blue" />
            <span>Instant Study Guides</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-zinc-800 hidden sm:block"></div>
          <div className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors">
            <ListChecks size={13} className="text-accent-indigo" />
            <span>Custom Practice Tests</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-zinc-800 hidden sm:block"></div>
          <div className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors">
            <Lock size={13} className="text-accent-violet" />
            <span>100% Private & Secure</span>
          </div>
        </motion.div>
      </div>

      {/* 🖥️ High-Impact Friendly Interactive Study Sandbox Mockup */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 22, delay: 0.7 }}
        className="w-full max-w-4xl px-4 mt-8 mb-20 relative perspective-[1200px]"
      >
        {/* Ambient Halo behind Mockup */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-accent-blue/8 via-accent-violet/8 to-transparent rounded-[2.5rem] blur-[60px] opacity-70 pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '6s' }} />

        {/* Dashboard Frame Window */}
        <motion.div
          ref={mockupRef}
          onMouseMove={handleMockupMouseMove}
          onMouseLeave={handleMockupMouseLeave}
          style={{
            rotateX: mockRotateX,
            rotateY: mockRotateY,
            transformStyle: "preserve-3d",
          }}
          className="rounded-2xl border border-white/[0.08] bg-[#070708]/90 backdrop-blur-xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden relative select-none w-full"
        >
          {/* Mockup Title bar */}
          <div className="h-14 border-b border-white/[0.05] bg-[#0c0c0e]/80 flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/40" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500/40" />
              <span className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/40" />
              <span className="text-xs font-mono text-zinc-500 ml-4 flex items-center gap-1.5">
                <BookOpen size={12} className="text-accent-blue" />
                <span>Rise_of_Roman_Empire.pdf</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold bg-white/[0.02] px-3.5 py-1.5 rounded-xl border border-white/[0.04]">
              <Sparkles size={12} className="text-accent-violet animate-pulse" />
              <span>Smart Study Assistant Active</span>
            </div>
          </div>

          {/* Sandbox Workspace Body */}
          <div className="p-6 md:p-8">
            {/* Interactive Workspace Navigation Tabs */}
            <div className="flex items-center gap-2 p-1 bg-white/[0.02] border border-white/[0.04] rounded-xl w-full max-w-md mb-8">
              {[
                { id: 'document', label: '📄 Original Text' },
                { id: 'summary', label: '✨ AI Summary' },
                { id: 'quiz', label: '🎯 Practice Quiz' }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer relative ${
                      isActive 
                        ? 'text-white font-black' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-white/[0.04] border border-white/[0.03] rounded-lg shadow-sm"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sandbox Content Panels */}
            <div className="min-h-[220px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {activeTab === 'document' && (
                  <motion.div
                    key="document"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono uppercase tracking-wider">
                      <span>Source Document Paragraph</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                      <span>Page 4</span>
                    </div>
                    <p className="text-zinc-300 text-sm leading-relaxed font-medium bg-white/[0.01] p-4 rounded-xl border border-white/[0.02]">
                      "The Roman Empire was one of the most powerful civilizations in human history, officially beginning in 27 BC when Julius Caesar’s adopted son, Octavian, was awarded the title of Augustus, becoming the first Emperor. Spanning over three continents at its peak, Rome’s advanced engineering, law, and military organization deeply influenced the modern Western world. However, internal conflicts, economic pressure, and external invasions eventually led to the fall of the Western Empire in 476 AD."
                    </p>
                  </motion.div>
                )}

                {activeTab === 'summary' && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono uppercase tracking-wider">
                      <span>Distilled Study Guide</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-400 font-bold">Generated in 0.8s</span>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { title: '👑 Origin of Empire', desc: "Officially established in **27 BC** with **Augustus** (formerly Octavian) ascending as Rome's very first Emperor.", accent: 'text-accent-blue' },
                        { title: '🌍 Peak Expansion', desc: "Conquered territories across three continents, spreading classical engineering, legal frameworks, and philosophy.", accent: 'text-accent-indigo' },
                        { title: '🏛️ Ultimate Collapse', desc: "Declined and fell in **476 AD** due to structural economic challenges, political divisions, and invasions.", accent: 'text-accent-violet' }
                      ].map((bullet, idx) => (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.15 }}
                          key={bullet.title}
                          className="flex gap-3 items-start p-3 rounded-xl bg-white/[0.01] border border-white/[0.02] hover:bg-white/[0.02]"
                        >
                          <span className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mt-0.5 shadow-sm">
                            <Check size={12} className="stroke-[3]" />
                          </span>
                          <div>
                            <span className={`text-xs font-bold ${bullet.accent} tracking-wide block mb-0.5 uppercase font-mono`}>{bullet.title}</span>
                            <p className="text-xs text-zinc-400 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: bullet.desc.replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-200 font-bold">$1</strong>') }} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'quiz' && (
                  <motion.div
                    key="quiz"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono uppercase tracking-wider justify-between">
                      <div className="flex items-center gap-2">
                        <span>AI Study Quiz</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-violet" />
                        <span>Question 1 of 1</span>
                      </div>
                      {isDemoRunning && (
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full animate-pulse">
                          Simulated Interactive Demo
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      {/* Left: Question & Options (7 cols) */}
                      <div className="md:col-span-7 space-y-3">
                        <h5 className="text-sm font-semibold text-zinc-200 leading-snug">
                          Who was the very first Emperor of the Roman Empire?
                        </h5>
                        
                        <div className="space-y-2">
                          {[
                            { id: 'A', text: 'Julius Caesar', isCorrect: false },
                            { id: 'B', text: 'Augustus (Octavian) 👑', isCorrect: true },
                            { id: 'C', text: 'Nero Claudius', isCorrect: false },
                            { id: 'D', text: 'Marcus Aurelius', isCorrect: false }
                          ].map((opt) => {
                            const isSelected = selectedOption === opt.id;
                            const isOptionCorrect = opt.isCorrect;
                            return (
                              <div
                                key={opt.id}
                                onClick={() => handleOptionClick(opt.id)}
                                className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all duration-300 flex items-center justify-between ${
                                  isSelected
                                    ? isOptionCorrect
                                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)] scale-[1.01]'
                                      : 'bg-red-500/10 border-red-500/40 text-red-400 scale-[1.01]'
                                    : 'bg-white/[0.01] border-white/[0.04] text-zinc-400 hover:bg-white/[0.03] hover:border-white/[0.08] hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors ${
                                    isSelected
                                      ? isOptionCorrect
                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                        : 'bg-red-500/20 border-red-500/40 text-red-400'
                                      : 'bg-white/[0.02] border-white/[0.08] text-zinc-500'
                                  }`}>
                                    {opt.id}
                                  </span>
                                  <span>{opt.text}</span>
                                </div>
                                {isSelected && (
                                  <span>
                                    {isOptionCorrect ? (
                                      <Check size={14} className="text-emerald-400 animate-bounce" />
                                    ) : (
                                      <XCircle size={14} className="text-red-400" />
                                    )}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Explanation Block (5 cols) */}
                      <div className="md:col-span-5 min-h-[140px] flex items-stretch">
                        <AnimatePresence mode="wait">
                          {selectedOption ? (
                            <motion.div
                              key="explanation"
                              initial={{ opacity: 0, scale: 0.96, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.96 }}
                              className={`p-4 rounded-xl border flex flex-col justify-between w-full h-full ${
                                selectedOption === 'B'
                                  ? 'bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/[0.03] border-red-500/20 text-red-400'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider font-bold mb-2 select-none">
                                  {selectedOption === 'B' ? (
                                    <>
                                      <CheckCircle2 size={12} className="text-emerald-400" />
                                      <span className="text-emerald-400">Correct Answer</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle size={12} className="text-red-400" />
                                      <span className="text-red-400">Incorrect Choice</span>
                                    </>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                                  {selectedOption === 'B' 
                                    ? "Excellent! Augustus reigned from 27 BC until his death in 14 AD, initiating the famous 'Pax Romana' era of relative peace."
                                    : "Julius Caesar was a Dictator of Rome, but Augustus (Octavian) was formally named the very first official Emperor of Rome."
                                  }
                                </p>
                              </div>
                              
                              {selectedOption === 'B' && (
                                <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/60 mt-3 font-semibold">
                                  <Award size={11} />
                                  <span>+10 Study Points Earned</span>
                                </div>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div
                              key="prompt"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-4 rounded-xl border border-dashed border-white/[0.05] bg-white/[0.01] flex flex-col items-center justify-center text-center w-full"
                            >
                              <HelpCircle size={24} className="text-zinc-600 mb-2.5 animate-pulse" />
                              <span className="text-xs font-bold text-zinc-400">Test Your Memory</span>
                              <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[180px] mt-1 font-medium">
                                Select an option on the left to see immediate grading feedback!
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 🧬 Core Capabilities Stagger Matrix */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full max-w-6xl px-4 mt-8 mb-28"
      >
        <div className="text-center mb-16 flex flex-col items-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-6"></div>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-500 font-bold mb-3">Core Features</h2>
          <p className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">Everything you need to study smarter</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: FileText,
              title: 'Smart Summaries',
              desc: 'Instantly break down long, difficult documents into simple, readable bullet points.',
              color: 'from-accent-blue/10 to-accent-indigo/10',
              accent: 'accent-blue',
              delay: 0.1
            },
            {
              icon: ListChecks,
              title: 'Practice Quizzes',
              desc: 'Generate customized multiple-choice questions to test your memory and build confidence.',
              color: 'from-accent-indigo/10 to-accent-violet/10',
              accent: 'accent-indigo',
              delay: 0.2
            },
            {
              icon: GitCompare,
              title: 'Multi-File Analysis',
              desc: 'Combine and compare multiple PDFs at once to find common themes and connections.',
              color: 'from-emerald-500/10 to-teal-500/10',
              accent: '[#10b981]',
              delay: 0.3
            },
            {
              icon: BrainCircuit,
              title: 'Interactive AI Chat',
              desc: 'Ask questions about your documents and get instant, clear answers from our AI tutor.',
              color: 'from-rose-500/10 to-accent-violet/10',
              accent: '[#f43f5e]',
              delay: 0.4
            }
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 160, damping: 22, delay: feat.delay }}
              whileHover={{ y: -5 }}
              className="flex"
            >
              <Card className="p-8 w-full flex flex-col justify-between group relative overflow-hidden select-none border border-white/[0.03] bg-[#09090b]/90 backdrop-blur-md rounded-2xl transition-all duration-500 hover:border-white/[0.08]">
                {/* Icon wrapper with HSL-tailored colored rings */}
                <div className={`p-4 rounded-2xl w-fit bg-gradient-to-br ${feat.color} text-${feat.accent} group-hover:scale-110 shadow-lg transition-all duration-500 relative`}>
                  {/* Decorative glowing back-aura */}
                  <div className={`absolute inset-0 rounded-[inherit] bg-${feat.accent} opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-500`} />
                  <feat.icon size={20} className="relative z-10" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-zinc-200 tracking-tight mt-8 group-hover:text-white transition-colors duration-300">{feat.title}</h3>
                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed font-medium">{feat.desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 🔮 "How It Works" Flow System */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-5xl px-4 mb-32 text-center"
      >
        <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-zinc-800 to-transparent mx-auto mb-6" />
        <h2 className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-500 font-bold mb-3">Workflow</h2>
        <p className="text-3xl font-bold tracking-tight text-white mb-16 leading-tight">Master your subjects in 3 simple steps</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            {
              step: '01',
              title: 'Upload Your Files',
              desc: 'Drag and drop any PDF textbook, lecture slides, research paper, or notes. Redora processes the text securely in seconds.',
              icon: FileText
            },
            {
              step: '02',
              title: 'Instant Summaries',
              desc: 'Receive beautifully organized study guides. Highlight key sections, expand complex concepts, or ask our AI tutor for instant explanations.',
              icon: Sparkles
            },
            {
              step: '03',
              title: 'Test & Master',
              desc: 'Generate customized, interactive practice quizzes to test your memory. Review explanations for incorrect answers to solidify your knowledge.',
              icon: GraduationCap
            }
          ].map((item) => (
            <div key={item.step} className="p-6 rounded-2xl border border-white/[0.02] bg-[#070708]/60 hover:bg-[#09090b]/80 hover:border-white/[0.04] transition-all duration-300 relative group">
              <div className="text-4xl font-black font-mono tracking-tighter text-zinc-800 mb-6 group-hover:text-zinc-700 transition-colors">
                {item.step}
              </div>
              <h4 className="text-base font-bold text-white flex items-center gap-2.5">
                <item.icon size={16} className="text-accent-blue" />
                <span>{item.title}</span>
              </h4>
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 🏗 Secure Sign-Up Block */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 }}
        className="w-full max-w-4xl px-4 mb-32"
      >
        <div className="relative rounded-[2.5rem] p-14 text-center border border-white/[0.04] bg-[#070708] overflow-hidden shadow-2xl flex flex-col items-center select-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_70%)] pointer-events-none"></div>
          {/* Atmospheric border glowing wrapper */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <h3 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4 leading-tight">
            Ready to level up your learning?
          </h3>
          <p className="text-zinc-400 text-sm font-medium mb-12 max-w-md leading-relaxed">
            Save your summaries, track your quiz scores, and access all your learning materials in one place.
          </p>
          <Button 
            onClick={() => navigate(user ? '/dashboard' : '/auth')}
            variant="accent"
            size="lg"
            magnetic
            className="h-14 px-12 font-bold text-sm rounded-2xl shadow-xl shadow-accent-violet/10 hover:shadow-accent-violet/20 transition-all duration-300"
          >
            {user ? 'Go to My Dashboard' : 'Create a Free Account'}
          </Button>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
