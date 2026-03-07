
import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCoding } from '../hooks/useCoding';
import { dbService } from '../../../services/dbService';
import { GranularHighlighter } from './GranularHighlighter';
import CodeSelectionModal from './CodeSelectionModal';
import { Code } from '../../../types';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import { showToast } from '../../../lib/toast';
import { CODE_COLORS } from '../../../constants';

// Added default export to fix "no default export" error in routes.tsx
const CodingView: React.FC = () => {
  const { projectId, interviewId } = useParams();
  const navigate = useNavigate();
  const { codes, segments, addCode, deleteCode, applyCode, removeSegment, refreshCodes, refreshSegments } = useCoding(projectId, interviewId);
  
  const interview = useMemo(() => interviewId ? dbService.getInterviewById(interviewId) : null, [interviewId, segments]);
  
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [offsets, setOffsets] = useState<{start: number, end: number} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [floatingMenuPos, setFloatingMenuPos] = useState<{ x: number, y: number } | null>(null);
  const [multiSelect, setMultiSelect] = useState<number[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  
  // Drag-and-Drop State
  const [dragType, setDragType] = useState<'segment' | 'code' | null>(null);
  const [draggedCodeId, setDraggedCodeId] = useState<string | null>(null);
  const [isDraggingOverCode, setIsDraggingOverCode] = useState<string | null>(null);
  const [isDraggingOverPlus, setIsDraggingOverPlus] = useState<string | null>(null);
  const [isDraggingOverNew, setIsDraggingOverNew] = useState(false);
  
  // Organization Action state
  const [pendingAction, setPendingAction] = useState<{ source: Code, target: Code } | null>(null);
  const [preSelectedParentId, setPreSelectedParentId] = useState<string | undefined>(undefined);
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());

  // Transcript Correction State
  const [editingSentenceIdx, setEditingSentenceIdx] = useState<number | null>(null);
  const [sentenceBuffer, setSentenceBuffer] = useState<string>("");

  useKeyboardShortcuts({
    openCodeModal: () => {
      if (selectedText || multiSelect.length > 0) setIsModalOpen(true);
    },
    closeModal: () => setIsModalOpen(false),
    undo: () => {
      if (segments.length > 0) {
        removeSegment(segments[segments.length - 1].id);
      }
    },
    showHelp: () => setShowHelp(true),
  });

  const codeUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    dbService.getInterviews(projectId || '').forEach(i => {
      dbService.getCodedSegments(i.id).forEach(s => {
        counts[s.code_id] = (counts[s.code_id] || 0) + 1;
      });
    });
    return counts;
  }, [segments, projectId, codes]);

  const rootCodes = useMemo(() => codes.filter(c => !c.parent_id), [codes]);
  const subCodesMap = useMemo(() => {
    const map: Record<string, Code[]> = {};
    codes.filter(c => c.parent_id).forEach(c => {
      if (!map[c.parent_id!]) map[c.parent_id!] = [];
      map[c.parent_id!] = [...(map[c.parent_id!] || []), c];
    });
    return map;
  }, [codes]);

  const onApply = (code: Code) => {
    if (multiSelect.length > 1) {
      multiSelect.forEach(idx => {
        if (interview) {
          applyCode(
            code.id,
            interview.sentences[idx].text,
            idx,
            0,
            interview.sentences[idx].text.length
          );
        }
      });
      showToast.success(`Batch coded ${multiSelect.length} segments`);
    } else if (selectedIdx !== null && offsets) {
      applyCode(code.id, selectedText, selectedIdx, offsets.start, offsets.end);
    }
    setIsModalOpen(false);
    setFloatingMenuPos(null);
    setMultiSelect([]);
    window.getSelection()?.removeAllRanges();
    setSelectedText("");
    setSelectedIdx(null);
    setPreSelectedParentId(undefined);
  };

  const handleSelection = (idx: number) => {
    if (editingSentenceIdx !== null) return;
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (selection && text && text.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedIdx(idx);
      setSelectedText(text);
      setOffsets({ start: range.startOffset, end: range.endOffset });
      setFloatingMenuPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    }
  };

  const handleSegmentDragStart = (e: React.DragEvent, idx: number) => {
    if (!selectedText) return;
    setDragType('segment');
    const data = {
      type: 'segment',
      text: selectedText,
      sentenceIndex: idx,
      start: offsets?.start || 0,
      end: offsets?.end || selectedText.length
    };
    e.dataTransfer.setData('application/quilta-selection', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
    
    const dragGhost = document.createElement('div');
    dragGhost.className = "px-4 py-2 bg-terracotta text-white rounded-xl font-bold text-sm shadow-2xl z-[1000]";
    dragGhost.innerText = selectedText.length > 20 ? selectedText.substring(0, 20) + '...' : selectedText;
    document.body.appendChild(dragGhost);
    e.dataTransfer.setDragImage(dragGhost, 0, 0);
    setTimeout(() => document.body.removeChild(dragGhost), 0);
  };

  const handleCodeDragStart = (e: React.DragEvent, code: Code) => {
    setDragType('code');
    setDraggedCodeId(code.id);
    const data = {
      type: 'code',
      codeId: code.id
    };
    e.dataTransfer.setData('application/quilta-code', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';

    const ghost = document.createElement('div');
    ghost.className = "px-5 py-3 bg-slate text-white rounded-xl font-bold text-sm shadow-2xl flex items-center gap-2";
    ghost.innerHTML = `<span style="width:12px; height:12px; background:${code.color}; border-radius:100%"></span> Organize: ${code.label}`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragEnd = () => {
    setDragType(null);
    setDraggedCodeId(null);
    setIsDraggingOverCode(null);
    setIsDraggingOverPlus(null);
    setIsDraggingOverNew(false);
  };

  const isChildOf = (parentId: string, childId: string): boolean => {
    let current = codes.find(c => c.id === childId);
    while (current && current.parent_id) {
      if (current.parent_id === parentId) return true;
      current = codes.find(c => c.id === current.parent_id);
    }
    return false;
  };

  const handleDropOnCode = (e: React.DragEvent, targetCode: Code) => {
    e.preventDefault();
    handleDragEnd();

    // 1. Text segment dropped on code (Assign)
    const segmentDataStr = e.dataTransfer.getData('application/quilta-selection');
    if (segmentDataStr) {
      try {
        const data = JSON.parse(segmentDataStr);
        applyCode(targetCode.id, data.text, data.sentenceIndex, data.start, data.end);
        showToast.success(`Coded: ${targetCode.label}`);
        window.getSelection()?.removeAllRanges();
        setSelectedText("");
        setSelectedIdx(null);
        return;
      } catch (err) { /* ignore */ }
    }

    // 2. Code dropped on code (Organize)
    const codeDataStr = e.dataTransfer.getData('application/quilta-code');
    if (codeDataStr) {
      try {
        const data = JSON.parse(codeDataStr);
        if (data.codeId === targetCode.id) return;
        
        // Loop protection
        if (isChildOf(data.codeId, targetCode.id)) {
            showToast.error("Cannot nest a category inside its own sub-concept.");
            return;
        }

        const sourceCode = codes.find(c => c.id === data.codeId);
        if (sourceCode) {
            setPendingAction({ source: sourceCode, target: targetCode });
        }
      } catch (err) { /* ignore */ }
    }
  };

  const executeMerge = () => {
    if (!pendingAction) return;
    const { source, target } = pendingAction;
    dbService.mergeCodes(source.id, target.id);
    refreshCodes();
    refreshSegments();
    setPendingAction(null);
    showToast.success(`Merged "${source.label}" into "${target.label}"`);
  };

  const executeNest = () => {
    if (!pendingAction) return;
    const { source, target } = pendingAction;
    
    // Check hierarchy depth (limit to 2 levels)
    if (target.parent_id) {
        showToast.error(`"${target.label}" is already a sub-category. Nesting is limited to 2 levels.`);
        return;
    }
    dbService.updateCode(source.id, { parent_id: target.id });
    refreshCodes();
    setPendingAction(null);
    showToast.success(`Nested "${source.label}" under "${target.label}"`);
  };

  // Fixed truncation by adding basic return and closing the component
  return null;
};

export default CodingView;
