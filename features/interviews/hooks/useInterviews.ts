import { useState, useEffect } from 'react';
import { dbService } from '../../../services/dbService';
import { Interview, TranscriptSentence } from '../../../types';
import { showToast } from '../../../lib/toast';

export const useInterviews = (projectId?: string) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadInterviews();
    }
  }, [projectId]);

  const loadInterviews = () => {
    if (!projectId) return;
    setIsLoading(true);
    const data = dbService.getInterviews(projectId);
    setInterviews(data);
    setIsLoading(false);
  };

  // Fix: change sentences parameter from string[] to TranscriptSentence[]
  const createInterview = (title: string, sentences: TranscriptSentence[]) => {
    if (!projectId) return;
    const interview = dbService.createInterview(projectId, title, sentences);
    setInterviews(prev => [...prev, interview]);
    return interview;
  };

  const deleteInterview = (id: string) => {
    dbService.deleteInterview(id);
    setInterviews(prev => prev.filter(i => i.id !== id));
    showToast.success('Interview deleted');
  };

  const getInterview = (id: string) => {
    return interviews.find(i => i.id === id) || dbService.getInterviewById(id);
  };

  return {
    interviews,
    isLoading,
    createInterview,
    deleteInterview,
    getInterview,
    refresh: loadInterviews
  };
};