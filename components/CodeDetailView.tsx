import React, { useState, useMemo } from 'react';
import { Code, CodedSegment, Interview, Project } from '../types';
import { dbService } from '../services/dbService';
import { showToast } from '../lib/toast';

interface CodeDetailViewProps {
  project: Project;
  code: Code;
  allCodes: Code[];
  interviews: Interview[];
  onBack: () => void;
  onNavigateToSource: (interviewId: string, sentenceIndex: number) => void;
}

const CodeDetailView: React.FC<CodeDetailViewProps> = ({
  project,
  code,
  allCodes,
  interviews,
  onBack,
  onNavigateToSource
}) => {
  const [includeSubCodes, setIncludeSubCodes] = useState(true);
  const [filterInterviewId, setFilterInterviewId] = useState<string>('all');
  const [filterCommentStatus, setFilterCommentStatus] = useState<'all' | 'has_comment' | 'no_comment'>('all');
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState('');

  // Get relevant code IDs (this code + optionally sub-codes)
  const relevantCodeIds = useMemo(() => {
    const ids = [code.id];
    if (includeSubCodes) {
      allCodes.filter(c => c.parent_id === code.id).forEach(c => ids.push(c.id));
    }
    return ids;
  }, [code.id, allCodes, includeSubCodes]);

  // Get all segments for these codes in this project
  const allSegments = useMemo(() => {
    // We need to fetch all segments for the project
    // dbService.getAllCodedSegments() returns all segments in LocalStorage
    // We filter by project (via interview_id) and code_id
    const interviewIds = new Set(interviews.map(i => i.id));
    return dbService.getAllCodedSegments().filter(s => 
      interviewIds.has(s.interview_id) && relevantCodeIds.includes(s.code_id)
    );
  }, [interviews, relevantCodeIds]);

  // Apply filters
  const filteredSegments = useMemo(() => {
    return allSegments.filter(s => {
      const matchesInterview = filterInterviewId === 'all' || s.interview_id === filterInterviewId;
      const matchesComment = filterCommentStatus === 'all' || 
        (filterCommentStatus === 'has_comment' ? !!s.comment : !s.comment);
      return matchesInterview && matchesComment;
    });
  }, [allSegments, filterInterviewId, filterCommentStatus]);

  const handleSaveComment = (segmentId: string) => {
    dbService.updateCodedSegment(segmentId, { comment: editComment });
    setEditingSegmentId(null);
    showToast.success('Comment saved');
  };

  return (
    <div className="flex flex-col h-full bg-cream animate-fade-in">
      {/* Header */}
      <header className="bg-white border-b border-slate/5 px-8 py-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate/5 rounded-full text-slate/40 hover:text-slate transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: code.color }} />
              <h2 className="text-2xl font-bold text-slate">{code.label}</h2>
            </div>
            <p className="text-[10px] font-bold text-slate/30 uppercase tracking-widest mt-1">Code Detail View • {filteredSegments.length} Excerpts</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate/5 p-1 rounded-xl">
            <button 
              onClick={() => setIncludeSubCodes(false)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!includeSubCodes ? 'bg-white text-slate shadow-sm' : 'text-slate/40 hover:text-slate'}`}
            >
              Direct Only
            </button>
            <button 
              onClick={() => setIncludeSubCodes(true)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${includeSubCodes ? 'bg-white text-slate shadow-sm' : 'text-slate/40 hover:text-slate'}`}
            >
              Include Sub-codes
            </button>
          </div>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="bg-white/50 border-b border-slate/5 px-8 py-4 flex flex-wrap gap-6 items-center shrink-0">
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold text-slate/30 uppercase tracking-widest">Document</label>
          <select 
            value={filterInterviewId}
            onChange={(e) => setFilterInterviewId(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate/10 bg-white text-xs font-bold text-slate outline-none focus:border-terracotta"
          >
            <option value="all">All Documents</option>
            {interviews.map(i => (
              <option key={i.id} value={i.id}>{i.title}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold text-slate/30 uppercase tracking-widest">Comments</label>
          <select 
            value={filterCommentStatus}
            onChange={(e) => setFilterCommentStatus(e.target.value as any)}
            className="h-9 px-3 rounded-lg border border-slate/10 bg-white text-xs font-bold text-slate outline-none focus:border-terracotta"
          >
            <option value="all">All Status</option>
            <option value="has_comment">With Comments</option>
            <option value="no_comment">Without Comments</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-8">
        {filteredSegments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-xl font-bold">No excerpts found</p>
            <p className="text-sm">Try adjusting your filters or coding more segments.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate/5 overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate/5 border-b border-slate/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate/40 uppercase tracking-widest w-1/4">Document</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate/40 uppercase tracking-widest w-1/3">Excerpt</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate/40 uppercase tracking-widest w-1/3">Memo / Comment</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate/40 uppercase tracking-widest w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate/5">
                {filteredSegments.map(s => {
                  const interview = interviews.find(i => i.id === s.interview_id);
                  const segmentCode = allCodes.find(c => c.id === s.code_id);
                  
                  return (
                    <tr key={s.id} className="hover:bg-slate/[0.02] transition-colors group">
                      <td className="px-6 py-6 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate leading-tight">{interview?.title || 'Unknown'}</span>
                          <span className="text-[10px] text-slate/30 font-bold uppercase tracking-wider">
                            Sentence #{s.sentence_index + 1}
                          </span>
                          {includeSubCodes && segmentCode && segmentCode.id !== code.id && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: segmentCode.color }} />
                              <span className="text-[9px] font-bold text-slate/40 uppercase">{segmentCode.label}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <div 
                          className="text-sm text-charcoal leading-relaxed font-serif italic cursor-pointer hover:text-terracotta transition-colors"
                          onClick={() => onNavigateToSource(s.interview_id, s.sentence_index)}
                        >
                          "...{s.segment_text}..."
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top">
                        {editingSegmentId === s.id ? (
                          <div className="space-y-2">
                            <textarea 
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                              className="w-full p-3 rounded-xl border-2 border-terracotta/20 bg-slate/5 outline-none text-sm resize-none h-24 focus:border-terracotta transition-all"
                              placeholder="Add a research memo..."
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleSaveComment(s.id)}
                                className="px-3 py-1.5 bg-terracotta text-white rounded-lg text-xs font-bold shadow-sm"
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setEditingSegmentId(null)}
                                className="px-3 py-1.5 bg-slate/5 text-slate/40 rounded-lg text-xs font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="group/comment cursor-pointer min-h-[40px]"
                            onClick={() => {
                              setEditingSegmentId(s.id);
                              setEditComment(s.comment || '');
                            }}
                          >
                            {s.comment ? (
                              <p className="text-sm text-slate/70 leading-relaxed">{s.comment}</p>
                            ) : (
                              <span className="text-xs text-slate/20 italic group-hover/comment:text-slate/40 transition-colors">Click to add a memo...</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6 align-top text-right">
                        <button 
                          onClick={() => onNavigateToSource(s.interview_id, s.sentence_index)}
                          className="p-2 text-slate/20 hover:text-terracotta transition-colors"
                          title="Go to source"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeDetailView;
