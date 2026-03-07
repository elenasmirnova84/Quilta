import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import mammoth from 'mammoth';
import Layout from '../../../shared/components/Layout';
import { ProcessingSpinner } from '../../../shared/components/LoadingStates';
import { transcribeAudio, processDocument } from '../../../services/geminiService';
import { useInterviews } from '../hooks/useInterviews';
import { showToast } from '../../../lib/toast';
import { TranscriptSentence } from '../../../types';

const LANGUAGES = [
  { code: 'Auto-Detect', label: 'Auto-Detect' },
  { code: 'en-US', label: 'English' },
  { code: 'de-DE', label: 'German' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'ru-RU', label: 'Russian' },
];

const RecordInterviewView: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { createInterview } = useInterviews(projectId);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [mode, setMode] = useState<'select' | 'record' | 'upload'>('select');
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
  const [speakerHints, setSpeakerHints] = useState('');
  const [progress, setProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

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
      timerRef.current = window.setInterval(() => setRecordTime(t => t + 1), 1000);
      showToast.success('Recording started');
    } catch (err) {
      showToast.error('Mic access failed');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setProgress(15);
    const langLabel = LANGUAGES.find(l => l.code === selectedLanguage)?.label || 'Auto-Detect';
    
    try {
      const interval = setInterval(() => setProgress(p => Math.min(p + 5, 90)), 1000);
      
      const reader = new FileReader();
      const base64 = await new Promise<string>((res) => {
        reader.onload = () => res((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });

      const sentences = await transcribeAudio(base64, blob.type, langLabel, speakerHints);
      clearInterval(interval);
      setProgress(100);
      
      const interview = createInterview(`Interview ${new Date().toLocaleTimeString()}`, sentences);
      if (interview) {
        showToast.success('Transcription complete!');
        navigate(`/projects/${projectId}/interviews/${interview.id}`);
      }
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

      const interview = createInterview(file.name.replace(/\.[^/.]+$/, ""), sentences);
      if (interview) navigate(`/projects/${projectId}/interviews/${interview.id}`);
    } catch (err) {
      showToast.error('Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout title="Import Data" onBack={() => navigate(`/projects/${projectId}`)}>
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
        ) : (
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
                  placeholder="e.g. S1: Interviewer, S2: Dr. Smith, Respondent B..."
                  className="w-full h-14 px-6 rounded-2xl border-2 border-slate/5 bg-slate/5 font-bold text-slate outline-none focus:border-terracotta transition-all"
                />
                <p className="text-[10px] text-slate/30 text-center italic">Helps the AI assign correct names or abbreviations during extraction.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button onClick={() => setMode('record')} className={`bg-white p-12 rounded-3xl shadow-lg border-4 transition-all flex flex-col items-center gap-6 group ${mode === 'record' ? 'border-terracotta' : 'border-transparent hover:border-terracotta/20'}`}>
                 <div className="w-20 h-20 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></div>
                 <h3 className="text-2xl font-bold text-slate">Recorder</h3>
              </button>
              <button onClick={() => setMode('upload')} className={`bg-white p-12 rounded-3xl shadow-lg border-4 transition-all flex flex-col items-center gap-6 group ${mode === 'upload' ? 'border-sage' : 'border-transparent hover:border-sage/20'}`}>
                 <div className="w-20 h-20 bg-sage/10 rounded-full flex items-center justify-center text-sage"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg></div>
                 <h3 className="text-2xl font-bold text-slate">File Upload</h3>
              </button>
            </div>

            {mode === 'record' && (
              <div className="bg-white p-12 rounded-3xl shadow-xl text-center space-y-8 animate-fade-in">
                <div className="text-6xl font-mono font-bold text-slate">{Math.floor(recordTime / 60)}:{(recordTime % 60).toString().padStart(2, '0')}</div>
                <div className="flex justify-center gap-4">
                  {!isRecording ? <button onClick={startRecording} className="px-10 py-4 bg-terracotta text-white rounded-2xl font-bold text-xl shadow-lg hover:scale-105 active:scale-95 transition-all">Start Recording</button> : <button onClick={stopRecording} className="px-10 py-4 bg-slate text-white rounded-2xl font-bold text-xl shadow-lg hover:scale-105 active:scale-95 transition-all">Stop & Transcribe</button>}
                </div>
              </div>
            )}

            {mode === 'upload' && (
              <div className="bg-white p-12 rounded-3xl shadow-xl text-center space-y-6 animate-fade-in">
                <input type="file" id="file-up" className="hidden" onChange={handleFileUpload} accept="audio/*,application/pdf,.docx,text/plain" />
                <label htmlFor="file-up" className="cursor-pointer block p-16 border-4 border-dashed border-slate/10 rounded-3xl hover:border-sage bg-slate/5 transition-all">
                   <p className="text-xl font-bold text-slate">Drop source file here for verbatim extraction</p>
                   <span className="text-xs text-slate/30 mt-2 block">Audio, PDF, Word, or TXT</span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RecordInterviewView;