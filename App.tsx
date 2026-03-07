import { AppView, Project, Interview, Code, CodedSegment, Profile, TranscriptSentence } from './types';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import mammoth from 'mammoth';
import { Toaster } from 'react-hot-toast';
import { dbService } from './services/dbService';
import { transcribeAudio, processDocument, generateReport } from './services/geminiService';
import Layout from './components/Layout';
import CodeSelectionModal from './components/CodeSelectionModal';
import ConfirmDialog from './components/ConfirmDialog';
import { SkeletonCard, ProcessingSpinner } from './components/LoadingStates';
import { showToast } from './lib/toast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// --- Internal Helper Components ---

const GranularHighlighter: React.FC<{ 
  text: string, 
  segments: CodedSegment[], 
  codes: Code[] 
}> = ({ text, segments, codes }) => {
  if (segments.length === 0) return <>{text}</>;

  const boundaries = new Set<number>([0, text.length]);
  segments.forEach(s => {
    if (s.start_char !== undefined) boundaries.add(s.start_char);
    if (s.end_char !== undefined) boundaries.add(s.end_char);
  });

  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
  const parts: React.ReactNode[] = [];

  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const start = sortedBoundaries[i];
    const end = sortedBoundaries[i + 1];
    const partText = text.substring(start, end);
    
    const matchingSegments = segments.filter(s => 
      s.start_char !== undefined && s.end_char !== undefined &&
      start >= s.start_char && end <= s.end_char
    );

    if (matchingSegments.length > 0) {
      const lastSegment = matchingSegments[matchingSegments.length - 1];
      const code = codes.find(c => c.id === lastSegment.code_id);
      
      parts.push(
        <mark 
          key={`${start}-${end}`} 
          style={{ 
            backgroundColor: (code?.color || '#eee') + '44',
            borderBottom: `2px solid ${code?.color || '#ccc'}`,
            color: 'inherit'
          }}
          className="transition-colors duration-200"
          title={code?.label}
        >
          {partText}
        </mark>
      );
    } else {
      parts.push(<span key={`${start}-${end}`}>{partText}</span>);
    }
  }

  return <>{parts}</>;
};

// --- View Components ---

const AuthView: React.FC<{ onLogin: (email: string) => void }> = ({ onLogin }) => {
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onLogin(formData.get('email') as string);
    showToast.success('Welcome back!');
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast.success('Password reset link sent to your email.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="w-full max-w-md bg-transparent p-6 animate-fade-in">
        <div className="mb-12 flex flex-col items-center">
          <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(50, 48)">
              <path d="M-25,-15 C-40,-5 -35,25 -5,35 C25,45 45,15 35,-15 C25,-45 -10,-40 -25,-15" stroke="#E07A5F" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
              <path d="M-15,-25 C-35,-20 -40,10 -20,30 C0,50 35,35 40,5 C45,-25 15,-45 -15,-25" stroke="#81B29A" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
              <path d="M5,-35 C-25,-35 -45,0 -25,25 C-5,50 40,40 45,10 C50,-20 35,-35 5,-35" stroke="#3D405B" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
              <path d="M15,20 C25,20 45,40 45,50" stroke="#3D405B" strokeWidth="4" strokeLinecap="round" />
            </g>
          </svg>
          <h1 className="text-6xl font-bold text-slate tracking-tight -mt-6 font-sans text-center">Quilta</h1>
          <p className="text-sage font-medium tracking-widest text-xl uppercase mt-1 font-sans text-center">QDA for Students</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <input name="email" type="email" required placeholder="Email Address" className="w-full h-14 px-4 rounded-xl border-2 border-slate/10 focus:border-terracotta outline-none transition-all text-lg bg-white/80" />
            <input name="password" type="password" required placeholder="Password" className="w-full h-14 px-4 rounded-xl border-2 border-slate/10 focus:border-terracotta outline-none transition-all text-lg bg-white/80" />
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 accent-terracotta cursor-pointer rounded border-slate/10"
              />
              <span className="text-slate/60 font-medium select-none group-hover:text-slate transition-colors">Remember me</span>
            </label>
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="text-terracotta font-semibold hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className="w-full h-16 bg-slate text-white rounded-2xl font-bold text-xl btn-bounce shadow-xl">Sign In</button>
        </form>
      </div>
    </div>
  );
};

