import React, { useState, useContext } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle2, XCircle, ChevronRight, Save, Download, RotateCcw, Award } from 'lucide-react';
import jsPDF from 'jspdf';
import Toast from '../components/shared/Toast';
import GlowButton from '../components/shared/GlowButton';

export default function AttemptScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  if (!state || !state.mcqs) {
    return <Navigate to="/input" />;
  }

  const { mcqs, summarySections } = state;
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSelectOption = (qIndex, optionKey) => {
    if (submitted) return;
    setAnswers({ ...answers, [qIndex]: optionKey });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    
    if (user) {
      let attemptCount = 0;
      for (let i = 0; i < mcqs.length; i++) {
        const mcq = mcqs[i];
        const selected = answers[i];
        if (selected) {
          attemptCount++;
          try {
            const token = localStorage.getItem('token');
            await axios.post('/api/mcq-history', {
              question: mcq.question,
              wrong_answer: mcq.options[selected] || 'No Answer',
              correct_answer: mcq.options[mcq.correct],
              explanation: mcq.explanation
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (err) {
            console.error("Failed to save quiz to history", err);
          }
        }
      }
      if (attemptCount > 0) {
        showToast("Quiz submitted and automatically saved to history!");
      }
    }
  };

  const score = Object.keys(answers).filter(i => answers[i] === mcqs[i].correct).length;
  const percentage = (score / mcqs.length) * 100;
  
  let label = "Needs Revision";
  let labelColor = "text-red-400";
  if (percentage >= 80) { label = "Excellent"; labelColor = "text-emerald-400"; }
  else if (percentage >= 50) { label = "Good Job"; labelColor = "text-yellow-400"; }

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Practice Quiz", 105, 20, null, null, "center");
    
    let y = 40;
    mcqs.forEach((mcq, i) => {
      if (y > 250) { doc.addPage(); y = 20; }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const qText = doc.splitTextToSize(`Q${i+1}. ${mcq.question}`, 170);
      doc.text(qText, 20, y);
      y += qText.length * 6 + 2;
      
      doc.setFont("helvetica", "normal");
      Object.keys(mcq.options).forEach(opt => {
        const optText = doc.splitTextToSize(`${opt}) ${mcq.options[opt]}`, 160);
        doc.text(optText, 30, y);
        y += optText.length * 6;
      });
      
      if (submitted) {
        y += 5;
        doc.setFont("helvetica", "italic");
        doc.text(`Correct Answer: ${mcq.correct}`, 30, y);
        y += 6;
      }
      y += 5;
    });

    if (submitted) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Final Score: ${score} / ${mcqs.length} (${percentage.toFixed(0)}%)`, 105, y, null, null, "center");
    }

    doc.save("Redora_Practice_Quiz.pdf");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-32 text-slate-200">
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      {!submitted ? (
        <>
          <div className="text-center mb-10 select-none">
            <h1 className="text-3xl font-bold font-display text-white mb-2">Practice Quiz</h1>
            <p className="text-slate-400 text-xs font-medium">Answer the following {mcqs.length} questions to test your understanding.</p>
          </div>

          <div className="space-y-6">
            {mcqs.map((mcq, i) => (
              <div 
                key={i} 
                className="p-6 rounded-3xl border border-white/[0.04] bg-[#0f1117]/30 shadow-xl space-y-4"
              >
                <h3 className="text-xs font-bold leading-relaxed text-white flex items-start gap-3">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20 flex-shrink-0 select-none">
                    Q{i+1}
                  </span> 
                  <span>{mcq.question}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {Object.entries(mcq.options).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => handleSelectOption(i, key)}
                      className={`text-left p-3.5 rounded-2xl text-[11px] font-medium border transition-all cursor-pointer ${
                        answers[i] === key 
                          ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-inner shadow-cyan-500/10 scale-[1.01]' 
                          : 'bg-slate-900/40 border-white/[0.03] text-slate-300 hover:border-white/[0.08] hover:text-white'
                      }`}
                    >
                      <span className="w-5 h-5 rounded bg-slate-950 inline-flex items-center justify-center font-mono font-bold text-slate-500 text-[10px] mr-2.5">
                        {key}
                      </span> 
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-8">
            <GlowButton 
              onClick={handleSubmit} 
              disabled={Object.keys(answers).length !== mcqs.length}
              className="w-full md:w-auto px-8 py-3.5"
            >
              Submit & See Score
            </GlowButton>
          </div>
        </>
      ) : (
        <div className="space-y-10">
          <div className="p-8 rounded-3xl border border-white/[0.05] bg-[#0f1117]/30 shadow-2xl text-center space-y-6">
            <h2 className="text-2xl font-bold font-display text-white">Quiz Results</h2>
            
            <div className="relative inline-flex items-center justify-center w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                <circle 
                  cx="80" cy="80" r="70" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray="439.82" 
                  strokeDashoffset={439.82 - (439.82 * percentage) / 100}
                  className="text-cyan-400 transition-all duration-1000 ease-out" 
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black font-display">{score}/{mcqs.length}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${labelColor}`}>{label}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <button 
                onClick={handleDownloadPDF} 
                className="flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-xl bg-slate-900 border border-white/[0.04] text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <Download size={14} /> Download PDF
              </button>
              
              <button 
                onClick={() => navigate('/input')} 
                className="flex items-center gap-2 text-slate-500 hover:text-slate-200 transition-colors py-2 px-4 text-xs font-bold cursor-pointer"
              >
                <RotateCcw size={14} /> New Session
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold font-display text-center text-white">Detailed Review</h3>
            {mcqs.map((mcq, i) => {
              const isCorrect = answers[i] === mcq.correct;
              
              return (
                <div 
                  key={i} 
                  className={`p-6 rounded-3xl border ${isCorrect ? 'border-emerald-500/30 bg-emerald-500/[0.01]' : 'border-red-500/30 bg-red-500/[0.01]'} relative shadow-xl space-y-4`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xs font-bold flex-1 leading-relaxed text-white">
                      <span className="text-[10px] font-mono font-bold text-slate-500 mr-2">Q{i+1}</span> 
                      {mcq.question}
                    </h3>
                    {isCorrect ? (
                      <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                    ) : (
                      <XCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(mcq.options).map(([key, value]) => {
                      let bgColor = "bg-slate-900/40 border-white/[0.03] text-slate-400";
                      
                      if (key === mcq.correct) {
                        bgColor = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold";
                      } else if (key === answers[i] && !isCorrect) {
                        bgColor = "bg-red-500/10 border-red-500/30 text-red-400 line-through font-bold";
                      }

                      return (
                        <div key={key} className={`p-3 rounded-2xl border text-[11px] font-medium leading-relaxed ${bgColor}`}>
                          <span className="font-bold mr-2 text-[10px] font-mono">{key}</span> {value}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/[0.04] text-slate-300 text-xs">
                    <span className="text-cyan-400 font-bold block mb-1.5 font-mono text-[9px] uppercase tracking-wider">Explanation:</span>
                    <span className="leading-relaxed font-sans">{mcq.explanation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
