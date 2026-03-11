import React from 'react';
import { Project, LocalProfile } from '../types';
import { dbService } from '../services/dbService';

export const DashboardView: React.FC<{
  projects: Project[],
  profile: LocalProfile | null,
  onOpenProject: (p: Project) => void,
  onCreateProject: () => void,
  onOpenProfile: () => void
}> = ({ projects, profile, onOpenProject, onCreateProject, onOpenProfile }) => {
  
  const activeProjects = projects.filter(p => !p.is_archived);
  const totalProjects = activeProjects.length;
  const totalSources = activeProjects.reduce((acc, p) => acc + dbService.getInterviews(p.id).length, 0);
  const totalCodes = activeProjects.reduce((acc, p) => acc + dbService.getCodes(p.id).length, 0);
  
  // Calculate total coded segments
  const totalSegments = activeProjects.reduce((acc, p) => {
    const interviews = dbService.getInterviews(p.id);
    return acc + interviews.reduce((iAcc, i) => iAcc + dbService.getCodedSegments(i.id).length, 0);
  }, 0);
  
  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-charcoal/80 text-white p-8 rounded-3xl mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.name?.split(' ')[0] || 'Researcher'}</h1>
          <p className="text-white/70">Ready to synthesize your data?</p>
        </div>
        <button onClick={onCreateProject} className="bg-terracotta hover:bg-terracotta/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Create New Project
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate/5 shadow-sm">
          <p className="text-slate/40 text-[10px] font-bold uppercase tracking-widest mb-1">Projects</p>
          <h3 className="text-2xl font-bold text-slate">{totalProjects}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate/5 shadow-sm">
          <p className="text-slate/40 text-[10px] font-bold uppercase tracking-widest mb-1">Sources</p>
          <h3 className="text-2xl font-bold text-slate">{totalSources}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate/5 shadow-sm">
          <p className="text-slate/40 text-[10px] font-bold uppercase tracking-widest mb-1">Codes</p>
          <h3 className="text-2xl font-bold text-slate">{totalCodes}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate/5 shadow-sm">
          <p className="text-slate/40 text-[10px] font-bold uppercase tracking-widest mb-1">Segments</p>
          <h3 className="text-2xl font-bold text-slate">{totalSegments}</h3>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate">Recent Projects</h2>
        <button className="text-sm font-bold text-slate/60 hover:text-slate">View all</button>
      </div>

      <div className="space-y-4 mb-8">
        {activeProjects.length === 0 ? (
          <div className="bg-slate/5 p-12 rounded-3xl text-center border-2 border-dashed border-slate/10">
            <p className="text-slate/40 font-bold">No projects yet. Create one to get started.</p>
          </div>
        ) : (
          activeProjects.slice(0, 3).map(p => {
            const pInterviews = dbService.getInterviews(p.id);
            const pCodes = dbService.getCodes(p.id);
            return (
              <div key={p.id} onClick={() => onOpenProject(p)} className="bg-white p-6 rounded-2xl border border-slate/5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-slate group-hover:text-terracotta transition-colors">{p.title}</h3>
                  <span className="text-xs font-bold text-slate/40">{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-4 mb-4">
                  <span className="text-[10px] font-bold text-slate/40 uppercase tracking-widest">{pInterviews.length} Sources</span>
                  <span className="text-[10px] font-bold text-slate/40 uppercase tracking-widest">{pCodes.length} Codes</span>
                </div>
                <div className="w-full bg-slate/10 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-terracotta/40" style={{ width: '100%' }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
