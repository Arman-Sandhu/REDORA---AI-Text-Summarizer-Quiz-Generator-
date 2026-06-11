import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Download, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import Toast from '../components/shared/Toast';

export default function HistoryScreen() {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  
  if (!user) {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/mcq-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your entire quiz history?")) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete('/api/mcq-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory([]);
      setToastMessage("Quiz history cleared!");
    } catch (err) {
      console.error("Failed to clear history", err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this history item?")) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/mcq-history/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(prev => prev.filter(item => item.id !== itemId));
      setToastMessage("Question deleted!");
    } catch (err) {
      console.error("Failed to delete history item", err);
    }
  };

  const handleDownloadPDF = () => {
    if (history.length === 0) return;
    
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("My Quiz History", 105, 20, null, null, "center");
    
    let y = 40;
    history.forEach((item, i) => {
      if (y > 250) { doc.addPage(); y = 20; }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const qText = doc.splitTextToSize(`Q${i+1}. ${item.question}`, 170);
      doc.text(qText, 20, y);
      y += qText.length * 6 + 2;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 53, 69); // Red
      doc.text(`Your Answer: ${item.wrong_answer}`, 25, y);
      y += 6;
      
      doc.setTextColor(40, 167, 69); // Green
      doc.text(`Correct Answer: ${item.correct_answer}`, 25, y);
      y += 8;
      
      doc.setTextColor(0, 0, 0); // Black
      doc.setFont("helvetica", "italic");
      const expText = doc.splitTextToSize(`Explanation: ${item.explanation}`, 160);
      doc.text(expText, 25, y);
      y += expText.length * 6 + 5;
    });

    doc.save("Redora_Quiz_History.pdf");
  };

  if (loading) {
    return <div className="text-center py-20 text-cyan-400 font-bold animate-pulse">Loading History...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 text-slate-200">
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/[0.05] pb-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-white mb-2">Quiz History</h1>
          <p className="text-slate-400 text-xs font-medium">Review your past practice quiz questions and track your progress.</p>
        </div>
        
        {history.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-xl bg-slate-900 border border-white/[0.04] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={14} /> Clear All
            </button>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.04] text-center py-20 bg-[#0f1117]/10 space-y-4">
          <BookOpen size={64} className="mx-auto text-slate-700 mb-2 animate-pulse" />
          <h2 className="text-xl font-bold text-slate-400">No practice items yet!</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">Keep practicing. Any quiz questions you attempt anywhere will automatically appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((item, i) => {
            const isCorrect = item.wrong_answer === item.correct_answer || item.wrong_answer === "None (Correct Attempt)";
            return (
              <div 
                key={item.id} 
                className={`p-6 rounded-3xl border ${isCorrect ? 'border-emerald-500/30 bg-emerald-500/[0.01]' : 'border-red-500/30 bg-red-500/[0.01]'} relative shadow-xl space-y-4`}
              >
                {/* Trash button */}
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-start gap-4 pr-8">
                  {isCorrect ? (
                    <CheckCircle2 className="text-emerald-400 shrink-0 mt-1" size={18} />
                  ) : (
                    <XCircle className="text-red-400 shrink-0 mt-1" size={18} />
                  )}
                  <h3 className="text-xs font-bold leading-relaxed text-white">{item.question}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-10">
                  {isCorrect ? (
                    <div className="col-span-2 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl text-emerald-300 text-xs font-semibold">
                      <span className="text-[9px] uppercase font-bold block mb-1 text-emerald-400 font-mono tracking-wider">✓ Answered Correctly</span>
                      {item.correct_answer}
                    </div>
                  ) : (
                    <>
                      <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-2xl text-red-300 text-xs font-semibold">
                        <span className="text-[9px] uppercase font-bold block mb-1 text-red-400 font-mono tracking-wider">✕ Your Answer</span>
                        {item.wrong_answer}
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl text-emerald-300 text-xs font-semibold">
                        <span className="text-[9px] uppercase font-bold block mb-1 text-emerald-400 font-mono tracking-wider">✓ Correct Answer</span>
                        {item.correct_answer}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="pl-10">
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/[0.04] text-slate-300 text-xs">
                    <span className="text-cyan-400 font-bold block mb-1.5 font-mono text-[9px] uppercase tracking-wider">Explanation:</span>
                    <span className="leading-relaxed font-sans">{item.explanation}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
