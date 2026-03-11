import { Project, Interview, Code, CodedSegment, TranscriptSentence, LocalProfile } from '../types';

const STORAGE_KEYS = {
  USER: 'quilta_user',
  PROJECTS: 'quilta_projects',
  INTERVIEWS: 'quilta_interviews',
  CODES: 'quilta_codes',
  CODED_SEGMENTS: 'quilta_coded_segments',
  PROFILES: 'quilta_profiles',
  ACTIVE_PROFILE_ID: 'quilta_active_profile_id'
};

const get = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const set = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const dbService = {
  // Profiles
  getProfiles: (): LocalProfile[] => get(STORAGE_KEYS.PROFILES, []),
  getActiveProfile: (): LocalProfile | null => {
    const profiles = dbService.getProfiles();
    const activeId = get(STORAGE_KEYS.ACTIVE_PROFILE_ID, null);
    return profiles.find(p => p.id === activeId) || profiles[0] || null;
  },
  setActiveProfile: (id: string): void => set(STORAGE_KEYS.ACTIVE_PROFILE_ID, id),
  createProfile: (data: Omit<LocalProfile, 'id'>): LocalProfile => {
    const profiles = dbService.getProfiles();
    const newProfile: LocalProfile = {
      id: Math.random().toString(36).substr(2, 9),
      ...data
    };
    set(STORAGE_KEYS.PROFILES, [...profiles, newProfile]);
    dbService.setActiveProfile(newProfile.id);
    return newProfile;
  },
  updateProfile: (profile: LocalProfile): void => {
    const profiles = dbService.getProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index !== -1) {
      profiles[index] = profile;
      set(STORAGE_KEYS.PROFILES, profiles);
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
  },

  // Projects
  getProjects: (): Project[] => get(STORAGE_KEYS.PROJECTS, []),
  createProject: (title: string, description: string, tags: string[] = []): Project => {
    const profile = dbService.getActiveProfile();
    const projects = dbService.getProjects();
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      owner_id: profile?.id || 'anon',
      created_at: new Date().toISOString(),
      tags,
      is_archived: false
    };
    set(STORAGE_KEYS.PROJECTS, [...projects, newProject]);
    return newProject;
  },
  updateProject: (id: string, title: string, description: string, tags: string[]): Project => {
    const projects = dbService.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Project not found");
    const updatedProject = { ...projects[index], title, description, tags };
    projects[index] = updatedProject;
    set(STORAGE_KEYS.PROJECTS, projects);
    return updatedProject;
  },
  archiveProject: (id: string, is_archived: boolean): void => {
    const projects = dbService.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], is_archived };
      set(STORAGE_KEYS.PROJECTS, projects);
    }
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

  // Helper: Get root code for any given code ID
  getRootCode: (codeId: string, codes: Code[]): Code | undefined => {
    const code = codes.find(c => c.id === codeId);
    if (!code) return undefined;
    if (!code.parent_id) return code;
    return codes.find(c => c.id === code.parent_id);
  },

  // Helper: Apply inherited colors to a list of codes
  applyInheritedColors: (codes: Code[]): Code[] => {
    const rootCodes = codes.filter(c => !c.parent_id);
    const rootColorMap = new Map(rootCodes.map(c => [c.id, c.color]));
    
    return codes.map(c => {
      if (c.parent_id) {
        const parentColor = rootColorMap.get(c.parent_id);
        if (parentColor && c.color !== parentColor) {
          return { ...c, color: parentColor };
        }
      }
      return c;
    });
  },

  // Codes
  getCodes: (projectId: string): Code[] => 
    get(STORAGE_KEYS.CODES, []).filter((c: Code) => c.project_id === projectId),
  createCode: (projectId: string, label: string, color: string, description?: string, isInVivo?: boolean, parentId?: string): Code => {
    const codes = get(STORAGE_KEYS.CODES, []);
    
    // COLOR INHERITANCE RULE 1: Automatic Inheritance on Creation
    let finalColor = color;
    if (parentId) {
      const parent = codes.find(c => c.id === parentId);
      if (parent) finalColor = parent.color;
    }

    const newCode: Code = {
      id: Math.random().toString(36).substr(2, 9),
      project_id: projectId,
      label,
      color: finalColor,
      description,
      is_invivo: isInVivo,
      parent_id: parentId,
      created_by: dbService.getActiveProfile()?.id || 'anon'
    };
    set(STORAGE_KEYS.CODES, [...codes, newCode]);
    return newCode;
  },
  updateCode: (id: string, updates: Partial<Code>): void => {
    const codes = get(STORAGE_KEYS.CODES, []);
    const index = codes.findIndex(c => c.id === id);
    if (index !== -1) {
      const currentCode = codes[index];
      let finalUpdates = { ...updates };
      
      // COLOR INHERITANCE RULE 5: Manual Color Editing Restrictions
      // Determine if the code is/will be a sub-code
      const nextParentId = updates.hasOwnProperty('parent_id') ? updates.parent_id : currentCode.parent_id;
      
      if (nextParentId && updates.color !== undefined) {
        // Block manual color changes for sub-codes
        delete finalUpdates.color;
      }

      // COLOR INHERITANCE RULE 2: Dynamic Color Updates on Reparenting
      if (updates.hasOwnProperty('parent_id')) {
        if (updates.parent_id) {
          // Becoming a sub-code or moving to a different root
          const newParent = codes.find(c => c.id === updates.parent_id);
          if (newParent) finalUpdates.color = newParent.color;
        }
        // If becoming root (updates.parent_id === undefined), it retains its current 
        // inherited color as its initial root color (default behavior).
      }

      codes[index] = { ...codes[index], ...finalUpdates };

      // COLOR INHERITANCE RULE 3: Cascading Root Color Updates
      // If this is a root code and its color changed, update all children
      if (!codes[index].parent_id && finalUpdates.color) {
        for (let i = 0; i < codes.length; i++) {
          if (codes[i].parent_id === id) {
            codes[i].color = finalUpdates.color;
          }
        }
      }

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

    // 2. Handle Target as descendant of Source
    // If target is a child of source, reattach it to source's parent first
    let effectiveTargetParentId = targetCode.parent_id;
    if (effectiveTargetParentId === sourceId) {
      effectiveTargetParentId = sourceCode.parent_id;
    }

    // 3. Determine new parent and color for source's children
    const newParentForChildren = effectiveTargetParentId || targetId;
    const parentForColor = codes.find(c => c.id === newParentForChildren);
    const inheritedColor = parentForColor?.color || targetCode.color;

    // 4. Update codes: reparent children and update target if it moved
    // COLOR INHERITANCE RULE 4: Color Synchronization After Merge or Reparenting
    const updatedCodes = codes.map(c => {
      // Update target if it was a child of source
      if (c.id === targetId && c.parent_id === sourceId) {
        return { ...c, parent_id: effectiveTargetParentId, color: inheritedColor };
      }
      
      // Reparent source's children (excluding the target itself if it was a child)
      if (c.parent_id === sourceId && c.id !== targetId) {
        return { ...c, parent_id: newParentForChildren, color: inheritedColor };
      }
      
      return c;
    });
    
    // 5. Delete the source code
    const finalCodes = updatedCodes.filter(c => c.id !== sourceId);
    
    // Final sync to ensure all colors are correct across the project
    const syncedCodes = dbService.applyInheritedColors(finalCodes);
    set(STORAGE_KEYS.CODES, syncedCodes);
  },

  // Coded Segments
  getCodedSegments: (interviewId: string): CodedSegment[] => 
    get(STORAGE_KEYS.CODED_SEGMENTS, []).filter((s: CodedSegment) => s.interview_id === interviewId),
  getAllCodedSegments: (): CodedSegment[] => get(STORAGE_KEYS.CODED_SEGMENTS, []),
  saveCodedSegment: (segment: Omit<CodedSegment, 'id'>): CodedSegment => {
    const segments = get(STORAGE_KEYS.CODED_SEGMENTS, []);
    const profile = dbService.getActiveProfile();
    const newSegment: CodedSegment = {
      ...segment,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdBy: profile?.name || 'Unknown', // Legacy
      createdByName: profile?.name || 'Unknown',
      createdByEmail: profile?.email || ''
    };
    set(STORAGE_KEYS.CODED_SEGMENTS, [...segments, newSegment]);
    return newSegment;
  },
  updateCodedSegment: (id: string, updates: Partial<CodedSegment>): void => {
    const segments = get(STORAGE_KEYS.CODED_SEGMENTS, []);
    const index = segments.findIndex(s => s.id === id);
    if (index !== -1) {
      segments[index] = { 
        ...segments[index], 
        ...updates,
        updated_at: new Date().toISOString()
      };
      set(STORAGE_KEYS.CODED_SEGMENTS, segments);
    }
  },
  deleteCodedSegment: (id: string): void => {
    const segments = get(STORAGE_KEYS.CODED_SEGMENTS, []);
    set(STORAGE_KEYS.CODED_SEGMENTS, segments.filter((s: CodedSegment) => s.id !== id));
  }
};