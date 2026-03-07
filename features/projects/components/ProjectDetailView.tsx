import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import { useProjects } from '../hooks/useProjects';
import { useInterviews } from '../../interviews/hooks/useInterviews';
import { dbService } from '../../../services/dbService';

const ProjectDetailView: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getProject } = useProjects();
  const { interviews } = useInterviews(projectId);
  
  const project = projectId ? getProject(projectId) : null;

  if (!project) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Layout 
      title={project.title} 
      onBack={() => navigate('/projects')} 
      actions={
        <div className="flex gap-2">
          <button onClick={() => navigate(`/projects/${project.id}/edit`)} className="p-2 hover:bg-slate/5 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button onClick={() => navigate(`/projects/${project.id}/export`)} className="px-4 py-2 bg-sage text-white rounded-xl font-bold text-sm shadow-sm hover:bg-sage/90 transition-all">Analysis & Export</button>
        </div>
      }
    >
      <div className="relative pb-32 animate-fade-in">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-charcoal mb-2">{project.title}</h2>
          <p className="text-charcoal/60 mb-2">{project.description || "No description provided."}</p>
          <span className="text-[12px] text-slate/30 uppercase tracking-widest font-bold">
            Created: {formatDate(project.created_at)}
          </span>
          <div className="h-px bg-slate/5 w-full mt-6" />
        </div>

        <div className="space-y-3">
          {interviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <p className="text-charcoal text-lg">No data sources yet.</p>
            </div>
          ) : (
            interviews.map(i => (
              <div 
                key={i.id} 
                onClick={() => navigate(`/projects/${project.id}/interviews/${i.id}`)} 
                className="bg-white p-5 rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:shadow-md border border-slate/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate/5 flex items-center justify-center text-slate/40">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-charcoal leading-tight">{i.title}</h3>
                    <div className="flex items-center gap-2 text-charcoal/40 text-xs mt-1">
                      <span>{formatDate(i.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <span className="px-3 py-1 bg-slate/5 text-slate/40 text-[10px] font-bold uppercase rounded-full">
                     {dbService.getCodedSegments(i.id).length} Codes
                   </span>
                </div>
              </div>
            ))
          )}
        </div>

        <button 
          onClick={() => navigate(`/projects/${project.id}/interviews/new`)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-terracotta text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </Layout>
  );
};

export default ProjectDetailView;