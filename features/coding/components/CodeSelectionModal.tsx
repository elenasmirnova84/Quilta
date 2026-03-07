import React, { useState, useMemo, useEffect } from 'react';
import { Code } from '../../../types';
import { CODE_COLORS } from '../../../constants';

interface CodeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSnippet: string;
  existingCodes: Code[];
  onApply: (code: Code) => void;
  onCreateAndApply: (label: string, color: string, isInVivo?: boolean, parentId?: string) => void;
  onDeleteCode?: (codeId: string) => void;
  codeUsageCounts?: Record<string, number>;
  initialParentId?: string; // New prop for drag-to-subcode
}

const CodeSelectionModal: React.FC<CodeSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedSnippet,
  existingCodes,
  onApply,
  onCreateAndApply,
  onDeleteCode,
  codeUsageCounts = {},
  initialParentId
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [color, setColor] = useState(CODE_COLORS[0]);
  const [search, setSearch] = useState('');
  const [codeToDelete, setCodeToDelete] = useState<Code | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  // Sync parent ID if opened via drag-to-subcode
  useEffect(() => {
    if (isOpen) {
      setSelectedParentId(initialParentId || '');
      // If opened from a "New Concept" drop, pre-fill label if it looks like a good name
      if (!initialParentId && selectedSnippet && !selectedSnippet.includes('Multiple') && selectedSnippet.length < 30) {
        setNewLabel(selectedSnippet);
      } else {
        setNewLabel('');
      }
    }
  }, [isOpen, initialParentId, selectedSnippet]);

  const filtered = useMemo(() => {
    return existingCodes.filter(c => 
      c.label.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => (codeUsageCounts[b.id] || 0) - (codeUsageCounts[a.id] || 0));
  }, [existingCodes, search, codeUsageCounts]);

  const rootCodesForParentSelection = useMemo(() => 
    existingCodes.filter(c => !c.parent_id), 
    [existingCodes]
  );

  if (!isOpen) return null;

  const finalizeDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (codeToDelete && onDeleteCode) {
      onDeleteCode(codeToDelete.id);
      setCodeToDelete(null);
    }
  };

  const handleCreateNew = () => {
    if (newLabel.length >= 2) {
      onCreateAndApply(newLabel, color, false, selectedParentId || undefined);
      setNewLabel('');
      setSelectedParentId('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate/40 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-cream rounded-t-[40px] shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full duration-300" style={{ height: '85%' }}>
        <div className="w-16 h-1.5 bg-slate/10 rounded-full mx-auto mt-4 mb-2" />
        <div className="p-10 overflow-y-auto flex-1 space-y-12">
          <header className="flex justify-between items-start">
            <h2 className="text-3xl font-bold text-slate">Assign Code</h2>
            <button onClick={onClose} className="p-3 bg-slate/5 rounded-full text-slate/40 hover:bg-slate/10 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </header>

          <div className="p-6 bg-white rounded-3xl border-l-8 border-terracotta shadow-sm italic text-xl font-serif text-charcoal">
             "{selectedSnippet}"
          </div>

          <section className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-[10px] font-bold text-slate/30 uppercase tracking-[0.2em]">Research Taxonomy</h3>
              <input 
                type="text" 
                placeholder="Search codes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 max-w-[200px] h-10 px-4 bg-white/50 border border-slate/10 rounded-xl text-sm focus:bg-white transition-all outline-none"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {filtered.length === 0 ? (
                <div className="py-4 text-center text-slate/20 italic text-sm">No matches found.</div>
              ) : (
                filtered.map(c => (
                  <div key={c.id} className="group relative flex items-center gap-2">
                    <button onClick={() => onApply(c)} className="flex-1 flex items-center gap-5 p-5 bg-white rounded-2xl border border-slate/5 hover:border-terracotta/30 hover:shadow-lg active:scale-[0.98] transition-all text-left group">
                      <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: c.color }} />
                      <span className="font-bold text-slate flex-1 truncate text-lg">{c.label}</span>
                      <span className="px-3 py-1 bg-slate/5 rounded-full text-[10px] font-bold text-slate/30">{codeUsageCounts[c.id] || 0} usage</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCodeToDelete(c); }}
                      className="p-3 opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate/20 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={`space-y-6 pb-20 p-6 rounded-3xl transition-all ${initialParentId || newLabel ? 'bg-terracotta/5 border-2 border-terracotta/10' : ''}`}>
            <h3 className="text-[10px] font-bold text-slate/30 uppercase tracking-[0.2em]">{initialParentId ? 'Create New Sub-Concept' : 'Add New Concept'}</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Category label..." className="flex-1 h-16 px-6 rounded-2xl border-2 border-slate/5 bg-white font-bold text-slate outline-none focus:border-terracotta" autoFocus={!!initialParentId} />
                <button onClick={handleCreateNew} disabled={newLabel.length < 2} className="px-8 bg-slate text-white rounded-2xl font-bold shadow-lg disabled:opacity-20 hover:bg-terracotta transition-all">Create</button>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate/40 uppercase tracking-widest">Parent Concept (Hierarchy)</label>
                <select 
                  value={selectedParentId} 
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className={`w-full h-14 px-4 rounded-xl border-2 bg-white text-slate font-medium outline-none transition-colors ${selectedParentId ? 'border-terracotta/40' : 'border-slate/5'}`}
                >
                  <option value="">No Parent (Root Category)</option>
                  {rootCodesForParentSelection.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-4">
                {CODE_COLORS.map(c => <button key={c} onClick={() => setColor(c)} className={`w-10 h-10 rounded-full transition-all border-4 ${color === c ? 'border-white ring-2 ring-terracotta scale-110' : 'border-transparent opacity-60'}`} style={{ backgroundColor: c }} />)}
              </div>
            </div>
            {!selectedSnippet.includes('Multiple') && (
              <button onClick={() => onCreateAndApply(selectedSnippet, color, true)} className="w-full p-6 bg-sage/5 border-2 border-dashed border-sage/20 rounded-2xl hover:bg-sage/10 text-sage font-bold flex justify-between items-center transition-all">
                <span>⚡ Use verbatim as In Vivo code</span>
                <svg className="w-6 h-6 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>
            )}
          </section>
        </div>

        {codeToDelete && (
          <div className="absolute inset-0 z-[110] bg-cream/95 backdrop-blur-sm rounded-t-[40px] flex items-center justify-center p-12 text-center animate-in zoom-in-95 duration-200">
             <div className="space-y-6 max-w-sm">
                <h3 className="text-2xl font-bold text-slate">Delete "{codeToDelete.label}"?</h3>
                <p className="text-slate/60">This will remove this code from all interviews in your project. This action is irreversible.</p>
                <div className="flex gap-3">
                   <button onClick={(e) => { e.stopPropagation(); setCodeToDelete(null); }} className="flex-1 h-14 bg-slate/5 text-slate rounded-2xl font-bold">Cancel</button>
                   <button onClick={finalizeDelete} className="flex-1 h-14 bg-red-600 text-white rounded-2xl font-bold shadow-lg">Delete</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeSelectionModal;