
import { useState, useEffect } from 'react';
import { dbService } from '../../../services/dbService';
import { Code, CodedSegment } from '../../../types';
import { showToast } from '../../../lib/toast';

export const useCoding = (projectId?: string, interviewId?: string) => {
  const [codes, setCodes] = useState<Code[]>([]);
  const [segments, setSegments] = useState<CodedSegment[]>([]);

  const refreshCodes = () => {
    if (projectId) setCodes(dbService.getCodes(projectId));
  };

  // Add refreshSegments to trigger re-renders of components dependent on the transcript data
  const refreshSegments = () => {
    if (interviewId) setSegments(dbService.getCodedSegments(interviewId));
  };

  useEffect(() => {
    if (projectId) setCodes(dbService.getCodes(projectId));
    if (interviewId) setSegments(dbService.getCodedSegments(interviewId));
  }, [projectId, interviewId]);

  const addCode = (label: string, color: string, isInVivo?: boolean, parentId?: string) => {
    if (!projectId) return;
    const newCode = dbService.createCode(projectId, label, color, undefined, isInVivo, parentId);
    refreshCodes();
    return newCode;
  };

  const deleteCode = (codeId: string) => {
    dbService.deleteCode(codeId);
    refreshCodes();
    if (interviewId) setSegments(dbService.getCodedSegments(interviewId));
    showToast.success('Code deleted and segments unlinked');
  };

  const applyCode = (codeId: string, segmentText: string, sentenceIndex: number, start: number, end: number) => {
    if (!interviewId) return;
    const segment = dbService.saveCodedSegment({
      interview_id: interviewId,
      code_id: codeId,
      segment_text: segmentText,
      sentence_index: sentenceIndex,
      start_char: start,
      end_char: end
    });
    setSegments(prev => [...prev, segment]);
    showToast.success('Code applied');
  };

  const removeSegment = (id: string) => {
    dbService.deleteCodedSegment(id);
    setSegments(prev => prev.filter(s => s.id !== id));
    showToast.success('Coding removed');
  };

  return {
    codes,
    segments,
    addCode,
    deleteCode,
    applyCode,
    removeSegment,
    refreshCodes,
    refreshSegments
  };
};
