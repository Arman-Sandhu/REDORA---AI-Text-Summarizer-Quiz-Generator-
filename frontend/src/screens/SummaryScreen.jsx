import React, { useState, useContext, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BrainCircuit, Loader, Save, Download, MessageSquare, Send, X, CheckCircle, ChevronRight, BookOpen } from 'lucide-react';
import jsPDF from 'jspdf';
import { PageWrapper } from '../components/ui/PageWrapper';

// Reusable custom components
import StepperInput from '../components/shared/StepperInput';
import GlowButton from '../components/shared/GlowButton';
import Toast from '../components/shared/Toast';

export default function SummaryScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const chatContainerRef = useRef(null);

  const [mcqSource, setMcqSource] = useState('original');
  const [numMCQs, setNumMCQs] = useState(5);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [summaryTitle, setSummaryTitle] = useState('');

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  if (!state || !state.sections) {
    return <Navigate to="/input" />;
  }

  const { sections, originalText } = state;

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  const handleGenerateMCQs = async () => {
    setError('');
    setLoading(true);
    
    let textToUse = mcqSource === 'original' 
      ? originalText 
      : sections.map(s => `${s.heading}\n${s.lines.join('\n')}`).join('\n\n');

    try {
      const response = await axios.post('/api/generate-mcq', {
        summary_text: textToUse,
        num_mcqs: parseInt(numMCQs),
        source_type: "From Summary"
      });
      
      navigate('/attempt', { state: { mcqs: response.data, summarySections: sections } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSummary = () => {
    if (!user) return showToast("Please log in to save your summary.", "error");
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateFormatted = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
    setSummaryTitle("Unified Review - " + dateFormatted);
    setIsSaveModalOpen(true);
  };

  const submitSaveSummary = async () => {
    setSaving(true);
    try {
      await axios.post('/api/summaries', {
        title: summaryTitle.trim(),
        content: sections
      });
      setIsSaveModalOpen(false);
      showToast("Summary successfully saved to your dashboard!", "success");
    } catch (err) {
      showToast("Failed to save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("REDORA", 105, 20, null, null, "center");
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Study Summary Notes", 105, 28, null, null, "center");
    
    let y = 50;
    sections.forEach((sec) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(sec.heading.toUpperCase(), 20, y);
      y += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      sec.lines.forEach(line => {
        if (y > 280) { doc.addPage(); y = 20; }
        const splitText = doc.splitTextToSize("• " + line, 170);
        doc.text(splitText, 25, y);
        y += splitText.length * 6;
      });
      y += 8;
    });
    doc.save("Redora_Study_Summary.pdf");
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const question = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: question }]);
    setChatInput('');
    setChatLoading(true);

    const summaryContext = sections.map(s => `${s.heading}\n${s.lines.join('\n')}`).join('\n\n');

    try {
      const res = await axios.post('/api/chat-summary', {
        summary_context: summaryContext,
        question,
      });
      setChatMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Could not connect to AI. Please try asking again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <PageWrapper className="max-w-4xl px-4 pb-32 relative overflow-visible text-slate-200">
      
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />

      {/* Header Sequence */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.05] pb-8 mb-12 select-none">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-white/[0.04] text-[10px] font-mono text-cyan-400 mb-4 uppercase tracking-wider">
            <BookOpen size={11} /> Ready
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-display text-gradient">Summary Details</h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">Review the main points and details generated for you.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl bg-slate-900 border border-white/[0.04] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>Download PDF</span>
          </button>
          
          <button
            onClick={handleSaveSummary}
            disabled={saving}
            className="flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer disabled:opacity-40"
          >
            <Save size={13} />
            <span>{saving ? 'Saving...' : 'Save to Dashboard'}</span>
          </button>
        </div>
      </div>

      {/* Summary Bullet Sections */}
      <div className="space-y-5">
        {sections.map((section, i) => (
          <div 
            key={section.id || i}
            className="p-8 bg-[#0f1117]/30 border border-white/[0.04] rounded-3xl relative overflow-hidden shadow-xl"
          >
            {/* Watermark decoration */}
            <div className="absolute right-6 top-2 text-6xl font-extrabold text-white/[0.012] font-display select-none">
              0{i + 1}
            </div>

            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-6 flex items-center gap-3 select-none">
              <span className="w-5 h-5 rounded-full bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                {i + 1}
              </span>
              {section.heading}
            </h3>
            <ul className="space-y-3.5">
              {section.lines.map((line, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs text-slate-400 leading-relaxed font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Practice Quiz Setup card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12"
      >
        <div className="p-8 bg-[#0f1117]/30 border border-white/[0.04] rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b border-white/[0.03]">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-2xl select-none">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-tight font-sans">Practice Quiz</h3>
              <p className="text-slate-500 text-[10px] mt-0.5 font-medium">Create a custom multiple-choice quiz to test yourself.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 select-none">Based on:</span>
              <div className="flex bg-slate-950/40 p-1.5 border border-white/[0.04] rounded-2xl gap-1.5 max-w-md w-full">
                <button 
                  onClick={() => setMcqSource('original')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${mcqSource === 'original' ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  The full document
                </button>
                <button 
                  onClick={() => setMcqSource('summary')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${mcqSource === 'summary' ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  The summary
                </button>
              </div>
            </div>

            <div className="max-w-xs">
              <StepperInput
                label="How many questions?"
                value={numMCQs}
                onChange={setNumMCQs}
                min={1}
                max={30}
              />
            </div>

            {error && (
              <div className="text-red-400 bg-red-500/5 border border-red-500/10 p-4 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="pt-2">
              <GlowButton 
                onClick={handleGenerateMCQs} 
                disabled={loading}
                className="w-full py-4 rounded-2xl font-semibold"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={14} />
                    <span>Thinking... / Working on it...</span>
                  </>
                ) : (
                  <>Make quiz questions</>
                )}
              </GlowButton>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Chat Toggle (only when viewing a summary) */}
      <AnimatePresence>
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 border border-cyan-500/30 text-white flex items-center justify-center shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/20 hover:scale-105 active:scale-95 transition-all cursor-pointer z-50 select-none"
            title="Chat about this summary"
          >
            <MessageSquare size={18} />
          </button>
        )}

        {/* Chat Drawer Panel */}
        {chatOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-6 right-6 w-[360px] h-[460px] bg-[#0f1117]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            <div className="flex justify-between items-center px-4 py-3 bg-slate-950/40 border-b border-white/[0.03] select-none">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Chat about this summary</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white transition-colors p-1 cursor-pointer">
                <X size={15} />
              </button>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-transparent">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 px-6 space-y-2 select-none mt-16">
                  <MessageSquare size={28} className="text-cyan-400" />
                  <div>
                    <p className="text-xs font-bold text-white">How can I help?</p>
                    <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto mt-1">Ask me any questions about the summary above.</p>
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-cyan-500/20 to-violet-600/20 border border-cyan-500/30 text-white rounded-br-none'
                      : 'bg-[#161b27]/80 border border-white/[0.04] text-slate-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#161b27]/85 p-3 rounded-2xl rounded-bl-none border border-white/[0.04] flex items-center justify-center select-none">
                    <Loader size={12} className="animate-spin text-cyan-400" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/[0.03] bg-slate-950/40">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                  placeholder="Ask a question..."
                  className="flex-1 bg-slate-900 border border-white/[0.04] rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
                />
                <button
                  onClick={handleChatSend}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-violet-600 text-white p-2.5 rounded-xl hover:shadow-cyan-400/20 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SAVE SUMMARY DIALOG MODAL */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSaveModalOpen(false)}
              className="absolute inset-0 bg-[#07080f]/80 backdrop-blur-md"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0f1117] p-8 shadow-2xl z-10 space-y-6"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-400 uppercase tracking-wider select-none">
                  Save Workspace
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white">Save Study Summary</h3>
                <p className="text-slate-400 text-xs leading-relaxed">Give your summary a descriptive name so you can easily locate it later on your dashboard.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 select-none">Summary Title</label>
                <input
                  type="text"
                  placeholder="e.g., Biology Chapter 1, Lecture Notes..."
                  value={summaryTitle}
                  onChange={(e) => setSummaryTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.04] rounded-2xl px-4 py-3.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 font-bold"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/[0.02]"
                >
                  Cancel
                </button>
                <button
                  onClick={submitSaveSummary}
                  disabled={saving || !summaryTitle.trim()}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 text-xs font-bold text-slate-950 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10"
                >
                  {saving ? (
                    <Loader className="animate-spin" size={13} />
                  ) : (
                    <>
                      <CheckCircle size={13} />
                      <span>Confirm Save</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
