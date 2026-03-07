export interface Profile {
  id: string;
  email: string;
  full_name: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  created_at: string;
}

export interface TranscriptSentence {
  speaker: string;
  text: string;
}

export interface Interview {
  id: string;
  project_id: string;
  title: string;
  transcript: string; // Raw text or JSON segments
  audio_url?: string;
  duration?: string;
  created_at: string;
  sentences: TranscriptSentence[]; // Processed for coding with speaker labels
}

export interface Code {
  id: string;
  project_id: string;
  label: string;
  color: string;
  created_by: string;
  description?: string;
  is_invivo?: boolean;
  parent_id?: string; // For 2-level hierarchy
  comment?: string;    // Research memos/definitions
}

export interface CodedSegment {
  id: string;
  interview_id: string;
  code_id: string;
  segment_text: string;
  sentence_index: number;
  start_char?: number; // Offset within the sentence
  end_char?: number;   // Offset within the sentence
}

export type AppView = 
  | 'AUTH' 
  | 'PROJECTS' 
  | 'CREATE_PROJECT' 
  | 'EDIT_PROJECT'
  | 'PROJECT_DETAIL' 
  | 'RECORD_INTERVIEW' 
  | 'INTERVIEW_DETAIL' 
  | 'CODING' 
  | 'EXPORT';