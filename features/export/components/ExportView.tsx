
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import { dbService } from '../../../services/dbService';
import { generateReport } from '../../../services/geminiService';
import { showToast } from '../../../lib/toast';

const ExportView: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const project = projectId ? dbService.getProjects().find(p => p.id === projectId) : null;
  const codes = projectId ? dbService.getCodes(projectId) : [];
  const interviews = projectId ? dbService.getInterviews(projectId) : [];

  if (!project) return null;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    const codeSummaries = codes.map(c => {
      const segments = interviews.flatMap(i => 
        dbService.getCodedSegments(i.id).filter(s => s.code_id === c.id).map(s => {
          const sent = i.sentences[s.sentence_index];
          return { text: s.segment_text, ref: s.sentence_index, speaker: sent?.speaker || "Unknown" };
        })
      );
      return { label: c.label, segments };
    }).filter(c => c.segments.length > 0);
    
    const promise = generateReport(project.title, codeSummaries);
    showToast.promise(promise, {
      loading: 'Generating thematic analysis...',
      success: 'Analysis complete!',
      error: 'Analysis generation failed.'
    });
    
    setReport(await promise);
    setIsGenerating(false);
  };

  const downloadAsWord = () => {
    const codebookHtml = codes.map(c => {
      const segments = interviews.flatMap(i => 
        dbService.getCodedSegments(i.id).filter(s => s.code_id === c.id).map(s => {
          const sent = i.sentences[s.sentence_index];
          return { ...s, speaker: sent?.speaker || "Unknown" };
        })
      );
      if (segments.length === 0) return '';
      return `<h2>Code: ${c.label} ${c.is_invivo ? '(In Vivo)' : ''}</h2><ul>${segments.map(s => `<li><b>[${s.speaker}]</b> [#${s.sentence_index + 1}] "${s.segment_text}"</li>`).join('')}</ul>`;
    }).join('');

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${project.title} Report</title></head>
      <body style="font-family: Arial, sans-serif; padding: 40px;">
        <h1 style="color: #3D405B;">${project.title} Academic Report</h1>
        <hr/>
        <h3 style="color: #E07A5F;">Thematic Synthesis (AI-Generated)</h3>
        <p style="white-space: pre-line; line-height: 1.6;">${report}</p>
        <hr/>
        <h3 style="color: #3D405B;">Verbatim Codebook</h3>
        ${codebookHtml}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/\s+/g, '_')}_Report.doc`;
    link.click();
    URL.revokeObjectURL(url);
    showToast.success('Word report downloaded');
  };

  const downloadAsCSV = () => {
    let csvContent = "Source,Speaker,Code,Verbatim Segment,Reference Index\n";
    interviews.forEach(i => {
      dbService.getCodedSegments(i.id).forEach(s => {
        const code = codes.find(c => c.id === s.code_id);
        const sentence = i.sentences[s.sentence_index];
        const speaker = (sentence?.speaker || "Unknown").replace(/"/g, '""');
        const segment = s.segment_text.replace(/"/g, '""');
        const source = i.title.replace(/"/g, '""');
        csvContent += `"${source}","${speaker}","${code?.label || 'Unlabeled'}","${segment}","#${s.sentence_index + 1}"\n`;
      });
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/\s+/g, '_')}_Verbatim_Data.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast.success('CSV data downloaded');
  };

  return (
    <Layout title="Export Center" onBack={() => navigate(`/projects/${projectId}`)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32 animate-fade-in">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate/5 sticky top-24">
            <h2 className="text-2xl font-bold text-slate mb-6">Research Summary</h2>
            <div className="pt-6 border-t border-slate/5 grid grid-cols-1 gap-3">
               <button onClick={downloadAsWord} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md">Download .DOC</button>
               <button onClick={downloadAsCSV} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-sm shadow-md">Download .CSV</button>
               <button onClick={() => window.print()} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md">Export PDF / Print</button>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-3xl shadow-lg min-h-[600px] flex flex-col border border-slate/5">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-bold text-slate">Academic Synthesis</h2>
               <button onClick={handleGenerateReport} disabled={isGenerating} className="px-6 py-3 bg-terracotta text-white rounded-xl font-bold shadow-md hover:scale-105 transition-all">
                {isGenerating ? 'Synthesizing...' : 'Generate Analysis'}
               </button>
            </div>
            <div id="printable-report" className="flex-1 prose prose-slate max-w-none text-lg p-10 bg-slate/5 rounded-2xl border border-slate/5 italic whitespace-pre-line overflow-y-auto max-h-[700px] font-serif leading-relaxed text-charcoal">
              {report || "Generate your thematic synthesis based on the verbatim coding data collected across your project sources."}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExportView;
