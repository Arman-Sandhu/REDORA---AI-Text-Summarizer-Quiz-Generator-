import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { FileText, ListChecks, PlayCircle, GitCompare, ArrowRight, Cpu } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { PageWrapper } from '../components/ui/PageWrapper';
import { staggerContainer, listItemReveal } from '../lib/motion';

export default function DashboardScreen() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <PageWrapper className="max-w-5xl px-4 pb-20">
      {/* Header Block */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="relative flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/[0.05] pb-10 mb-12"
      >
        <div>
          <motion.div 
            variants={listItemReveal}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#111] border border-white/[0.04] text-[11px] font-mono font-medium text-zinc-500 mb-4 select-none uppercase tracking-wider"
          >
            <Cpu size={10} /> Dashboard Active
          </motion.div>
          <motion.h1 
            variants={listItemReveal}
            className="text-3xl md:text-5xl font-bold tracking-tight text-white"
          >
            Welcome back, <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent font-extrabold">{user.full_name || 'User'}!</span>
          </motion.h1>
          <motion.p 
            variants={listItemReveal}
            className="text-zinc-500 text-sm md:text-base max-w-md mt-3"
          >
            Logged in as <span className="font-mono text-zinc-400 select-all">{user.email}</span>. Start studying a new topic or review your saved learning materials.
          </motion.p>
        </div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-14"
      >
        {/* Section: Primary Tasks */}
        <motion.div variants={listItemReveal} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-3 bg-zinc-700"></div>
            <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-zinc-500 uppercase">Start Learning</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start New Learning */}
            <Card 
              onClick={() => navigate('/input')}
              className="p-8 flex flex-col justify-between min-h-[180px] cursor-pointer group"
            >
              <div className="flex items-start justify-between w-full">
                <div className="p-3 bg-accent-blue/10 text-accent-blue rounded-xl group-hover:bg-accent-blue group-hover:text-white transition-all">
                  <PlayCircle size={20} />
                </div>
                <ArrowRight size={16} className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-accent-blue transition-colors">Study a Document</h3>
                <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">Upload a document or copy/paste your notes to get simple summaries and quizzes.</p>
              </div>
            </Card>

            {/* Multi-PDF Pipeline */}
            <Card 
              onClick={() => navigate('/pipeline')}
              className="p-8 flex flex-col justify-between min-h-[180px] cursor-pointer group"
            >
              <div className="flex items-start justify-between w-full">
                <div className="p-3 bg-[#10b981]/10 text-[#10b981] rounded-xl group-hover:bg-[#10b981] group-hover:text-white transition-all">
                  <GitCompare size={20} />
                </div>
                <ArrowRight size={16} className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-[#10b981] transition-colors">Compare & Study Documents</h3>
                <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">Upload multiple documents to find how they fit together and study them unified.</p>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Section: History */}
        <motion.div variants={listItemReveal} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-3 bg-zinc-700"></div>
            <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-zinc-500 uppercase">Your Saved Work</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Review Old Summaries */}
            <Card 
              onClick={() => navigate('/summaries')}
              className="p-8 flex flex-col justify-between min-h-[180px] cursor-pointer group"
            >
              <div className="flex items-start justify-between w-full">
                <div className="p-3 bg-accent-violet/10 text-accent-violet rounded-xl group-hover:bg-accent-violet group-hover:text-white transition-all">
                  <FileText size={20} />
                </div>
                <ArrowRight size={16} className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-accent-violet transition-colors">Saved Summaries</h3>
                <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">Review and study all your past summaries in one place.</p>
              </div>
            </Card>

            {/* Review Old MCQs */}
            <Card 
              onClick={() => navigate('/history')}
              className="p-8 flex flex-col justify-between min-h-[180px] cursor-pointer group"
            >
              <div className="flex items-start justify-between w-full">
                <div className="p-3 bg-[#f43f5e]/10 text-[#f43f5e] rounded-xl group-hover:bg-[#f43f5e] group-hover:text-white transition-all">
                  <ListChecks size={20} />
                </div>
                <ArrowRight size={16} className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-[#f43f5e] transition-colors">Quiz History</h3>
                <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">Check your past quiz scores and review the questions you attempted.</p>
              </div>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
