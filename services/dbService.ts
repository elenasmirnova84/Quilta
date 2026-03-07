import { Project, Interview, Code, CodedSegment, Profile, TranscriptSentence } from '../types';

const STORAGE_KEYS = {
  USER: 'quilta_user',
  PROJECTS: 'quilta_projects',
  INTERVIEWS: 'quilta_interviews',
  CODES: 'quilta_codes',
  CODED_SEGMENTS: 'quilta_coded_segments'
};

const get = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const set = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const dbService = {
  // Auth
  getCurrentUser: (): Profile | null => get(STORAGE_KEYS.USER, null),
  login: (email: string): Profile => {
    const user = { id: 'u1', email, full_name: 'Research Student' };
    set(STORAGE_KEYS.USER, user);
    return user;
  },
  logout: () => localStorage.removeItem(STORAGE_KEYS.USER),

  // Projects
  getProjects: (): Project[] => get(STORAGE_KEYS.PROJECTS, []),
  createProject: (title: string, description: string): Project => {
    const user = dbService.getCurrentUser();
    const projects = dbService.getProjects();
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      owner_id: user?.id || 'anon',
      created_at: new Date().toISOString()
    };
    set(STORAGE_KEYS.PROJECTS, [...projects, newProject]);
    return newProject;
  },
  updateProject: (id: string, title: string, description: string): Project => {
    const projects = dbService.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Project not found");
    const updatedProject = { ...projects[index], title, description };
    projects[index] = updatedProject;
    set(STORAGE_KEYS.PROJECTS, projects);
    return updatedProject;
  },

  // Interviews
  getInterviews: (projectId: string): Interview[] => 
    get(STORAGE_KEYS.INTERVIEWS, []).filter((i: Interview) => i.project_id === projectId),
  createInterview: (projectId: string, title: string, sentences: TranscriptSentence[]): Interview => {
    const interviews = get(STORAGE_KEYS.INTERVIEWS, []);
    const newInterview: Interview = {
      id: Math.random().toString(36).substr(2, 9),
      project_id: projectId,
      title,
      transcript: sentences.map(s => `[${s.speaker}] ${s.text}`).join('\n'),
      sentences,
      created_at: new Date().toISOString()
    };
    set(STORAGE_KEYS.INTERVIEWS, [...interviews, newInterview]);
    return newInterview;
  },
  getInterviewById: (id: string): Interview | undefined => 
    get(STORAGE_KEYS.INTERVIEWS, []).find((i: Interview) => i.id === id),
  
  updateSpeakerLabel: (interviewId: string, oldLabel: string, newLabel: string): void => {
    const interviews = get(STORAGE_KEYS.INTERVIEWS, []);
    const interview = interviews.find((i: Interview) => i.id === interviewId);
    if (interview) {
      interview.sentences = interview.sentences.map(s => 
        s.speaker === oldLabel ? { ...s, speaker: newLabel } : s
      );
      interview.transcript = interview.sentences.map(s => `[${s.speaker}] ${s.text}`).join('\n');
      set(STORAGE_KEYS.INTERVIEWS, interviews);
    }
  },

  updateSentence: (interviewId: string, index: number, updates: Partial<TranscriptSentence>): void => {
    const interviews = get(STORAGE_KEYS.INTERVIEWS, []);
    const interview = interviews.find((i: Interview) => i.id === interviewId);
    if (interview && interview.sentences[index]) {
      interview.sentences[index] = { ...interview.sentences[index], ...updates };
      interview.transcript = interview.sentences.map(s => `[${s.speaker}] ${s.text}`).join('\n');
      set(STORAGE_KEYS.INTERVIEWS, interviews);
    }
  },

  deleteSentence: (interviewId: string, index: number): void => {
    const interviews = get(STORAGE_KEYS.INTERVIEWS, []);
    const interviewIndex = interviews.findIndex((i: Interview) => i.id === interviewId);
    if (interviewIndex !== -1) {
      const interview = interviews[interviewIndex];
      interview.sentences.splice(index, 1);
      interview.transcript = interview.sentences.map(s => `[${s.speaker}] ${s.text}`).join('\n');
      set(STORAGE_KEYS.INTERVIEWS, interviews);

      // Cascading shifts for coded segments
      const segments = get(STORAGE_KEYS.CODED_SEGMENTS, []);
      const filteredSegments = segments.filter(s => !(s.interview_id === interviewId && s.sentence_index === index));
      const shiftedSegments = filteredSegments.map(s => {
        if (s.interview_id === interviewId && s.sentence_index > index) {
          return { ...s, sentence_index: s.sentence_index - 1 };
        }
        return s;
      });
      set(STORAGE_KEYS.CODED_SEGMENTS, shiftedSegments);
    }
  },

  deleteInterview: (id: string): void => {
    const interviews = get(STORAGE_KEYS.INTERVIEWS, []);
    set(STORAGE_KEYS.INTERVIEWS, interviews.filter((i: Interview) => i.id !== id));
    // Also delete associated coded segments
    const segments = get(STORAGE_KEYS.CODED_SEGMENTS, []);
    set(STORAGE_KEYS.CODED_SEGMENTS, segments.filter((s: CodedSegment) => s.interview_id !== id));
  },

  // Codes
  getCodes: (projectId: string): Code[] => 
    get(STORAGE_KEYS.CODES, []).filter((c: Code) => c.project_id === projectId),
  createCode: (projectId: string, label: string, color: string, description?: string, isInVivo?: boolean, parentId?: string): Code => {
    const codes = get(STORAGE_KEYS.CODES, []);
    const newCode: Code = {
      id: Math.random().toString(36).substr(2, 9),
      project_id: projectId,
      label,
      color,
      description,
      is_invivo: isInVivo,
      parent_id: parentId,
      created_by: dbService.getCurrentUser()?.id || 'anon'
    };
    set(STORAGE_KEYS.CODES, [...codes, newCode]);
    return newCode;
  },
  updateCode: (id: string, updates: Partial<Code>): void => {
    const codes = get(STORAGE_KEYS.CODES, []);
    const index = codes.findIndex(c => c.id === id);
    if (index !== -1) {
      codes[index] = { ...codes[index], ...updates };
      set(STORAGE_KEYS.CODES, codes);
    }
  },
  deleteCode: (codeId: string): void => {
    const codes = get(STORAGE_KEYS.CODES, []);
    // Cascade delete sub-codes
    const codesWithSubDeleted = codes.filter(c => c.id !== codeId && c.parent_id !== codeId);
    set(STORAGE_KEYS.CODES, codesWithSubDeleted);
    // Cascade delete segments
    const segments = get(STORAGE_KEYS.CODED_SEGMENTS, []);
    set(STORAGE_KEYS.CODED_SEGMENTS, segments.filter((s: CodedSegment) => s.code_id !== codeId));
  },

  mergeCodes: (sourceId: string, targetId: string): void => {
    if (sourceId === targetId) return;
    
    const codes = get(STORAGE_KEYS.CODES, []);
    const segments = get(STORAGE_KEYS.CODED_SEGMENTS, []);
    const sourceCode = codes.find(c => c.id === sourceId);
    const targetCode = codes.find(c => c.id === targetId);
    if (!sourceCode || !targetCode) return;

    // 1. Reassign all segments from source to target
    const updatedSegments = segments.map(s => 
      s.code_id === sourceId ? { ...s, code_id: targetId } : s
    );
    set(STORAGE_KEYS.CODED_SEGMENTS, updatedSegments);

    // 2. Reparent any sub-codes of the source to the target
    const updatedCodes = codes.map(c => {
      if (c.parent_id === sourceId) {
        // Prevent loop if target was a child of source
        if (c.id === targetId) return { ...c, parent_id: sourceCode.parent_id };
        return { ...c, parent_id: targetId };
      }
      return c;
    });
    
    // 3. Delete the source code
    const finalCodes = updatedCodes.filter(c => c.id !== sourceId);
    set(STORAGE_KEYS.CODES, finalCodes);
  },

  // Coded Segments
  getCodedSegments: (interviewId: string): CodedSegment[] => 
    get(STORAGE_KEYS.CODED_SEGMENTS, []).filter((s: CodedSegment) => s.interview_id === interviewId),
  saveCodedSegment: (segment: Omit<CodedSegment, 'id'>): CodedSegment => {
    const segments = get(STORAGE_KEYS.CODED_SEGMENTS, []);
    const newSegment: CodedSegment = {
      ...segment,
      id: Math.random().toString(36).substr(2, 9),
    };
    set(STORAGE_KEYS.CODED_SEGMENTS, [...segments, newSegment]);
    return newSegment;
  },
  deleteCodedSegment: (id: string): void => {
    const segments = get(STORAGE_KEYS.CODED_SEGMENTS, []);
    set(STORAGE_KEYS.CODED_SEGMENTS, segments.filter((s: CodedSegment) => s.id !== id));
  }
};