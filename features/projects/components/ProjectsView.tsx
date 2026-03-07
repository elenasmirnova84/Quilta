import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import { SkeletonCard } from '../../../shared/components/LoadingStates';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../../auth/hooks/useAuth';
import { dbService } from '../../../services/dbService';

const ProjectsView: React.FC = () => {
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();
  const { logout } = useAuth();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Layout 
      title="My Projects" 
      actions={
        <button 
          onClick={() => { logout(); navigate('/'); }} 
          className="p-2 hover:bg-red-50 text-slate/60 hover:text-red-500 rounded-full transition-colors" 
          title="Logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      }
    >
      <div className="relative pb-24 animate-fade-in">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-3xl font-bold text-slate mb-2">No projects yet</h2>
            <p className="text-slate/40 text-lg mb-8">Create your first research project to begin.</p>
            <button onClick={() => navigate('/projects/new')} className="px-8 py-4 bg-terracotta text-white rounded-xl font-bold text-lg shadow-lg btn-bounce">Create Project</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => {
              const interviewCount = dbService.getInterviews(p.id).length;
              return (
                <div 
                  key={p.id} 
                  onClick={() => navigate(`/projects/${p.id}`)} 
                  className="bg-white p-6 rounded-xl border border-slate/5 hover:border-terracotta/30 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-xl font-bold text-charcoal leading-tight line-clamp-1">{p.title}</h3>
                      <span className="shrink-0 px-2 py-1 bg-sage/10 text-sage text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {interviewCount} {interviewCount === 1 ? 'source' : 'sources'}
                      </span>
                    </div>
                    <p className="text-charcoal/60 text-sm line-clamp-2">
                      {p.description || "No description provided."}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate/5">
                    <span className="text-slate/30 text-[10px] uppercase tracking-widest font-bold">
                      {formatDate(p.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button 
          onClick={() => navigate('/projects/new')}
          className="fixed bottom-8 right-8 w-16 h-16 bg-terracotta text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </Layout>
  );
};

export default ProjectsView;