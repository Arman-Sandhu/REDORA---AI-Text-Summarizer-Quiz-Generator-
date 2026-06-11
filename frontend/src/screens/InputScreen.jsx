import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText, Type, UploadCloud, Settings, Sparkles, ArrowRight, Trash2, Loader, BookOpen, AlertCircle } from 'lucide-react';
import { PageWrapper } from '../components/ui/PageWrapper';

// Reusable components
import StepperInput from '../components/shared/StepperInput';
import GlowButton from '../components/shared/GlowButton';
import GlassCard from '../components/shared/GlassCard';
import Toast from '../components/shared/Toast';

// Setup pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function InputScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('text');
  const [inputText, setInputText] = useState('');
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState([]);
  
  const [linesPerSection, setLinesPerSection] = useState(5);
  const [numSections, setNumSections] = useState(3);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const tabs = [
    { id: 'text', label: 'Paste notes', icon: Type },
    { id: 'topic', label: 'Pick a topic', icon: Sparkles },
    { id: 'pdf', label: 'Add documents', icon: FileText }
  ];

  const handleFileUpload = async (e) => {
    const newFiles = Array.from(e.target.files).slice(0, 10 - files.length);
    if (newFiles.length === 0) return;

    setLoading(true);
    const parsedFiles = [];
    
    for (const file of newFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + ' ';
        }
        parsedFiles.push({ name: file.name, size: file.size, text });
      } catch (err) {
        console.error(`Failed to parse ${file.name}`, err);
        setError(`Failed to read: ${file.name}`);
      }
    }
    
    setFiles([...files, ...parsedFiles]);
    setLoading(false);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleSummarize = async () => {
    setError('');
    let textToSummarize = '';

    if (activeTab === 'text') {
      if (!inputText.trim()) return setError('Text area is empty. Please insert content.');
      textToSummarize = inputText;
    } else if (activeTab === 'topic') {
      if (!topic.trim()) return setError('Please enter a topic.');
      textToSummarize = `Please provide a comprehensive overview about: ${topic}.`;
    } else if (activeTab === 'pdf') {
      if (files.length === 0) return setError('Please upload at least one PDF file.');
      textToSummarize = files.map(f => `--- Source: ${f.name} ---\n${f.text}`).join('\n\n');
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/summarize', {
        text: textToSummarize,
        num_sections: parseInt(numSections),
        lines_per_section: parseInt(linesPerSection)
      });
      
      const summaryText = response.data.summary_text;
      
      // Parse sections
      const sections = [];
      const parts = summaryText.split(/SECTION \d+:/i);
      parts.shift();
      
      parts.forEach((part, index) => {
        const lines = part.trim().split('\n');
        const heading = lines[0].trim();
        const contentLines = lines.slice(1).filter(l => l.trim() !== '');
        sections.push({
          id: index + 1,
          heading: heading.replace(/^\[|\]$/g, ''),
          lines: contentLines
        });
      });

      navigate('/summary', { state: { sections, originalText: textToSummarize } });

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="max-w-4xl px-4 pb-24 text-slate-200">
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      {/* Header Block */}
      <div className="mb-10 select-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-white/[0.04] text-[10px] font-mono text-cyan-400 mb-4 uppercase tracking-wider">
          <BookOpen size={11} /> Study Workspace
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gradient">Start Studying</h1>
        <p className="text-slate-400 text-xs mt-2 max-w-md">Choose where you want to get your learning materials from.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Primary Input Card Container */}
        <div className="border border-white/[0.04] bg-[#0f1117]/30 backdrop-blur-xl overflow-hidden rounded-3xl shadow-xl">
          
          {/* Segmented Controller Tab Selector */}
          <div className="flex border-b border-white/[0.03] bg-slate-950/20 px-2 pt-2 gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError('');
                  }}
                  className={`relative flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-mono uppercase tracking-wider font-bold select-none transition-colors outline-none cursor-pointer ${active ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-violet-500"
                    />
                  )}
                  <Icon size={13} className={active ? 'text-cyan-400' : 'text-current'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Input Area */}
          <div className="p-8 min-h-[300px] flex flex-col justify-center relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="h-full w-full"
              >
                {activeTab === 'text' && (
                  <textarea
                    className="w-full min-h-[240px] bg-transparent border-0 p-0 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-0 resize-y leading-relaxed font-sans"
                    placeholder="Paste your notes, lecture transcripts, or any text you want to study here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                )}

                {activeTab === 'topic' && (
                  <div className="flex flex-col justify-center h-[240px] max-w-md mx-auto w-full space-y-4">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 select-none">Describe Your Topic</label>
                    <input
                      type="text"
                      placeholder="e.g., Photosynthesis, World War 2, Machine Learning..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full bg-slate-900 border border-white/[0.04] rounded-2xl px-4 py-3.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 font-bold"
                    />
                    <p className="text-[11px] text-slate-500 leading-relaxed select-none">
                      Our AI will automatically find the information and construct an beautifully organized study summary.
                    </p>
                  </div>
                )}

                {activeTab === 'pdf' && (
                  <div className="h-full min-h-[240px] flex flex-col">
                    <label className="border border-dashed border-white/[0.08] hover:border-cyan-500/30 rounded-2xl flex-1 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#0f1117]/20 hover:bg-[#0f1117]/40 group p-8">
                      <div className="p-4 bg-slate-900 text-slate-500 rounded-2xl mb-3 group-hover:text-cyan-400 transition-colors group-hover:bg-slate-900 border border-white/[0.04]">
                        <UploadCloud size={28} />
                      </div>
                      <span className="text-slate-200 text-xs font-bold">Drop your files here / Add your documents</span>
                      <span className="text-slate-600 text-[10px] font-mono mt-1">UP TO 10 DOCUMENTS</span>
                      <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={loading} />
                    </label>

                    <AnimatePresence>
                      {files.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-6 space-y-2 overflow-hidden"
                        >
                          <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-2 select-none">
                            <span>Selected Files ({files.length})</span>
                            <div className="flex-1 h-[1px] bg-white/[0.03]"></div>
                          </div>
                          <div className="max-h-[140px] overflow-y-auto space-y-2 pr-2">
                            {files.map((file, i) => (
                              <motion.div 
                                key={i} 
                                initial={{ scale: 0.98, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex justify-between items-center bg-[#0f1117]/30 border border-white/[0.04] py-2 px-3.5 rounded-xl"
                              >
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                  <FileText size={14} className="text-slate-500 flex-shrink-0" />
                                  <span className="truncate text-[11px] text-slate-300 font-mono">{file.name}</span>
                                </div>
                                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                                  <span className="text-[10px] font-mono text-slate-600 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                  <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 transition-colors outline-none p-1 cursor-pointer">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Settings GlassCard Customization */}
        <div className="p-8 bg-[#0f1117]/30 backdrop-blur-xl border border-white/[0.04] rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.03] select-none">
            <div className="p-2.5 bg-slate-900 border border-white/[0.04] text-slate-400 rounded-xl">
              <Settings size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-tight">Customization Settings</h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Choose how detailed your study guide should be.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StepperInput
              label="How many sections?"
              value={numSections}
              onChange={setNumSections}
              min={1}
              max={10}
            />
            <StepperInput
              label="Lines in each section"
              value={linesPerSection}
              onChange={setLinesPerSection}
              min={1}
              max={20}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 bg-red-400/5 border border-red-400/10 p-3.5 rounded-2xl text-[11px] font-semibold mt-4 flex items-center gap-2"
            >
              <AlertCircle size={13} />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="pt-4">
            <GlowButton 
              onClick={handleSummarize} 
              disabled={loading}
              className="w-full text-xs font-bold py-4"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin text-white" size={14} />
                  <span>Thinking... / Working on it...</span>
                </>
              ) : (
                <>
                  <span>Create a summary</span>
                  <ArrowRight size={14} />
                </>
              )}
            </GlowButton>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
