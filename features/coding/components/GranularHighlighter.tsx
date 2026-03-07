import React from 'react';
import { CodedSegment, Code } from '../../../types';

interface GranularHighlighterProps {
  text: string;
  segments: CodedSegment[];
  codes: Code[];
}

export const GranularHighlighter: React.FC<GranularHighlighterProps> = ({ text, segments, codes }) => {
  if (segments.length === 0) return <>{text}</>;

  const boundaries = new Set<number>([0, text.length]);
  segments.forEach(s => {
    if (s.start_char !== undefined) boundaries.add(s.start_char);
    if (s.end_char !== undefined) boundaries.add(s.end_char);
  });

  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
  const parts: React.ReactNode[] = [];

  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const start = sortedBoundaries[i];
    const end = sortedBoundaries[i + 1];
    const partText = text.substring(start, end);
    
    const matchingSegments = segments.filter(s => 
      s.start_char !== undefined && s.end_char !== undefined &&
      start >= s.start_char && end <= s.end_char
    );

    if (matchingSegments.length > 0) {
      const lastSegment = matchingSegments[matchingSegments.length - 1];
      const code = codes.find(c => c.id === lastSegment.code_id);
      
      parts.push(
        <mark 
          key={`${start}-${end}`} 
          style={{ 
            backgroundColor: (code?.color || '#eee') + '44',
            borderBottom: `2px solid ${code?.color || '#ccc'}`,
            color: 'inherit'
          }}
          className="transition-colors duration-200"
          title={code?.label}
        >
          {partText}
        </mark>
      );
    } else {
      parts.push(<span key={`${start}-${end}`}>{partText}</span>);
    }
  }

  return <>{parts}</>;
};