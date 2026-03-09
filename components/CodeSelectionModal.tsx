import React, { useState } from 'react';
import { Code, Project } from '../types';
import { CODE_COLORS } from '../constants';

interface CodeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sentenceText?: string;
  selectedSnippet: string;
  sentenceIndex?: number;
  interviewId?: string;
  projectId?: string;
  existingCodes: Code[];
  onApply: (code: Code) => void;
  onCreateAndApply: (label: string, color: string, isInVivo?: boolean, parentId?: string) => void;
  onDeleteCode?: (codeId: string) => void;
  codeUsageCounts?: Record<string, number>;
}

const CodeSelectionModal: React.FC<CodeSelectionModalProps> = ({
  isOpen,
  onClose,
  sentenceText,
  selectedSnippet,
  existingCodes,
  onApply,
  onCreateAndApply,
  onDeleteCode,
  codeUsageCounts = {}
}) => {
  const [newCodeLabel, setNewCodeLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(CODE_COLORS[0]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [codeToDelete, setCodeToDelete] = useState<Code | null>(null);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (newCodeLabel.trim().length >= 2) {
      onCreateAndApply(
        newCodeLabel.trim(), 
        selectedColor, 
        false, 
        selectedParentId || undefined
      );
      setNewCodeLabel('');
      setSelectedParentId('');
    }
  };

  const handleInVivo = () => {
    if (selectedSnippet.trim().length >= 1) {
      onCreateAndApply(selectedSnippet.trim(), selectedColor, true);
    }
  };

  const confirmDelete = (code: Code) => {
    setCodeToDelete(code);
  };

  const finalizeDelete = () => {
    if (codeToDelete && onDeleteCode) {
      onDeleteCode(codeToDelete.id);
      setCodeToDelete(null);
    }
  };

  // Hierarchy Logic
  const rootCodes = existingCodes.filter(c => !c.parent_id);
  const getSubCodes = (parentId: string) => existingCodes.filter(c => c.parent_id === parentId);

  const renderCodeSelectionRow = (code: Code, isSubCode: boolean = false) => (
    <div key={code.id} className={`group relative flex items-center gap-2 ${isSubCode ? 'ml-8' : ''}`}>
      <button
        onClick={() => onApply(code)}
        className={`flex-1 flex items-center gap-4 p-4 bg-white rounded-xl border border-slate/5 hover:border-terracotta/30 active:scale-[0.98] transition-all text-left h-14 ${isSubCode ? 'bg-slate/5' : ''}`}
      >
        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: code.color }} />
        <span className={`font-bold text-slate flex-1 truncate ${isSubCode ? 'text-sm' : ''}`}>{code.label}</span>
        {codeUsageCounts[code.id] !== undefined && (
          <span className="text-[10px] text-slate/30 font-bold">{codeUsageCounts[code.id]}</span>
        )}
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); confirmDelete(code); }}
        className="p-3 opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate/20 transition-all"
        title="Delete code"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate/40 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div 
        className="relative w-full max-w-2xl bg-cream rounded-t-[24px] shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full duration-300"
        style={{ height: '80%' }}
      >
        <div className="w-12 h-1.5 bg-slate/10 rounded-full mx-auto mt-3 mb-1" />

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          <header className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate">Code Selection</h2>
              <p className="text-slate/40 text-xs uppercase tracking-widest font-bold mt-1">Granular Qualitative Analysis</p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate/5 rounded-full text-slate/40 hover:text-slate">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate/40 uppercase tracking-widest">Selected Segment</h3>
             <div className="p-5 bg-white rounded-xl border-l-4 border-terracotta shadow-inner">
                <p className="text-lg text-charcoal leading-relaxed font-serif italic">"...{selectedSnippet}..."</p>
             </div>
          </div>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate/40 uppercase tracking-widest">In Vivo Coding</h3>
            <button
              onClick={handleInVivo}
              className="w-full flex items-center justify-between p-5 bg-sage/10 border-2 border-sage/20 rounded-xl hover:bg-sage/20 transition-all text-left group"
            >
              <div>
                <span className="block font-bold text-sage">Use as In Vivo Code</span>
                <span className="text-xs text-sage/60">Create a new code named "{selectedSnippet}"</span>
              </div>
              <svg className="w-6 h-6 text-sage group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          </section>

          <div className="h-px bg-slate/10" />

          <section>
            <h3 className="text-xs font-bold text-slate/40 uppercase tracking-widest mb-4">Apply Existing Code</h3>
            <div className="grid grid-cols-1 gap-2">
              {rootCodes.length === 0 ? (
                <p className="text-sm text-slate/30 italic">No existing codes.</p>
              ) : (
                rootCodes.map(root => (
                  <div key={root.id} className="space-y-2">
                    {renderCodeSelectionRow(root)}
                    {getSubCodes(root.id).map(sub => renderCodeSelectionRow(sub, true))}
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="h-px bg-slate/10" />

          <section className="space-y-6">
            <h3 className="text-xs font-bold text-slate/40 uppercase tracking-widest">Create Category Code</h3>
            <div className="space-y-4 pb-8">
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCodeLabel}
                    onChange={(e) => setNewCodeLabel(e.target.value)}
                    placeholder="New category name..."
                    className="flex-1 h-14 px-5 rounded-xl border-2 border-slate/5 bg-white focus:border-terracotta outline-none transition-all font-bold text-slate"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={newCodeLabel.trim().length < 2}
                    className="px-6 bg-terracotta text-white rounded-xl font-bold shadow-lg disabled:opacity-30 transition-all"
                  >
                    Create
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate/40 uppercase tracking-widest">Parent Concept (Optional)</label>
                  <select 
                    value={selectedParentId} 
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate/5 bg-white text-slate font-medium outline-none"
                  >
                    <option value="">No Parent (Root Category)</option>
                    {rootCodes.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {selectedParentId ? (
                  <div className="flex flex-col gap-2 p-4 bg-white rounded-xl border-2 border-slate/5 w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: existingCodes.find(c => c.id === selectedParentId)?.color }} />
                      <span className="text-sm font-bold text-slate">Color inherited from parent code</span>
                    </div>
                    <p className="text-[10px] text-slate/40 leading-tight">
                      Sub-codes automatically match the color of their root category to maintain visual consistency in your codebook.
                    </p>
                  </div>
                ) : (
                  CODE_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full transition-all border-4 ${selectedColor === color ? 'border-white ring-2 ring-terracotta shadow-md' : 'border-transparent opacity-80'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 bg-white/40 border-t border-slate/5">
          <button 
            onClick={onClose}
            className="w-full h-14 border-2 border-slate/10 rounded-xl font-bold text-slate/40 hover:bg-slate/5 transition-all"
          >
            Cancel
          </button>
        </div>

        {/* Local confirmation for deletion */}
        {codeToDelete && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center p-8 bg-cream/90 backdrop-blur-sm rounded-t-[24px]">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full space-y-6 text-center animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate">Delete Code?</h3>
              <p className="text-slate/60 text-sm">Deleting "<b>{codeToDelete.label}</b>" will remove it from all segments in this project. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setCodeToDelete(null)} className="flex-1 py-3 bg-slate/5 text-slate rounded-xl font-bold">Cancel</button>
                <button onClick={finalizeDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeSelectionModal;