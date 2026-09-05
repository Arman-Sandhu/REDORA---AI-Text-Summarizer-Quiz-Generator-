import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { AuthContext } from '../context/AuthContext';
import { FileText, Loader, ArrowLeft, MessageCircle, Send, X, Calendar, BookOpen, Trash2, Download } from 'lucide-react';
import Toast from '../components/shared/Toast';

export default function SummaryHistoryScreen() {
  const { user } = useContext(AuthContext);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSummary, setSelectedSummary] = useState(null);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  const fetchSummaries = async () => {
    try {
      const response = await axios.get('/api/summaries', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSummaries(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load summaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading || !selectedSummary) return;
    const question = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: question }]);
    setChatInput('');
    setChatLoading(true);

    const summaryContext = selectedSummary.content
      .map(s => `${s.heading}\n${s.lines.join('\n')}`)
      .join('\n\n');

    try {
      const res = await axios.post('/api/chat-summary', {
        summary_context: summaryContext,
        question,
      });
      setChatMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I could not process your question. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSelectSummary = (summary) => {
    setSelectedSummary(summary);
    setChatMessages([]);
    setChatOpen(false);
  };

  const handleDownloadPDF = (summary) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("REDORA", 105, 20, null, null, "center");
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Study Summary Notes", 105, 28, null, null, "center");
    
    // Summary Title Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    const titleLines = doc.splitTextToSize(summary.title, 170);
    doc.text(titleLines, 20, 42);
    
    let y = 42 + (titleLines.length * 6) + 6;
    summary.content.forEach((sec) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
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
    
    // Clean filename
    const cleanTitle = summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 30);
    doc.save(`Redora_${cleanTitle || 'Summary'}.pdf`);
    showToast("PDF Download started!", "success");
  };

  const handleDeleteSummary = async (summaryId) => {
    if (!window.confirm("Are you sure you want to delete this study summary? This action cannot be undone.")) return;
    
    try {
      await axios.delete(`/api/summaries/${summaryId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast("Summary deleted successfully!", "success");
      if (selectedSummary && selectedSummary.id === summaryId) {
        setSelectedSummary(null);
        setChatOpen(false);
      }
      fetchSummaries();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete summary.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader className="animate-spin text-cyan-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 text-slate-200">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />

      <div className="flex items-center gap-3.5 border-b border-white/[0.05] pb-6">
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl select-none">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-white mb-1.5">Saved Summaries</h1>
          <p className="text-slate-400 text-xs font-medium">Review and study all your past summaries in one place.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}

      {selectedSummary ? (
        <div className="premium-glass rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden bg-[#0f1117]/60">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/[0.04] pb-4 select-none">
            <h2 className="text-lg font-bold text-white leading-snug">{selectedSummary.title}</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setSelectedSummary(null); setChatOpen(false); }}
                className="py-2 px-4 text-xs font-bold rounded-xl bg-slate-900 border border-white/[0.04] text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <ArrowLeft size={13} /> Back to list
              </button>
              <button 
                onClick={() => handleDownloadPDF(selectedSummary)}
                className="py-2 px-4 text-xs font-bold rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 animate-fade-in"
              >
                <Download size={13} /> Download PDF
              </button>
              <button 
                onClick={() => handleDeleteSummary(selectedSummary.id)}
                className="py-2 px-4 text-xs font-bold rounded-xl bg-red-950/20 border border-red-500/20 hover:bg-red-500/20 text-red-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shrink-0 animate-fade-in"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {selectedSummary.content.map((section, idx) => (
              <div 
                key={section.id || idx} 
                className="bg-slate-900/30 p-6 rounded-2xl border border-white/[0.03] space-y-3 relative"
              >
                {/* Numeral watermark */}
                <div className="absolute right-6 top-2 text-5xl font-extrabold text-white/[0.015] font-display select-none">
                  {idx + 1}
                </div>

                <h3 className="text-xs font-mono font-bold text-cyan-400 tracking-wider flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center text-[9px] font-bold">
                    {idx + 1}
                  </span>
                  {section.heading}
                </h3>
                <ul className="space-y-2 text-xs text-slate-400">
                  {section.lines.map((line, lineIdx) => (
                    <li key={lineIdx} className="flex items-start gap-2.5 leading-relaxed font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {summaries.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border border-dashed border-white/[0.04] bg-[#0f1117]/10 space-y-4">
              <BookOpen size={64} className="mx-auto text-slate-700 mb-2 animate-pulse" />
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">You haven't saved any summaries yet. Complete a study session in Compare & Study to save summaries here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summaries.map((summary) => (
                <div 
                  key={summary.id} 
                  className="p-6 rounded-3xl border border-white/[0.04] bg-[#0f1117]/30 hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[140px] shadow-xl group"
                  onClick={() => handleSelectSummary(summary)}
                >
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors leading-snug line-clamp-2" title={summary.title}>
                      {summary.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium font-sans mt-2 select-none">
                      <Calendar size={11} />
                      <span>
                        {(() => {
                          const dateStr = summary.created_at;
                          const cleanStr = dateStr && !dateStr.endsWith('Z') && !dateStr.includes('+') ? dateStr + 'Z' : dateStr;
                          const dateObj = new Date(cleanStr);
                          const pad = (n) => String(n).padStart(2, '0');
                          const dateFormatted = `${pad(dateObj.getDate())}/${pad(dateObj.getMonth() + 1)}/${String(dateObj.getFullYear()).slice(-2)}`;
                          return `Saved on ${dateFormatted} at ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-cyan-400 mt-4 border-t border-white/[0.02] pt-3 flex items-center justify-between select-none">
                    <span>Open Summary</span>
                    <div className="flex items-center gap-2 relative z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(summary);
                        }}
                        className="text-slate-500 hover:text-cyan-400 p-1.5 hover:bg-cyan-500/10 rounded-xl transition-all cursor-pointer"
                        title="Download PDF"
                      >
                        <Download size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSummary(summary.id);
                        }}
                        className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer animate-fade-in"
                        title="Delete summary"
                      >
                        <Trash2 size={13} />
                      </button>
                      <span className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all">➔</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Chat Toggle */}
      {selectedSummary && !chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 border border-cyan-500/30 text-white flex items-center justify-center shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/20 hover:scale-105 active:scale-95 transition-all cursor-pointer z-50 select-none"
          title="Chat about this summary"
        >
          <MessageCircle size={18} />
        </button>
      )}

      {/* Chat Panel Drawer */}
      {chatOpen && selectedSummary && (
        <div className="fixed bottom-6 right-6 w-[360px] h-[460px] bg-[#0f1117]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 bg-slate-950/40 border-b border-white/[0.03] select-none">
            <div className="flex items-center gap-2">
              <MessageCircle size={15} className="text-cyan-400" />
              <span className="text-xs font-bold text-white">Chat about this summary</span>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white transition-colors p-1 cursor-pointer">
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center text-slate-500 mt-12 space-y-2 select-none">
                <MessageCircle size={28} className="mx-auto opacity-40 animate-pulse text-cyan-400" />
                <p className="text-xs font-bold text-slate-400">Ask any question about this summary</p>
                <p className="text-[10px] text-slate-600 leading-relaxed max-w-[200px] mx-auto">e.g., "Can you explain the second part in simpler terms?"</p>
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
                placeholder="Ask about the summary..."
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
        </div>
      )}
    </div>
  );
}
