import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { 
  UploadCloud, FileText, Loader, Search, Sparkles, 
  ArrowRight, Trash2, MessageSquare, ChevronDown, ChevronUp, 
  Send, Layers, Check, X, HelpCircle, CheckCircle2, XCircle,
  BookOpen
} from 'lucide-react';
import { PageWrapper } from '../components/ui/PageWrapper';
import { AuthContext } from '../context/AuthContext';

// Import our custom premium shared components
import StepperInput from '../components/shared/StepperInput';
import AnimatedToggle from '../components/shared/AnimatedToggle';
import GlowButton from '../components/shared/GlowButton';
import GlassCard from '../components/shared/GlassCard';
import ProgressSteps from '../components/shared/ProgressSteps';
import SkeletonLoader from '../components/shared/SkeletonLoader';
import Toast from '../components/shared/Toast';
import SelectableCard from '../components/shared/SelectableCard';
import SourceBadge from '../components/shared/SourceBadge';
import EmptyState from '../components/shared/EmptyState';


export default function AdvancedPipelineScreen() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // --- COMPONENT STATE ---
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingProgress, setUploadingProgress] = useState(false);
  const [error, setError] = useState('');
  
  // Section visibility states
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [showOutputPanel, setShowOutputPanel] = useState(false);
  
  // Section Scroll Refs
  const actionPanelRef = useRef(null);
  const outputPanelRef = useRef(null);
  const chatBottomRef = useRef(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('similar'); // 'similar' (Match) | 'choice' (Pick & Mix) | 'chat' (Chat)
  
  // Tab 1: Similar Pairs
  const [similarPairs, setSimilarPairs] = useState([]);
  const [loadingPairs, setLoadingPairs] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(40);
  
  // Active comparison controls expansion
  const [activePairControls, setActivePairControls] = useState(null);
  
  // Tab 2: Pick & Mix selection
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  
  // Shared Configuration
  const [sectionsCount, setSectionsCount] = useState(3);
  const [linesPerSection, setLinesPerSection] = useState(5);
  const [includeMCQs, setIncludeMCQs] = useState(false);
  const [mcqCount, setMcqCount] = useState(5);
  const [mcqSource, setMcqSource] = useState('From Content'); // 'From Content' (Full Doc) | 'From Summary' (Summary)
  
  // Loading & Generation Process States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  
  // Output and Display States
  const [outputSummary, setOutputSummary] = useState([]);
  const [outputMCQs, setOutputMCQs] = useState([]);
  const [expandedSummaryIndices, setExpandedSummaryIndices] = useState([0]);
  const [mcqUserAnswers, setMcqUserAnswers] = useState({});
  const [mcqRevealed, setMcqRevealed] = useState({});
  
  // Tab 3: Chat / RAG States
  const [chatFileIds, setChatFileIds] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  const triggerToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  // Summaries saving states
  const [savingSummary, setSavingSummary] = useState(false);
  const [savedSummaryId, setSavedSummaryId] = useState(null);
  const [summaryCustomTitle, setSummaryCustomTitle] = useState('');
  const [showSaveSummaryPrompt, setShowSaveSummaryPrompt] = useState(false);

  const handleSaveSummaryClick = () => {
    if (!user) {
      triggerToast("Please log in to save your summary.", "error");
      return;
    }
    setSavedSummaryId(null);
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateFormatted = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
    setSummaryCustomTitle("Unified Review - " + dateFormatted);
    setShowSaveSummaryPrompt(true);
  };

  const confirmSaveSummary = async () => {
    if (!summaryCustomTitle.trim()) return;
    setSavingSummary(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/summaries', {
        title: summaryCustomTitle.trim(),
        content: outputSummary
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedSummaryId(response.data.id);
      setShowSaveSummaryPrompt(false);
      triggerToast("Summary successfully saved to your profile!", "success");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to save summary. Please try again.", "error");
    } finally {
      setSavingSummary(false);
    }
  };

  const autoSaveMCQAttempt = async (mcq, selectedOptionKey) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/mcq-history', {
        question: mcq.question,
        wrong_answer: mcq.options[selectedOptionKey] || 'No Answer',
        correct_answer: mcq.options[mcq.correct],
        explanation: mcq.explanation
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerToast("Quiz question saved to your history!");
    } catch (err) {
      console.error("Auto-save MCQ error:", err);
    }
  };

  // --- AUTOMATIC CHAT CONTEXT SYSTEM MESSAGE INJECTION ---
  const prevChatFileIds = useRef([]);
  useEffect(() => {
    if (uploadedFiles.length === 0) {
      prevChatFileIds.current = chatFileIds;
      return;
    }
    
    const added = chatFileIds.filter(id => !prevChatFileIds.current.includes(id));
    const removed = prevChatFileIds.current.filter(id => !chatFileIds.includes(id));
    
    const newSystemMessages = [];
    
    added.forEach(id => {
      const file = uploadedFiles.find(f => f.file_id === id);
      if (file) {
        newSystemMessages.push({
          role: 'system',
          content: `Your reading list changed — ${file.filename} added`,
          id: `sys-${Date.now()}-${id}`
        });
      }
    });
    
    removed.forEach(id => {
      const file = uploadedFiles.find(f => f.file_id === id);
      if (file) {
        newSystemMessages.push({
          role: 'system',
          content: `Your reading list changed — ${file.filename} removed`,
          id: `sys-${Date.now()}-${id}`
        });
      }
    });
    
    if (newSystemMessages.length > 0) {
      setChatHistory(prev => [...prev, ...newSystemMessages]);
    }
    
    prevChatFileIds.current = chatFileIds;
  }, [chatFileIds, uploadedFiles]);

  // Scroll chat bottom
  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeTab]);

  // --- DRAG AND DROP HANDLERS ---
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setError('');
    setUploadingProgress(true);
    
    const tempLoadingCards = acceptedFiles.map(file => ({
      file_id: `temp-${Math.random()}`,
      filename: file.name,
      page_count: null,
      loading: true
    }));
    
    setUploadedFiles(prev => [...prev, ...tempLoadingCards]);
    
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append("files", file);
    });
    
    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadedFiles(prev => {
        const finished = prev.filter(f => !f.loading && !f.file_id.startsWith('temp-'));
        return [...finished, ...response.data];
      });
      triggerToast("Documents uploaded and ready!", "success");
      
    } catch (err) {
      console.error(err);
      setError("Something went wrong — try again");
      setUploadedFiles(prev => prev.filter(f => !f.loading && !f.file_id.startsWith('temp-')));
    } finally {
      setUploadingProgress(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true
  });

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.file_id !== fileId));
    setSelectedFileIds(prev => prev.filter(id => id !== fileId));
    setChatFileIds(prev => prev.filter(id => id !== fileId));
    triggerToast("Document removed");
    
    if (uploadedFiles.length <= 2) {
      setShowActionPanel(false);
      setShowOutputPanel(false);
    }
  };

  // --- CTA TRIGGERS ACTION SECTION ---
  const proceedToActions = () => {
    setShowActionPanel(true);
    setSelectedFileIds(uploadedFiles.map(f => f.file_id));
    setChatFileIds(uploadedFiles.map(f => f.file_id));
    fetchSimilarPairs(uploadedFiles.map(f => f.file_id));
    
    setTimeout(() => {
      actionPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  // --- SIMILAR PAIRS LOADER ---
  const fetchSimilarPairs = async (ids) => {
    if (ids.length < 2) return;
    setLoadingPairs(true);
    try {
      const response = await axios.post('/api/similar-pairs', {
        file_ids: ids
      });
      setSimilarPairs(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPairs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'similar' && showActionPanel) {
      fetchSimilarPairs(uploadedFiles.map(f => f.file_id));
    }
  }, [activeTab, showActionPanel, uploadedFiles]);

  const getFilteredPairs = () => {
    return similarPairs.filter(p => (p.similarity * 100) >= similarityThreshold);
  };

  // --- GENERAL GENERATION PIPELINE ---
  const handleGenerate = async (targetFileIds) => {
    if (targetFileIds.length === 0) {
      setError("Please select at least one document to proceed.");
      return;
    }
    
    setIsGenerating(true);
    setGenerationStepIndex(0); // Reading
    setShowOutputPanel(false);
    setError('');
    setOutputSummary([]);
    setOutputMCQs([]);
    setMcqUserAnswers({});
    setMcqRevealed({});
    setSavedSummaryId(null);
    setShowSaveSummaryPrompt(false);
    setSummaryCustomTitle('');
    
    try {
      // Step transitions
      setTimeout(() => setGenerationStepIndex(1), 800); // Finding important parts
      
      const summaryResponse = await axios.post('/api/generate-summary', {
        file_ids: targetFileIds,
        sections: sectionsCount,
        lines_per_section: linesPerSection
      });
      
      setTimeout(() => setGenerationStepIndex(2), 1600); // Writing your summary
      
      const summaryData = summaryResponse.data;
      
      let mcqData = [];
      if (includeMCQs) {
        const flattenedSummary = summaryData.map(s => `${s.heading}\n${s.lines.join('\n')}`).join('\n\n');
        
        const mcqResponse = await axios.post('/api/generate-mcq', {
          file_ids: mcqSource === 'From Content' ? targetFileIds : [],
          summary_text: mcqSource === 'From Summary' ? flattenedSummary : "",
          num_mcqs: mcqCount,
          source_type: mcqSource === 'From Content' ? 'From Content' : 'From Summary'
        });
        mcqData = mcqResponse.data;
      }
      
      setGenerationStepIndex(3); // Almost done
      
      setTimeout(() => {
        setOutputSummary(summaryData);
        setOutputMCQs(mcqData);
        setExpandedSummaryIndices([0]);
        setShowOutputPanel(true);
        setIsGenerating(false);
        triggerToast("Summary generated successfully!", "success");
        
        setTimeout(() => {
          outputPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }, 600);
      
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setError("Your study session has restarted. Please drop your documents here again to continue.");
        setUploadedFiles([]);
        setShowActionPanel(false);
      } else if (err.response?.data?.detail) {
        setError(`Error from server: ${err.response.data.detail}`);
      } else {
        setError("Something went wrong — try again");
      }
      setIsGenerating(false);
    }
  };

  // --- CHATBOT STREAMING HANDLER ---
  const handleSendChat = async (presetQuestion = null) => {
    const questionToSubmit = presetQuestion || chatInput;
    if (!questionToSubmit.trim() || isStreaming) return;
    if (chatFileIds.length === 0) {
      setError("Pick a document above to start");
      return;
    }
    
    setChatInput('');
    setError('');
    
    const userMsgId = `msg-${Date.now()}-user`;
    const aiMsgId = `msg-${Date.now()}-ai`;
    
    setChatHistory(prev => [
      ...prev,
      { role: 'user', content: questionToSubmit, id: userMsgId },
      { role: 'assistant', content: '', sources: [], id: aiMsgId }
    ]);
    
    setIsStreaming(true);
    
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_ids: chatFileIds,
          query: questionToSubmit,
          chat_history: chatHistory
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role, content: m.content }))
        })
      });
      
      if (!response.ok) throw new Error("Connection failed.");
      
      const sourcesHeader = response.headers.get('X-Sources');
      let citations = [];
      if (sourcesHeader) {
        try {
          citations = JSON.parse(sourcesHeader);
        } catch (e) {
          console.error("Citations parse error", e);
        }
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let textBuffer = "";
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          textBuffer += chunk;
          
          setChatHistory(prev => {
            const updated = [...prev];
            const aiMsgIdx = updated.findIndex(m => m.id === aiMsgId);
            if (aiMsgIdx !== -1) {
              updated[aiMsgIdx] = {
                ...updated[aiMsgIdx],
                content: textBuffer,
                sources: citations
              };
            }
            return updated;
          });
        }
      }
      
    } catch (err) {
      console.error(err);
      setChatHistory(prev => {
        const updated = [...prev];
        const aiMsgIdx = updated.findIndex(m => m.id === aiMsgId);
        if (aiMsgIdx !== -1) {
          updated[aiMsgIdx] = {
            ...updated[aiMsgIdx],
            content: "Something went wrong — try again",
            sources: []
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const toggleAccordion = (index) => {
    setExpandedSummaryIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const generationSteps = [
    "Reading your documents...",
    "Finding the important parts...",
    "Writing your summary...",
    "Almost done..."
  ];

  return (
    <PageWrapper className="max-w-6xl px-4 pb-32 relative text-slate-200">
      
      <Toast 
        message={toastMessage} 
        type={toastType} 
        onClose={() => setToastMessage('')} 
      />

      {/* BACKGROUND FLOATING DECORATIONS */}
      <div className="absolute top-20 left-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-float-slow" />
      <div className="absolute top-80 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[140px] pointer-events-none -z-10 animate-float-slow" style={{ animationDelay: '2s' }} />

      {/* Screen Header */}
      <div className="mb-14 text-center flex flex-col items-center pt-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/60 border border-white/[0.04] text-[10px] font-mono text-cyan-400 mb-5 uppercase tracking-widest shadow-inner select-none">
          <Layers size={11} className="animate-pulse" />
          <span>Study Workspace</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-display text-gradient">
          Compare & Study Documents
        </h1>
        <p className="text-slate-400 text-sm mt-4 max-w-xl leading-relaxed">
          Add your study documents to find matches, create customized summaries, or chat with them using intelligent conversational pipelines.
        </p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold mb-8 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2">
            <XCircle size={14} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400/60 hover:text-red-400 text-sm font-bold font-sans cursor-pointer px-2">✕</button>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: PDF UPLOAD                                                     */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 border-b border-white/[0.05] pb-4 mb-2 select-none">
          <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">1</div>
          <h2 className="text-base font-bold text-white tracking-tight">Start by adding your documents</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dashboard rotating upload block */}
          <div className="lg:col-span-2">
            <div 
              {...getRootProps()} 
              className={`rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 p-10 h-64 text-center ${
                isDragActive 
                  ? 'bg-cyan-950/20 border-2 border-cyan-400 shadow-cyan-950/20 shadow-lg scale-[1.01]' 
                  : 'dashed-rotate bg-[#0f1117]/30 hover:bg-[#0f1117]/60'
              }`}
            >
              <input {...getInputProps()} />
              
              {/* Floating animated upload folder graphic */}
              <motion.div
                animate={isDragActive ? { scale: 1.1, rotate: 10 } : { y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="p-4 bg-slate-900 border border-white/[0.04] text-cyan-400 rounded-2xl mb-4"
              >
                <UploadCloud size={32} />
              </motion.div>
              
              <span className="text-white text-sm font-bold tracking-wide">
                {isDragActive ? "Drop them here!" : "Drop your files here"}
              </span>
              <span className="text-slate-400 text-xs mt-1 font-medium">
                PDF files only · You can add as many as you like
              </span>
            </div>
          </div>

          {/* Simple non-technical study guides card */}
          <GlassCard hover={false} className="flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-4 font-mono uppercase tracking-wider select-none text-slate-400">
                <HelpCircle size={14} className="text-violet-400" />
                Guidelines
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-400 leading-relaxed font-sans">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Add at least <strong>two documents</strong> to unlock matching and unified summaries.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Review similarity strengths or handpick combinations to generate practice quizzes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Instantly chat with your engaged list to ask custom questions.</span>
                </li>
              </ul>
            </div>
            
            {uploadedFiles.filter(f => !f.loading).length >= 2 && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-6"
              >
                <GlowButton
                  onClick={proceedToActions}
                  className="w-full text-xs py-3"
                >
                  <span>Let's get started</span>
                  <ArrowRight size={14} />
                </GlowButton>
              </motion.div>
            )}
          </GlassCard>
        </div>

        {/* Uploaded File Cards Grid */}
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 pt-3"
            >
              <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-500 font-bold select-none flex items-center justify-between">
                <span>Your Active Documents List ({uploadedFiles.length})</span>
                {uploadingProgress && (
                  <span className="flex items-center gap-1.5 text-cyan-400 font-sans normal-case tracking-normal">
                    <Loader size={10} className="animate-spin" /> Analyzing file metrics...
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {uploadedFiles.map((file) => (
                  <motion.div
                    key={file.file_id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-2xl bg-[#0f1117]/40 border border-white/[0.04] hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1 group flex items-center justify-between relative shadow-lg"
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.02] text-slate-400 group-hover:text-cyan-400 transition-colors">
                        <FileText size={16} />
                      </div>
                      <div className="overflow-hidden flex-1">
                        <h4 className="text-xs font-bold text-slate-200 truncate pr-2" title={file.filename}>
                          {file.filename}
                        </h4>
                        {file.loading ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            <span className="text-[9px] text-cyan-400/80 font-medium">Extracting content...</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-medium text-slate-500 bg-slate-900/60 px-2 py-0.5 rounded border border-white/[0.02] inline-block mt-1">
                            {file.page_count} pages
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeFile(file.file_id)}
                      className="text-slate-600 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer flex-shrink-0"
                      title="✕ Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* CONNECTOR LINE */}
      {showActionPanel && (
        <div className="flex justify-center my-10 select-none">
          <div className="w-[1px] h-12 bg-gradient-to-b from-cyan-500/60 to-violet-500/40 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50 animate-ping" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ACTIONS PANEL                                                  */}
      {/* ========================================================================= */}
      <div ref={actionPanelRef}>
        <AnimatePresence>
          {showActionPanel && (
            <motion.section 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2.5 border-b border-white/[0.05] pb-4 mb-2 select-none">
                <div className="w-6 h-6 rounded-full bg-violet-600/10 flex items-center justify-center text-violet-400 font-mono text-xs font-bold">2</div>
                <h2 className="text-base font-bold text-white tracking-tight">Choose Your Action</h2>
              </div>

              {/* Pill Stage Tab Switcher */}
              <div className="relative flex bg-[#0f1117]/80 backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden p-1.5 gap-1.5 shadow-inner">
                {[
                  { id: 'similar', label: 'Documents That Match', emoji: '🔗' },
                  { id: 'choice', label: 'Pick & Mix', emoji: '🎛️' },
                  { id: 'chat', label: 'Chat with Your Documents', emoji: '💬' }
                ].map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setError('');
                      }}
                      className="relative flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold rounded-xl transition-all cursor-pointer outline-none select-none z-10 text-slate-400 hover:text-slate-200"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-tab-indicator"
                          className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-600 border border-cyan-500/30 rounded-xl shadow-lg shadow-cyan-500/10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="text-sm select-none">{tab.emoji}</span>
                      <span className={isActive ? 'text-white font-extrabold z-10' : 'z-10'}>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Panel Card */}
              <div className="bg-[#0f1117]/30 backdrop-blur-xl border border-white/[0.04] p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: DOCUMENTS THAT MATCH */}
                  {activeTab === 'similar' && (
                    <motion.div
                      key="similar-panel"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      className="space-y-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.03] pb-4">
                        <div>
                          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                            <Sparkles size={15} className="text-cyan-400" />
                            Overlapping Document Search
                          </h3>
                          <p className="text-slate-400 text-xs mt-1">We analyzed your documents to find which ones cover similar concepts.</p>
                        </div>

                        {/* Slider matching cutoffs */}
                        <div className="w-full md:w-64 space-y-1.5 bg-slate-900/40 p-3.5 rounded-2xl border border-white/[0.02]">
                          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-slate-500">
                            <span>Match Strength Threshold</span>
                            <span className="text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20 font-mono">
                              {similarityThreshold}%
                            </span>
                          </div>
                          <input
                            type="range" min="10" max="95" value={similarityThreshold}
                            onChange={e => setSimilarityThreshold(parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                          />
                        </div>
                      </div>

                      {loadingPairs ? (
                        <SkeletonLoader type="pair" count={2} />
                      ) : getFilteredPairs().length === 0 ? (
                        <div className="p-10 rounded-3xl bg-slate-900/20 border border-dashed border-white/[0.04] text-center space-y-2">
                          <p className="text-xs text-slate-400 font-medium">These documents don't seem related — try Pick & Mix instead</p>
                          <span className="text-[10px] text-slate-600 block">Try lowering the Match Strength threshold in the top-right slider.</span>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {getFilteredPairs().map((pair, idx) => {
                            const matchPercentage = Math.round(pair.similarity * 100);
                            const isActiveControls = activePairControls?.file1_id === pair.file1_id && activePairControls?.file2_id === pair.file2_id;
                            
                            return (
                              <div 
                                key={idx} 
                                className="rounded-3xl border border-white/[0.04] bg-[#0f1117]/40 overflow-hidden transition-all duration-300 hover:border-cyan-500/20 shadow-xl p-6"
                              >
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                  
                                  {/* connected duo cards */}
                                  <div className="flex items-center justify-center gap-4 w-full md:w-auto relative select-none">
                                    <div className="p-4 rounded-2xl bg-slate-900 border border-white/[0.04] text-center w-36 shrink-0 relative">
                                      <div className="text-2xl mb-1 select-none">📄</div>
                                      <div className="text-[10px] font-bold text-white truncate max-w-[120px]" title={pair.file1_name}>
                                        {pair.file1_name}
                                      </div>
                                    </div>

                                    {/* arc gradient connector line */}
                                    <div className="flex-1 h-[1.5px] bg-gradient-to-r from-cyan-500/30 via-violet-500/40 to-cyan-500/30 relative min-w-[60px] flex items-center justify-center">
                                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-[#07080f] border border-cyan-500/30 text-[10px] font-bold text-cyan-400 shadow-md font-mono select-none">
                                        {matchPercentage}% match
                                      </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-slate-900 border border-white/[0.04] text-center w-36 shrink-0 relative">
                                      <div className="text-2xl mb-1 select-none">📄</div>
                                      <div className="text-[10px] font-bold text-white truncate max-w-[120px]" title={pair.file2_name}>
                                        {pair.file2_name}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
                                    <button
                                      onClick={() => {
                                        if (isActiveControls) {
                                          setActivePairControls(null);
                                        } else {
                                          setActivePairControls(pair);
                                        }
                                      }}
                                      className="w-full sm:w-auto py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-900 border border-white/[0.04] hover:bg-slate-800 hover:border-cyan-500/20 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                      <span>Create a Summary</span>
                                      {isActiveControls ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-4 border-t border-white/[0.02] pt-3.5">
                                  <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block mb-1.5">
                                    Why these match
                                  </span>
                                  <p className="text-[11px] text-slate-400 font-sans max-w-2xl leading-relaxed">
                                    These two documents share highly correlated themes, key concepts, and common educational reference points in their respective sections.
                                  </p>
                                </div>

                                {/* Slide down controls configuration */}
                                <AnimatePresence>
                                  {isActiveControls && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="border-t border-white/[0.03] bg-slate-900/30 p-5 mt-4 space-y-5 rounded-2xl overflow-hidden"
                                    >
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <StepperInput
                                          label="How many sections?"
                                          value={sectionsCount}
                                          onChange={setSectionsCount}
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

                                      <AnimatedToggle
                                        checked={includeMCQs}
                                        onChange={setIncludeMCQs}
                                        label="Add quiz questions?"
                                        activeLabel="Yes, add a quiz"
                                        inactiveLabel="No quiz"
                                      />

                                      <AnimatePresence>
                                        {includeMCQs && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="space-y-4 pt-2 overflow-hidden"
                                          >
                                            <StepperInput
                                              label="How many questions?"
                                              value={mcqCount}
                                              onChange={setMcqCount}
                                              min={1}
                                              max={20}
                                            />
                                            <div className="space-y-2">
                                              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider select-none">
                                                Based on:
                                              </span>
                                              <div className="grid grid-cols-2 gap-3">
                                                <button
                                                  type="button"
                                                  onClick={() => setMcqSource('From Content')}
                                                  className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                                                    mcqSource === 'From Content'
                                                      ? 'bg-cyan-500/10 border-cyan-500 text-white'
                                                      : 'bg-[#0f1117]/60 border-white/[0.04] text-slate-400 hover:text-white'
                                                  }`}
                                                >
                                                  The full document
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setMcqSource('From Summary')}
                                                  className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                                                    mcqSource === 'From Summary'
                                                      ? 'bg-cyan-500/10 border-cyan-500 text-white'
                                                      : 'bg-[#0f1117]/60 border-white/[0.04] text-slate-400 hover:text-white'
                                                  }`}
                                                >
                                                  The summary
                                                </button>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>

                                      <GlowButton
                                        onClick={() => handleGenerate([pair.file1_id, pair.file2_id])}
                                        className="w-full text-xs font-bold py-3"
                                      >
                                        Create Summary
                                      </GlowButton>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 2: PICK & MIX */}
                  {activeTab === 'choice' && (
                    <motion.div
                      key="choice-panel"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      className="space-y-6"
                    >
                      <div className="flex justify-between items-center border-b border-white/[0.03] pb-4">
                        <div>
                          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                            <Layers size={15} className="text-cyan-400" />
                            Choose which documents to combine
                          </h3>
                          <p className="text-slate-400 text-xs mt-1">Select a custom combination of uploaded documents to synthesize into one summary.</p>
                        </div>
                        
                        {/* selection count live badge */}
                        <motion.div 
                          key={selectedFileIds.length}
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-400 font-bold select-none"
                        >
                          {selectedFileIds.length} documents selected
                        </motion.div>
                      </div>

                      {/* PDF Selectable Card Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {uploadedFiles.map(doc => {
                          const isChecked = selectedFileIds.includes(doc.file_id);
                          return (
                            <SelectableCard
                              key={doc.file_id}
                              title={doc.filename}
                              pageCount={doc.page_count}
                              selected={isChecked}
                              onClick={() => {
                                setSelectedFileIds(prev => 
                                  prev.includes(doc.file_id) ? prev.filter(id => id !== doc.file_id) : [...prev, doc.file_id]
                                );
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Config panel for Choice Select */}
                      <div className="border-t border-white/[0.03] pt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <StepperInput
                            label="How many sections?"
                            value={sectionsCount}
                            onChange={setSectionsCount}
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

                        <AnimatedToggle
                          checked={includeMCQs}
                          onChange={setIncludeMCQs}
                          label="Add quiz questions?"
                          activeLabel="Yes, add a quiz"
                          inactiveLabel="No quiz"
                        />

                        <AnimatePresence>
                          {includeMCQs && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="space-y-4 pt-2 overflow-hidden"
                            >
                              <StepperInput
                                label="How many questions?"
                                value={mcqCount}
                                onChange={setMcqCount}
                                min={1}
                                max={20}
                              />
                              <div className="space-y-2">
                                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider select-none">
                                  Based on:
                                </span>
                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setMcqSource('From Content')}
                                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                                      mcqSource === 'From Content'
                                        ? 'bg-cyan-500/10 border-cyan-500 text-white'
                                        : 'bg-[#0f1117]/60 border-white/[0.04] text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    The full document
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMcqSource('From Summary')}
                                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                                      mcqSource === 'From Summary'
                                        ? 'bg-cyan-500/10 border-cyan-500 text-white'
                                        : 'bg-[#0f1117]/60 border-white/[0.04] text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    The summary
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <GlowButton
                          onClick={() => handleGenerate(selectedFileIds)}
                          disabled={selectedFileIds.length === 0}
                          className="w-full text-xs py-4"
                        >
                          {selectedFileIds.length === 0 ? "Select at least one document" : "Create Summary"}
                        </GlowButton>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: CHAT WITH YOUR DOCUMENTS */}
                  {activeTab === 'chat' && (
                    <motion.div
                      key="chat-panel"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      className="flex flex-col lg:flex-row gap-6 min-h-[500px]"
                    >
                      {/* Document Selector Panel Sidebar */}
                      {isSidebarOpen && (
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 260, opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="flex-shrink-0 bg-slate-950/40 p-4 rounded-2xl border border-white/[0.03] space-y-4 overflow-y-auto max-h-[500px]"
                        >
                          <div className="flex items-center justify-between border-b border-white/[0.03] pb-2 select-none">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">You're chatting with:</span>
                            <button
                              onClick={() => {
                                if (chatFileIds.length === uploadedFiles.length) {
                                  setChatFileIds([]);
                                } else {
                                  setChatFileIds(uploadedFiles.map(f => f.file_id));
                                }
                              }}
                              className="text-[9px] font-bold text-cyan-400 hover:underline cursor-pointer"
                            >
                              {chatFileIds.length === uploadedFiles.length ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          <div className="space-y-2">
                            {uploadedFiles.map(doc => {
                              const isIncluded = chatFileIds.includes(doc.file_id);
                              return (
                                <div
                                  key={doc.file_id}
                                  onClick={() => {
                                    setChatFileIds(prev => 
                                      prev.includes(doc.file_id) 
                                        ? prev.filter(id => id !== doc.file_id) 
                                        : [...prev, doc.file_id]
                                    );
                                  }}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                    isIncluded 
                                      ? 'bg-cyan-500/10 border-cyan-500/30 shadow-inner' 
                                      : 'bg-[#0f1117]/20 border-white/[0.03] opacity-60 hover:opacity-100 hover:border-white/[0.08]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                                    <FileText size={12} className={isIncluded ? 'text-cyan-400' : 'text-slate-500'} />
                                    <span className="text-[10px] font-mono text-slate-300 truncate" title={doc.filename}>
                                      {doc.filename}
                                    </span>
                                  </div>
                                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all ${
                                    isIncluded 
                                      ? 'bg-cyan-500 border-cyan-400 text-white' 
                                      : 'border-white/[0.1] bg-slate-900/60'
                                  }`}>
                                    {isIncluded && <Check size={8} strokeWidth={3} />}
                                  </div>
                                </div>
                              );
                            })}

                            {uploadedFiles.length > chatFileIds.length && (
                              <button
                                onClick={() => setChatFileIds(uploadedFiles.map(f => f.file_id))}
                                className="w-full py-2 border border-dashed border-white/[0.08] hover:border-cyan-500/20 text-slate-500 hover:text-cyan-400 transition-all rounded-xl text-[10px] font-bold cursor-pointer"
                              >
                                + Add a document
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Main Frosted glass Chat window */}
                      <div className="flex-1 flex flex-col bg-[#0f1117]/80 backdrop-blur-xl rounded-3xl border border-white/[0.04] overflow-hidden shadow-xl">
                        {/* Header details bar */}
                        <div className="p-4 border-b border-white/[0.03] bg-slate-950/40 flex items-center justify-between select-none">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                              className="p-1.5 bg-slate-900 border border-white/[0.04] text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Toggle Context Panel"
                            >
                              <Layers size={13} />
                            </button>
                            <span className="text-xs font-bold text-white">Document Chat</span>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2.5 py-0.5 rounded border border-cyan-500/20 font-bold">
                            {chatFileIds.length} files active
                          </span>
                        </div>

                        {/* Message Feed bubbles scroll window */}
                        <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[380px] min-h-[300px]">
                          {chatHistory.length === 0 ? (
                            <EmptyState
                              title="Your documents are ready to answer questions"
                              description="Ask anything about your documents. Our pipeline automatically scans your selected files to formulate correct answers."
                              suggestions={[
                                "What are the main differences?",
                                "Summarize the key points",
                                "What is this document about?"
                              ]}
                              onSuggestionClick={(q) => handleSendChat(q)}
                            />
                          ) : (
                            chatHistory.map((msg) => {
                              if (msg.role === 'system') {
                                return (
                                  <div key={msg.id} className="flex justify-center select-none">
                                    <div className="px-3 py-1 rounded-full bg-[#111827] border border-white/[0.02] text-[9px] font-mono text-slate-500 shadow-inner flex items-center gap-1.5">
                                      <span>{msg.content}</span>
                                    </div>
                                  </div>
                                );
                              }
                              
                              const isUser = msg.role === 'user';
                              return (
                                <motion.div 
                                  key={msg.id} 
                                  initial={{ opacity: 0, x: isUser ? 24 : -24 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div className={`max-w-[85%] rounded-2xl p-4 shadow-lg leading-relaxed ${
                                    isUser 
                                      ? 'bg-gradient-to-br from-cyan-500/20 to-violet-600/20 border border-cyan-500/30 text-white rounded-br-none' 
                                      : 'bg-[#161b27]/80 backdrop-blur-xl border border-white/[0.04] text-slate-200 rounded-bl-none'
                                  }`}>
                                    <p className="text-xs leading-relaxed whitespace-pre-wrap font-sans">{msg.content}</p>
                                    
                                    {/* Typing bouncy dots */}
                                    {msg.content === '' && isStreaming && (
                                      <div className="flex items-center gap-1 py-1 select-none">
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                      </div>
                                    )}

                                    {/* SourceBadge citations pills */}
                                    {!isUser && msg.sources && msg.sources.length > 0 && (
                                      <div className="mt-3 pt-2.5 border-t border-white/[0.02] flex flex-wrap gap-1.5 items-center select-none">
                                        <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider mr-1">Found in:</span>
                                        {msg.sources.map((filename, sIdx) => (
                                          <SourceBadge key={sIdx} filename={filename} />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })
                          )}
                          <div ref={chatBottomRef} />
                        </div>

                        {/* Interactive Message Input bar */}
                        <div className="p-3 border-t border-white/[0.03] bg-slate-950/40 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={chatFileIds.length === 0 ? "Add a document above to start chatting" : "Ask anything about your documents…"}
                            value={chatInput}
                            disabled={chatFileIds.length === 0 || isStreaming}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSendChat();
                            }}
                            className="flex-1 bg-slate-900 border border-white/[0.04] rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/40 focus:glow-cyan-hover disabled:opacity-40"
                          />
                          <button
                            onClick={() => handleSendChat()}
                            disabled={!chatInput.trim() || isStreaming || chatFileIds.length === 0}
                            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow shadow-cyan-500/10 hover:shadow-cyan-400/20 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                          >
                            {isStreaming ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* CONNECTOR LINE */}
      {showOutputPanel && activeTab !== 'chat' && (
        <div className="flex justify-center my-10 select-none">
          <div className="w-[1px] h-12 bg-gradient-to-b from-violet-500/40 to-cyan-500/60 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50 animate-ping" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: GENERATION AND OUTPUTS AREA                                    */}
      {/* ========================================================================= */}
      
      {/* Universal ProgressSteps Modal Loader while generating */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#07080f]/80 backdrop-blur-md flex items-center justify-center z-50 p-6 select-none"
          >
            <ProgressSteps
              steps={generationSteps}
              currentStepIndex={generationStepIndex}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output results Section */}
      <div ref={outputPanelRef}>
        <AnimatePresence>
          {showOutputPanel && activeTab !== 'chat' && (
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="space-y-6 pt-4"
            >
              <div className="flex items-center gap-2.5 border-b border-white/[0.05] pb-4 mb-2 select-none">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold">✓</div>
                <h2 className="text-base font-bold text-white tracking-tight">Structured Output</h2>
              </div>

              {/* RENDER ACCORDION SUMMARIES */}
              {outputSummary.length > 0 && (
                <div className="bg-[#0f1117]/40 backdrop-blur-xl border border-white/[0.04] p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
                  <div className="border-b border-white/[0.03] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
                      <BookOpen size={15} className="text-cyan-400" />
                      Summary Details
                    </h3>
                    
                    <button
                      onClick={handleSaveSummaryClick}
                      disabled={savingSummary}
                      className="py-1.5 px-3.5 text-[11px] font-bold rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      {savingSummary ? (
                        <>
                          <Loader size={12} className="animate-spin text-cyan-400" />
                          <span>Saving...</span>
                        </>
                      ) : savedSummaryId ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span className="text-emerald-400 font-sans font-bold">Saved to Dashboard!</span>
                        </>
                      ) : (
                        <>
                          <span>💾</span>
                          <span>Save to Dashboard</span>
                        </>
                      )}
                    </button>
                  </div>



                  <div className="space-y-3">
                    {outputSummary.map((sec, sIdx) => {
                      const isExpanded = expandedSummaryIndices.includes(sIdx);
                      return (
                        <div 
                          key={sIdx}
                          className="rounded-2xl border border-white/[0.03] bg-slate-900/20 overflow-hidden transition-all duration-300 hover:border-white/[0.06] relative"
                        >
                          {/* Large watermark numeral */}
                          <div className="absolute right-6 top-2 text-6xl font-extrabold font-display text-white/[0.015] select-none pointer-events-none">
                            {sIdx + 1}
                          </div>

                          <button
                            onClick={() => toggleAccordion(sIdx)}
                            className="w-full p-4 flex items-center justify-between text-left cursor-pointer outline-none select-none hover:bg-slate-900/35 transition-colors"
                          >
                            <span className="text-xs font-bold text-white flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px] font-bold">
                                {sIdx + 1}
                              </span>
                              {sec.heading}
                            </span>
                            {isExpanded ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-white/[0.03] bg-slate-900/40 p-5 overflow-hidden"
                              >
                                <ul className="space-y-2.5 text-xs text-slate-400">
                                  {sec.lines.map((line, lIdx) => (
                                    <li key={lIdx} className="flex items-start gap-2.5 leading-relaxed">
                                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                                      <span className="leading-relaxed font-sans">{line}</span>
                                    </li>
                                  ))}
                                </ul>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RENDER INTERACTIVE MCQ Practice Quiz Cards */}
              {outputMCQs.length > 0 && (
                <div className="bg-[#0f1117]/40 backdrop-blur-xl border border-white/[0.04] p-8 rounded-3xl shadow-xl space-y-6">
                  <div className="border-b border-white/[0.03] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
                      <HelpCircle size={15} className="text-violet-400" />
                      Active Practice Review Questions
                    </h3>
                    
                    <div className="flex items-center gap-3 select-none">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        {Object.keys(mcqUserAnswers).length} / {outputMCQs.length} Answered
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outputMCQs.map((q, qIdx) => {
                      const chosenAnswer = mcqUserAnswers[q.id];
                      const isCorrect = chosenAnswer === q.correct;
                      const hasAnswered = chosenAnswer !== undefined;
                      const isRevealed = mcqRevealed[q.id];
                      
                      return (
                        <div 
                          key={q.id}
                          className="w-full min-h-[250px]"
                        >
                          <div className={`relative w-full h-full rounded-3xl border border-white/[0.04] bg-slate-900/20 p-5 space-y-4 hover:border-white/[0.07] transition-all flex flex-col justify-between`}>
                            
                            <div className="space-y-3">
                              <div className="flex items-start gap-2">
                                <span className="text-[9px] font-mono font-bold text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-500/20 flex-shrink-0 select-none">
                                  Quiz #{qIdx + 1}
                                </span>
                                <h4 className="text-xs font-bold leading-relaxed text-white">
                                  {q.question}
                                </h4>
                              </div>

                              {/* Radio list choices */}
                              <div className="space-y-1.5">
                                {Object.entries(q.options).map(([key, val]) => {
                                  const isSelected = chosenAnswer === key;
                                  const isOptionCorrect = q.correct === key;
                                  
                                  let optionStyle = 'bg-slate-950/40 border-white/[0.03] hover:border-white/[0.08]';
                                  if (hasAnswered) {
                                    if (isSelected) {
                                      optionStyle = isCorrect 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-inner' 
                                        : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-inner';
                                    } else if (isOptionCorrect && isRevealed) {
                                      optionStyle = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
                                    }
                                  }
                                  
                                  return (
                                    <button
                                      key={key}
                                      disabled={hasAnswered}
                                      onClick={() => {
                                        setMcqUserAnswers(prev => ({ ...prev, [q.id]: key }));
                                        setMcqRevealed(prev => ({ ...prev, [q.id]: true }));
                                        autoSaveMCQAttempt(q, key);
                                      }}
                                      className={`w-full p-2.5 text-left rounded-xl text-[11px] font-medium border flex items-center justify-between gap-2 transition-all cursor-pointer disabled:pointer-events-none ${optionStyle}`}
                                    >
                                      <span className="leading-relaxed flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center font-mono font-bold text-slate-400 text-[10px] flex-shrink-0">
                                          {key}
                                        </span>
                                        {val}
                                      </span>
                                      {hasAnswered && isSelected && (
                                        isCorrect ? <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" /> : <XCircle size={12} className="text-red-400 flex-shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Card Footer Explanation */}
                            {hasAnswered && isRevealed && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="border-t border-white/[0.04] pt-3.5 mt-2 space-y-1.5 overflow-hidden"
                              >
                                <div className="flex items-center gap-1.5 select-none">
                                  <span className={`text-[9px] font-mono uppercase tracking-wider font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {isCorrect ? 'Correct choice' : 'Incorrect choice'}
                                  </span>
                                  <span className="text-slate-600 font-mono text-[9px]">• Explanation Below:</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed italic bg-slate-950/40 p-2.5 rounded-xl border border-white/[0.02]">
                                  {q.explanation}
                                </p>
                              </motion.div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Reset Grid buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setShowOutputPanel(false);
                    setTimeout(() => {
                      actionPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className="py-3 px-4 font-bold text-xs rounded-xl bg-[#0f1117]/60 border border-white/[0.04] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Choose New Action Config
                </button>
                <button
                  onClick={() => {
                    setUploadedFiles([]);
                    setShowActionPanel(false);
                    setShowOutputPanel(false);
                    setSelectedFileIds([]);
                    setChatFileIds([]);
                    setChatHistory([]);
                    triggerToast("Workspace cleared!");
                  }}
                  className="py-3 px-4 font-bold text-xs rounded-xl bg-slate-900/10 border border-dashed border-white/[0.08] hover:border-red-500/20 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Start Over & Clear Files
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>


      {/* Interactive Save Summary Naming Modal Overlay Dialog */}
      <AnimatePresence>
        {showSaveSummaryPrompt && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
            {/* Backdrop glass blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveSummaryPrompt(false)}
              className="absolute inset-0 bg-[#07080f]/80 backdrop-blur-md"
            />
            
            {/* Modal Body */}
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
                <h3 className="text-xl font-bold tracking-tight text-white font-display">Save Study Summary</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-sans">Give your summary a descriptive name so you can easily locate it later on your dashboard.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 select-none">Summary Title</label>
                <input
                  type="text"
                  placeholder="e.g., Unified Review..."
                  value={summaryCustomTitle}
                  onChange={(e) => setSummaryCustomTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.04] rounded-2xl px-4 py-3.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 font-bold"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowSaveSummaryPrompt(false)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/[0.02]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSaveSummary}
                  disabled={savingSummary || !summaryCustomTitle.trim()}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 text-xs font-bold text-slate-950 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10"
                >
                  {savingSummary ? (
                    <Loader className="animate-spin text-slate-950" size={13} />
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
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