const ProjectsView: React.FC<{ 
  projects: Project[], 
  isLoading: boolean, 
  onOpen: (p: Project) => void, 
  onCreate: () => void, 
  onLogout: () => void 
}> = ({ projects, isLoading, onOpen, onCreate, onLogout }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Layout 
      title="My Projects" 
      actions={
        <button onClick={onLogout} className="p-2 hover:bg-red-50 text-slate/60 hover:text-red-500 rounded-full transition-colors" title="Logout">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      }
    >
      <div className="relative pb-24 animate-fade-in">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-3xl font-bold text-slate mb-2">No projects yet</h2>
            <p className="text-slate/40 text-lg mb-8">Create your first research project to begin.</p>
            <button onClick={onCreate} className="px-8 py-4 bg-terracotta text-white rounded-xl font-bold text-lg shadow-lg btn-bounce">Create Project</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => {
              const interviewCount = dbService.getInterviews(p.id).length;
              return (
                <div 
                  key={p.id} 
                  onClick={() => onOpen(p)} 
                  className="bg-white p-6 rounded-xl border border-slate/5 hover:border-terracotta/30 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-xl font-bold text-charcoal leading-tight line-clamp-1">{p.title}</h3>
                      <span className="shrink-0 px-2 py-1 bg-sage/10 text-sage text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {interviewCount} {interviewCount === 1 ? 'source' : 'sources'}
                      </span>
                    </div>
                    <p className="text-charcoal/60 text-sm line-clamp-2">
                      {p.description || "No description provided."}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate/5">
                    <span className="text-slate/30 text-[10px] uppercase tracking-widest font-bold">
                      {formatDate(p.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button 
          onClick={onCreate}
          className="fixed bottom-8 right-8 w-16 h-16 bg-terracotta text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </Layout>
  );
};

const CreateProjectView: React.FC<{ onBack: () => void, onCreated: (p: Project) => void }> = ({ onBack, onCreated }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p = dbService.createProject(fd.get('title') as string, fd.get('desc') as string);
    showToast.success('Project created!');
    onCreated(p);
  };
  return (
    <Layout title="New Project" onBack={onBack}>
      <div className="max-w-2xl bg-white p-10 rounded-3xl shadow-lg mx-auto animate-fade-in">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div>
            <label className="block text-slate font-bold mb-2 uppercase tracking-widest text-xs">Project Title</label>
            <input name="title" required placeholder="e.g., Urban Sustainability" className="w-full h-14 px-6 rounded-2xl border-2 border-slate/10 outline-none text-xl focus:border-terracotta transition-colors" />
          </div>
          <div>
            <label className="block text-slate font-bold mb-2 uppercase tracking-widest text-xs">Description</label>
            <textarea name="desc" rows={4} placeholder="Describe the research goals..." className="w-full p-6 rounded-2xl border-2 border-slate/10 outline-none text-lg resize-none focus:border-terracotta transition-colors" />
          </div>
          <button type="submit" className="w-full h-16 bg-terracotta text-white rounded-2xl font-bold text-xl btn-bounce shadow-lg">Create Project</button>
        </form>
      </div>
    </Layout>
  );
};

const RecordInterviewView: React.FC<{ 
  project: Project, 
  onBack: () => void, 
  onInterviewCreated: (i: Interview) => void 
}> = ({ project, onBack, onInterviewCreated }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [mode, setMode] = useState<'select' | 'record' | 'upload'>('select');
  const [selectedLanguage, setSelectedLanguage] = useState('Auto-Detect');
  const [speakerHints, setSpeakerHints] = useState('');
  const [progress, setProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const LANGUAGES = [
    { code: 'Auto-Detect', label: 'Auto-Detect' },
    { code: 'en-US', label: 'English' },
    { code: 'de-DE', label: 'German' },
    { code: 'es-ES', label: 'Spanish' },
    { code: 'ru-RU', label: 'Russian' },
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordTime(0);
      timerRef.current = window.setInterval(() => setRecordTime(prev => prev + 1), 1000);
      showToast.success('Recording started');
    } catch (err) {
      showToast.error('Mic access failed');
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setProgress(15);
    const langLabel = selectedLanguage === 'Auto-Detect' 
      ? 'Auto-Detect' 
      : LANGUAGES.find(l => l.code === selectedLanguage)?.label || 'English';
    
    try {
      const interval = setInterval(() => setProgress(p => Math.min(p + 5, 90)), 1000);
      
      const reader = new FileReader();
      const base64 = await new Promise<string>((res) => {
        reader.onload = () => res((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });

      const promise = transcribeAudio(base64, blob.type, langLabel, speakerHints);
      showToast.promise(promise, {
        loading: langLabel === 'Auto-Detect' ? 'Detecting language & transcribing...' : `Transcribing ${langLabel} audio...`,
        success: 'Transcription complete!',
        error: 'Transcription failed.'
      });

      const sentences = await promise;
      clearInterval(interval);
      setProgress(100);
      
      const interview = dbService.createInterview(project.id, `Recorded Interview ${new Date().toLocaleTimeString()}`, sentences);
      onInterviewCreated(interview);
    } catch (e) {
      showToast.error('AI Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(20);
    try {
      let sentences: TranscriptSentence[] = [];
      if (file.type.startsWith('audio/')) {
        await processAudio(file);
        return;
      } else if (file.type === 'application/pdf') {
        const reader = new FileReader();
        const base64 = await new Promise<string>((res) => {
          reader.onload = () => res((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        sentences = await processDocument({ base64, mimeType: 'application/pdf' }, speakerHints);
      } else if (file.type.includes('wordprocessingml')) {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        sentences = await processDocument({ text: result.value }, speakerHints);
      } else {
        const text = await file.text();
        sentences = await processDocument({ text }, speakerHints);
      }

      const interview = dbService.createInterview(project.id, file.name.replace(/\.[^/.]+$/, ""), sentences);
      showToast.success('Source processed!');
      onInterviewCreated(interview);
    } catch (err) {
      showToast.error('Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout title="Import Data" onBack={onBack}>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {isProcessing ? (
          <div className="space-y-8">
            <ProcessingSpinner message="AI Verbatim Extraction" />
            <div className="max-w-md mx-auto space-y-2">
              <div className="w-full bg-slate/10 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-terracotta transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-center text-[10px] font-bold text-slate/30 uppercase tracking-widest">{progress}% Processed</p>
            </div>
          </div>
        ) : mode === 'select' ? (
          <div className="space-y-10">
            <div className="bg-white p-8 rounded-3xl border border-slate/5 shadow-sm space-y-8">
              <div className="flex flex-col items-center gap-4">
                <label className="text-[10px] font-bold text-slate/40 uppercase tracking-widest">Input Language</label>
                <div className="flex flex-wrap justify-center gap-2">
                  {LANGUAGES.map(l => (
                    <button 
                      key={l.code} 
                      onClick={() => setSelectedLanguage(l.code)}
                      className={`px-4 py-2 rounded-xl border-2 transition-all font-bold text-sm ${selectedLanguage === l.code ? 'border-terracotta bg-terracotta/5 text-terracotta' : 'border-slate/5 bg-slate/5 text-slate/40 hover:bg-slate/10'}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-px bg-slate/5" />
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-bold text-slate/40 uppercase tracking-widest text-center">Speaker Identity Hints (Optional)</label>
                <input 
                  type="text" 
                  value={speakerHints} 
                  onChange={(e) => setSpeakerHints(e.target.value)} 
                  placeholder="e.g. S1: Interviewer, S2: Jane Smith..."
                  className="w-full h-14 px-6 rounded-2xl border-2 border-slate/5 bg-slate/5 font-bold text-slate outline-none focus:border-terracotta transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button onClick={() => setMode('record')} className="bg-white p-12 rounded-3xl shadow-lg hover:shadow-xl transition-all border-4 border-transparent hover:border-terracotta flex flex-col items-center gap-6 group">
                 <div className="w-20 h-20 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta group-hover:scale-110 transition-transform"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></div>
                 <h3 className="text-2xl font-bold text-slate">Record Audio</h3>
              </button>
              <button onClick={() => setMode('upload')} className="bg-white p-12 rounded-3xl shadow-lg hover:shadow-xl transition-all border-4 border-transparent hover:border-sage flex flex-col items-center gap-6 group">
                 <div className="w-20 h-20 bg-sage/10 rounded-full flex items-center justify-center text-sage group-hover:scale-110 transition-transform"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg></div>
                 <h3 className="text-2xl font-bold text-slate">Upload File</h3>
              </button>
            </div>
          </div>
        ) : mode === 'record' ? (
          <div className="bg-white p-12 rounded-3xl shadow-xl text-center space-y-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-slate">Recorder</h2>
            <div className="text-6xl font-mono font-bold text-slate">{Math.floor(recordTime / 60)}:{(recordTime % 60).toString().padStart(2, '0')}</div>
            <div className="flex justify-center gap-4">
              {!isRecording ? <button onClick={startRecording} className="px-10 py-4 bg-terracotta text-white rounded-2xl font-bold text-xl shadow-lg hover:scale-105 active:scale-95 transition-all">Start Recording</button> : <button onClick={() => { mediaRecorderRef.current?.stop(); setIsRecording(false); if (timerRef.current) window.clearInterval(timerRef.current); }} className="px-10 py-4 bg-slate text-white rounded-2xl font-bold text-xl shadow-lg hover:scale-105 active:scale-95 transition-all">Stop & Process</button>}
              <button onClick={() => setMode('select')} className="px-10 py-4 bg-slate/5 text-slate rounded-xl font-bold">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-16 rounded-3xl shadow-lg text-center space-y-6 animate-fade-in">
            <input type="file" id="file-up" className="hidden" onChange={handleFileUpload} accept="audio/*,application/pdf,.docx,text/plain" />
            <label htmlFor="file-up" className="cursor-pointer block p-16 border-4 border-dashed border-slate/10 rounded-3xl hover:border-sage bg-slate/5 transition-all">
               <p className="text-xl font-bold text-slate">Click to choose a file for verbatim extraction</p>
               <span className="text-xs text-slate/30 mt-2 block">Audio, PDF, Word, or TXT</span>
            </label>
            <button onClick={() => setMode('select')} className="px-10 py-4 bg-slate/5 text-slate rounded-xl font-bold">Back</button>
          </div>
        )}
      </div>
    </Layout>
  );
};

const CodingView: React.FC<{ 
  project: Project, 
  interview: Interview, 
  codes: Code[], 
  onFinish: () => void,
  onCodesUpdated: (c: Code[]) => void 
}> = ({ project, interview, codes, onFinish, onCodesUpdated }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [offsets, setOffsets] = useState<{start: number, end: number} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [floatingMenuPos, setFloatingMenuPos] = useState<{ x: number, y: number } | null>(null);
  const [multiSelect, setMultiSelect] = useState<number[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [activeSegments, setActiveSegments] = useState<CodedSegment[]>(dbService.getCodedSegments(interview.id));
  const [isDraggingOverCode, setIsDraggingOverCode] = useState<string | null>(null);
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());

  useKeyboardShortcuts({
    openCodeModal: () => { if (selectedText || multiSelect.length > 0) setIsModalOpen(true); },
    closeModal: () => setIsModalOpen(false),
    undo: () => {
      if (activeSegments.length > 0) {
        const last = activeSegments[activeSegments.length - 1];
        dbService.deleteCodedSegment(last.id);
        setActiveSegments(dbService.getCodedSegments(interview.id));
        showToast.success('Undone');
      }
    },
    showHelp: () => setShowHelp(true),
  });

  const codeUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    dbService.getInterviews(project.id).forEach(i => {
      dbService.getCodedSegments(i.id).forEach(s => {
        counts[s.code_id] = (counts[s.code_id] || 0) + 1;
      });
    });
    return counts;
  }, [activeSegments, project.id]);

  // Hierarchical Parsing
  const rootCodes = useMemo(() => codes.filter(c => !c.parent_id), [codes]);
  const subCodesMap = useMemo(() => {
    const map: Record<string, Code[]> = {};
    codes.filter(c => c.parent_id).forEach(c => {
      if (!map[c.parent_id!]) map[c.parent_id!] = [];
      map[c.parent_id!].push(c);
    });
    return map;
  }, [codes]);

  const handleSelection = (idx: number) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedIdx(idx);
      setSelectedText(selection.toString().trim());
      setOffsets({ start: range.startOffset, end: range.endOffset });
      setFloatingMenuPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    } else {
      setFloatingMenuPos(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    if (!selectedText) return;
    const data = {
      text: selectedText,
      sentenceIndex: idx,
      start: offsets?.start || 0,
      end: offsets?.end || selectedText.length
    };
    e.dataTransfer.setData('application/quilta-selection', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Ghost
    const ghost = document.createElement('div');
    ghost.className = "px-4 py-2 bg-terracotta text-white rounded-lg shadow-xl font-bold";
    ghost.innerText = selectedText.length > 20 ? selectedText.substring(0, 20) + '...' : selectedText;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDropOnCode = (e: React.DragEvent, code: Code) => {
    e.preventDefault();
    setIsDraggingOverCode(null);
    const dataStr = e.dataTransfer.getData('application/quilta-selection');
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        dbService.saveCodedSegment({ 
          interview_id: interview.id, 
          code_id: code.id, 
          segment_text: data.text, 
          sentence_index: data.sentenceIndex, 
          start_char: data.start, 
          end_char: data.end 
        });
        setActiveSegments(dbService.getCodedSegments(interview.id));
        showToast.success(`Coded: ${code.label}`);
        window.getSelection()?.removeAllRanges();
        setSelectedText("");
      } catch (err) {
        console.error("Drop failed", err);
      }
    }
  };

  const onApply = (code: Code) => {
    if (multiSelect.length > 1) {
      multiSelect.forEach(idx => {
        dbService.saveCodedSegment({ interview_id: interview.id, code_id: code.id, segment_text: interview.sentences[idx].text, sentence_index: idx, start_char: 0, end_char: interview.sentences[idx].text.length });
      });
      showToast.success(`Batch coded ${multiSelect.length} segments`);
    } else if (selectedIdx !== null && offsets) {
      dbService.saveCodedSegment({ interview_id: interview.id, code_id: code.id, segment_text: selectedText, sentence_index: selectedIdx, start_char: offsets.start, end_char: offsets.end });
      showToast.success('Code applied');
    }
    setActiveSegments(dbService.getCodedSegments(interview.id));
    setIsModalOpen(false);
    setFloatingMenuPos(null);
    setMultiSelect([]);
    window.getSelection()?.removeAllRanges();
  };

  const handleDeleteCode = (codeId: string) => {
    dbService.deleteCode(codeId);
    onCodesUpdated(dbService.getCodes(project.id));
    setActiveSegments(dbService.getCodedSegments(interview.id));
    showToast.success('Code deleted');
  };

  const toggleExpand = (codeId: string) => {
    const next = new Set(expandedCodes);
    if (next.has(codeId)) next.delete(codeId);
    else next.add(codeId);
    setExpandedCodes(next);
  };

  const renderCodeItem = (code: Code, level: number = 0) => {
    const children = subCodesMap[code.id] || [];
    const isExpanded = expandedCodes.has(code.id);

    return (
      <div key={code.id} className="space-y-1">
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOverCode(code.id); }}
          onDragLeave={() => setIsDraggingOverCode(null)}
          onDrop={(e) => handleDropOnCode(e, code)}
          onClick={() => children.length > 0 && toggleExpand(code.id)}
          className={`group relative p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${isDraggingOverCode === code.id ? 'border-terracotta bg-terracotta/5 scale-[1.02] shadow-lg' : 'border-transparent bg-slate/5 hover:bg-slate/10'} ${level > 0 ? 'ml-6' : ''}`}
        >
          {children.length > 0 && (
            <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          )}
          <div className="w-3 h-3 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: code.color }} />
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-slate truncate ${level > 0 ? 'text-xs' : 'text-sm'}`}>{code.label}</p>
          </div>
          <span className="text-[9px] text-slate/30 font-bold px-1.5 py-0.5 bg-white rounded shadow-sm">
            {codeUsage[code.id] || 0}
          </span>
        </div>
        {isExpanded && children.map(sub => renderCodeItem(sub, level + 1))}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-cream overflow-hidden">
      <header className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm z-50">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate">Coding Studio</h1>
          <p className="text-[10px] text-slate/40 uppercase tracking-widest font-bold truncate max-w-[200px]">{interview.title}</p>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => setShowHelp(true)} className="p-2 text-slate/20 hover:text-slate transition-colors" title="Help">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          <button onClick={onFinish} className="px-8 py-3 bg-slate text-white rounded-xl font-bold shadow-md hover:scale-105 transition-all">Done</button>
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center select-text">
          <div className="max-w-4xl w-full space-y-12 pb-60 select-text">
            {interview.sentences.map((s, idx) => {
              const sentenceSegments = activeSegments.filter(seg => seg.sentence_index === idx);
              const isSelected = multiSelect.includes(idx);
              const isSelectionActive = selectedIdx === idx && selectedText;

              return (
                <div 
                  key={idx} 
                  onMouseUp={() => handleSelection(idx)} 
                  className={`group relative p-4 -m-4 rounded-2xl transition-all select-text ${isSelected ? 'bg-terracotta/5 border-2 border-terracotta/20 ring-4 ring-terracotta/5' : 'hover:bg-slate/5 border-2 border-transparent'}`}
                >
                  {/* Quilt Handle - Only draggable element */}
                  {isSelectionActive && (
                    <div 
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute -left-12 top-1/2 -translate-y-1/2 p-3 bg-terracotta text-white rounded-xl shadow-2xl z-50 animate-bounce cursor-grab active:cursor-grabbing border-2 border-white"
                      title="Drag selection to code"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2 select-none">
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-terracotta' : 'text-slate/20'}`}>#{String(idx + 1).padStart(3, '0')}</span>
                    <span className="text-[10px] font-bold text-terracotta uppercase tracking-tighter ml-2">{s.speaker}</span>
                    <div className="flex flex-wrap gap-1 ml-4">
                        {sentenceSegments.map(seg => {
                          const code = codes.find(c => c.id === seg.code_id);
                          return code && (
                            <div key={seg.id} className="px-2 py-0.5 rounded text-[8px] font-bold text-white flex items-center gap-1 shadow-sm" style={{ backgroundColor: code.color }}>
                              {code.label}
                              <button onClick={(e) => { e.stopPropagation(); dbService.deleteCodedSegment(seg.id); setActiveSegments(dbService.getCodedSegments(interview.id)); showToast.success('Coding removed'); }} className="hover:scale-125 ml-1 transition-transform">×</button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  <div className="text-2xl leading-relaxed font-serif whitespace-pre-wrap select-text text-charcoal/90 border-l-2 pl-4 border-slate/5 group-hover:border-terracotta/20">
                    <GranularHighlighter text={s.text} segments={sentenceSegments} codes={codes} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-80 bg-white border-l border-slate/5 flex flex-col shadow-2xl z-40">
          <div className="p-6 border-b border-slate/5 bg-slate/5">
            <h2 className="text-lg font-bold text-slate">Codebook</h2>
            <p className="text-[10px] text-slate/40 uppercase tracking-widest font-bold">1. Select text <br/> 2. Drag handle to code</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {rootCodes.length === 0 ? (
              <p className="text-center py-10 text-slate/20 font-bold uppercase text-xs tracking-widest">No concepts yet</p>
            ) : (
              rootCodes.map(code => renderCodeItem(code))
            )}
          </div>
          <div className="p-4 bg-slate/5 border-t border-slate/5">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full py-4 bg-terracotta text-white rounded-xl font-bold text-sm shadow-md"
            >
              Manage & Add Sub-Codes
            </button>
          </div>
        </aside>
      </div>

      {(floatingMenuPos || multiSelect.length > 0) && (
        <div className="fixed z-[60] -translate-x-1/2 bottom-12 left-[40%]">
          <button onClick={() => setIsModalOpen(true)} className="px-10 py-5 bg-slate text-white rounded-full font-bold shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
            Code Selection
          </button>
        </div>
      )}
      <CodeSelectionModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        selectedSnippet={multiSelect.length > 1 ? `Multiple segments (${multiSelect.length})` : selectedText}
        existingCodes={codes} onApply={onApply}
        onCreateAndApply={(l, c, iv, pid) => { const nc = dbService.createCode(project.id, l, c, undefined, iv, pid); onCodesUpdated(dbService.getCodes(project.id)); onApply(nc); }}
        onDeleteCode={handleDeleteCode}
        codeUsageCounts={codeUsage}
      />
      <ConfirmDialog isOpen={showHelp} title="Shortcuts" message="Drag text selection onto codes in the sidebar to assign them | Hierarchical: Create sub-codes in the Manage panel. | ESC: Close" confirmText="OK" onConfirm={() => setShowHelp(false)} onCancel={() => setShowHelp(false)} variant="info" />
    </div>
  );
};

// --- Main App Controller ---

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('AUTH');
  const [user, setUser] = useState<Profile | null>(dbService.getCurrentUser());
  const [projects, setProjects] = useState<Project[]>(dbService.getProjects());
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Sentence edit state
  const [editingSentenceIdx, setEditingSentenceIdx] = useState<number | null>(null);
  const [editBuffer, setEditBuffer] = useState("");

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setProjects(dbService.getProjects());
      setView('PROJECTS');
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [user]);

  const onLogin = (email: string) => setUser(dbService.login(email));
  const onLogout = () => { dbService.logout(); setUser(null); setView('AUTH'); showToast.success('Logged out'); };

  const onOpenProject = (p: Project) => {
    setCurrentProject(p);
    setInterviews(dbService.getInterviews(p.id));
    setCodes(dbService.getCodes(p.id));
    setView('PROJECT_DETAIL');
  };

  const saveCorrection = (idx: number) => {
    if (currentInterview) {
      dbService.updateSentence(currentInterview.id, idx, { text: editBuffer });
      const updated = dbService.getInterviewById(currentInterview.id);
      if (updated) setCurrentInterview(updated);
      setEditingSentenceIdx(null);
      showToast.success('Updated verbatim');
    }
  };

  const deleteSentence = (idx: number) => {
    if (currentInterview && confirm("Permanently remove this segment?")) {
      dbService.deleteSentence(currentInterview.id, idx);
      const updated = dbService.getInterviewById(currentInterview.id);
      if (updated) setCurrentInterview(updated);
      showToast.success('Segment deleted');
    }
  };

  const renderView = () => {
    switch (view) {
      case 'AUTH': return <AuthView onLogin={onLogin} />;
      case 'PROJECTS': return <ProjectsView projects={projects} isLoading={isLoading} onOpen={onOpenProject} onCreate={() => setView('CREATE_PROJECT')} onLogout={onLogout} />;
      case 'CREATE_PROJECT': return <CreateProjectView onBack={() => setView('PROJECTS')} onCreated={(p) => { setProjects([...projects, p]); onOpenProject(p); }} />;
      case 'PROJECT_DETAIL': return currentProject ? (
        <Layout title={currentProject.title} onBack={() => setView('PROJECTS')} 
          actions={<div className="flex gap-2">
            <button onClick={() => setView('EXPORT')} className="px-4 py-2 bg-sage text-white rounded-xl font-bold text-sm shadow-sm hover:bg-sage/90">Export</button>
          </div>}
        >
          <div className="relative pb-32 animate-fade-in">
            <h2 className="text-2xl font-bold text-charcoal mb-2">{currentProject.title}</h2>
            <p className="text-charcoal/60 mb-6">{currentProject.description || "No description."}</p>
            <div className="space-y-3">
              {interviews.map(i => (
                <div key={i.id} onClick={() => { setCurrentInterview(i); setView('INTERVIEW_DETAIL'); }} className="bg-white p-5 rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:shadow-md border border-slate/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate/5 flex items-center justify-center text-slate/40"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                    <h3 className="text-lg font-bold text-charcoal">{i.title}</h3>
                  </div>
                  <span className="px-3 py-1 bg-slate/5 text-slate/40 text-[10px] font-bold uppercase rounded-full">{dbService.getCodedSegments(i.id).length} Codes</span>
                </div>
              ))}
            </div>
            <button onClick={() => setView('RECORD_INTERVIEW')} className="fixed bottom-8 right-8 w-16 h-16 bg-terracotta text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></button>
          </div>
        </Layout>
      ) : null;
      case 'RECORD_INTERVIEW': return currentProject ? <RecordInterviewView project={currentProject} onBack={() => setView('PROJECT_DETAIL')} onInterviewCreated={(i) => { setInterviews([...interviews, i]); setCurrentInterview(i); setView('INTERVIEW_DETAIL'); }} /> : null;
      case 'INTERVIEW_DETAIL': return currentInterview && currentProject ? (
        <Layout title={currentInterview.title} onBack={() => setView('PROJECT_DETAIL')} 
          actions={<button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-slate/20 hover:text-red-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
        >
          <div className="max-w-4xl mx-auto space-y-8 pb-40 animate-fade-in">
            <div className="bg-white p-10 rounded-3xl shadow-lg">
              <div className="space-y-6">
                {currentInterview.sentences.map((s, idx) => (
                  <div key={idx} className="flex gap-4 group items-start">
                    <span className="text-[10px] font-bold text-slate/10 mt-2 shrink-0">#{idx+1}</span>
                    <div className="flex-1">
                      {editingSentenceIdx === idx ? (
                        <div className="space-y-2 animate-fade-in">
                          <textarea 
                            className="w-full p-4 bg-cream/30 border-2 border-terracotta rounded-xl font-serif text-lg outline-none"
                            value={editBuffer}
                            onChange={(e) => setEditBuffer(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button onClick={() => saveCorrection(idx)} className="px-4 py-2 bg-terracotta text-white rounded-lg font-bold text-xs">Save</button>
                            <button onClick={() => setEditingSentenceIdx(null)} className="px-4 py-2 bg-slate/5 rounded-lg font-bold text-xs">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group/text">
                          <p className="text-lg font-serif leading-relaxed text-charcoal/90">{s.text}</p>
                          <div className="absolute right-0 top-0 opacity-0 group-hover/text:opacity-100 flex gap-2">
                            <button 
                              onClick={() => { setEditingSentenceIdx(idx); setEditBuffer(s.text); }}
                              className="p-1.5 bg-white border border-slate/10 rounded shadow-sm text-slate/30 hover:text-terracotta"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button 
                              onClick={() => deleteSentence(idx)}
                              className="p-1.5 bg-white border border-slate/10 rounded shadow-sm text-slate/30 hover:text-red-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setView('CODING')} className="fixed bottom-12 right-8 h-16 px-10 bg-terracotta text-white rounded-full font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all">Coding Studio</button>
            <ConfirmDialog isOpen={showDeleteConfirm} title="Delete Source?" message="This will permanently delete this interview." confirmText="Delete" onConfirm={() => { dbService.deleteInterview(currentInterview.id); setInterviews(interviews.filter(i => i.id !== currentInterview.id)); setShowDeleteConfirm(false); setView('PROJECT_DETAIL'); showToast.success('Interview deleted'); }} onCancel={() => setShowDeleteConfirm(false)} variant="danger" />
          </div>
        </Layout>
      ) : null;
      case 'CODING': return currentProject && currentInterview ? <CodingView project={currentProject} interview={currentInterview} codes={codes} onFinish={() => setView('INTERVIEW_DETAIL')} onCodesUpdated={(c) => setCodes(c)} /> : null;
      case 'EXPORT': return currentProject ? (
        <Layout title="Export Center" onBack={() => setView('PROJECT_DETAIL')}>
          <div className="max-w-5xl mx-auto py-10 animate-fade-in"><p className="text-slate/60 mb-10">Generate thematic analysis and academic reports based on your verbatim coding.</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-lg h-fit space-y-4">
                <button onClick={() => { showToast.success('Exporting...'); }} className="w-full h-14 bg-blue-600 text-white rounded-xl font-bold">Download Word (.DOC)</button>
                <button onClick={() => { window.print(); }} className="w-full h-14 bg-orange-600 text-white rounded-xl font-bold">Print/PDF Report</button>
              </div>
              <div className="lg:col-span-2 bg-white p-10 rounded-3xl shadow-lg min-h-[400px]">
                <h3 className="text-2xl font-bold text-slate mb-4">Academic Synthesis</h3>
                <p className="text-charcoal/40 italic">Synthesis of verbatim segments will appear here after analysis generation.</p>
              </div>
            </div>
          </div>
        </Layout>
      ) : null;
      default: return null;
    }
  };

  return (
    <div className="App">
      <Toaster position="top-right" />
      {renderView()}
    </div>
  );
};

export default App;