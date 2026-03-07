
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import { useInterviews } from '../hooks/useInterviews';
import { dbService } from '../../../services/dbService';
import { showToast } from '../../../lib/toast';

const InterviewDetailView: React.FC = () => {
  const { projectId, interviewId } = useParams();
  const navigate = useNavigate();
  const { getInterview, deleteInterview, refresh } = useInterviews(projectId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [renameSpeaker, setRenameSpeaker] = useState<{ oldLabel: string; newLabel: string } | null>(null);
  
  // Sentence editing state
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editBuffer, setEditBuffer] = useState<string>("");

  const interview = interviewId ? getInterview(interviewId) : null;

  if (!interview) return null;

  const handleDelete = () => {
    deleteInterview(interview.id);
    setShowDeleteConfirm(false);
    navigate(`/projects/${projectId}`);
  };

  const handleRenameSpeaker = () => {
    if (renameSpeaker && renameSpeaker.newLabel.trim()) {
      dbService.updateSpeakerLabel(interview.id, renameSpeaker.oldLabel, renameSpeaker.newLabel.trim());
      showToast.success(`Renamed ${renameSpeaker.oldLabel} to ${renameSpeaker.newLabel}`);
      setRenameSpeaker(null);
      refresh();
    }
  };

  const startEditing = (idx: number, currentText: string) => {
    setEditingIdx(idx);
    setEditBuffer(currentText);
  };

  const saveCorrection = () => {
    if (editingIdx !== null) {
      dbService.updateSentence(interview.id, editingIdx, { text: editBuffer });
      showToast.success('Verbatim corrected');
      setEditingIdx(null);
      refresh();
    }
  };

  const deleteSentence = (idx: number) => {
    if (confirm("Permanently delete this verbatim block? Coding segments for this block will be removed.")) {
      dbService.deleteSentence(interview.id, idx);
      showToast.success('Block removed');
      refresh();
    }
  };

  const getSpeakerColor = (name: string) => {
    const colors = ['#E07A5F', '#81B29A', '#3D405B', '#F2CC8F', '#A06040', '#4A6D5A'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Layout 
      title={interview.title} 
      onBack={() => navigate(`/projects/${projectId}`)}
      actions={
        <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-slate/20 hover:text-red-500 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      }
    >
      <div className="max-w-4xl mx-auto space-y-8 pb-40 animate-fade-in">
        <div className="bg-white p-10 rounded-3xl shadow-lg border border-slate/5">
          <div className="space-y-8">
            {interview.sentences.map((s, idx) => (
              <div key={idx} className="flex gap-4 group items-start">
                <div className="flex flex-col items-end w-28 shrink-0 mt-1">
                   <span className="text-[9px] font-bold text-slate/10 group-hover:text-slate/20 transition-colors">#{String(idx + 1).padStart(3, '0')}</span>
                   <button 
                    onClick={() => setRenameSpeaker({ oldLabel: s.speaker, newLabel: s.speaker })}
                    className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter truncate max-w-full hover:scale-105 transition-all active:scale-95"
                    style={{ backgroundColor: `${getSpeakerColor(s.speaker)}15`, color: getSpeakerColor(s.speaker) }}
                   >
                     {s.speaker}
                   </button>
                </div>
                
                <div className="flex-1 min-w-0">
                  {editingIdx === idx ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <textarea 
                        className="w-full p-4 bg-cream/30 border-2 border-terracotta rounded-2xl font-serif text-lg leading-relaxed outline-none focus:bg-white transition-all min-h-[120px]"
                        value={editBuffer}
                        onChange={(e) => setEditBuffer(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button onClick={saveCorrection} className="px-4 py-2 bg-terracotta text-white rounded-xl font-bold text-sm shadow-md">Save Changes</button>
                        <button onClick={() => setEditingIdx(null)} className="px-4 py-2 bg-slate/5 text-slate rounded-xl font-bold text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group/sentence">
                      <p className="text-lg leading-relaxed text-charcoal/90 font-serif border-l-2 border-slate/5 pl-6 group-hover:border-terracotta/20 transition-colors whitespace-pre-wrap">
                        {s.text}
                      </p>
                      <div className="absolute right-0 top-0 opacity-0 group-hover/sentence:opacity-100 transition-opacity flex gap-2">
                        <button 
                          onClick={() => startEditing(idx, s.text)}
                          className="p-1.5 bg-white shadow-sm border border-slate/10 rounded-lg text-slate/40 hover:text-terracotta hover:border-terracotta transition-all"
                          title="Correct Verbatim"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button 
                          onClick={() => deleteSentence(idx)}
                          className="p-1.5 bg-white shadow-sm border border-slate/10 rounded-lg text-slate/40 hover:text-red-500 hover:border-red-200 transition-all"
                          title="Delete Sentence"
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
        
        <button 
          onClick={() => navigate(`/projects/${projectId}/interviews/${interview.id}/coding`)}
          className="fixed bottom-12 right-8 h-16 px-10 bg-terracotta text-white rounded-full font-bold text-lg shadow-2xl hover:scale-105 transition-all z-50 flex items-center gap-3 active:scale-95"
        >
          Open Coding Studio
        </button>

        {renameSpeaker && (
          <div className="fixed inset-0 bg-slate/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
             <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
                <h3 className="text-2xl font-bold text-slate">Rename Speaker</h3>
                <p className="text-slate/60 text-sm">Update "{renameSpeaker.oldLabel}" to a specific name or abbreviation globally.</p>
                <input 
                  type="text" 
                  value={renameSpeaker.newLabel}
                  onChange={(e) => setRenameSpeaker({ ...renameSpeaker, newLabel: e.target.value })}
                  className="w-full h-14 px-6 rounded-2xl border-2 border-slate/10 outline-none focus:border-terracotta text-lg font-bold"
                  autoFocus
                />
                <div className="flex gap-3 pt-4">
                   <button onClick={() => setRenameSpeaker(null)} className="flex-1 py-4 bg-slate/5 text-slate rounded-2xl font-bold">Cancel</button>
                   <button onClick={handleRenameSpeaker} className="flex-1 py-4 bg-terracotta text-white rounded-2xl font-bold shadow-lg">Update All</button>
                </div>
             </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete Interview?"
          message="This will permanently delete this interview and all its coded segments. This cannot be undone."
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          variant="danger"
        />
      </div>
    </Layout>
  );
};

export default InterviewDetailView;
