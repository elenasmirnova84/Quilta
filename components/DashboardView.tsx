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
  
  const totalCodes = projects.reduce((acc, p) => acc + dbService.getCodes(p.id).length, 0);
  const totalTime = "24.5h"; // Placeholder for actual calculation
  
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

      {/* Recent Projects */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate">Recent Projects</h2>
        <button className="text-sm font-bold text-slate/60 hover:text-slate">View all</button>
      </div>

      <div className="space-y-4 mb-8">
        {projects.slice(0, 3).map(p => (
          <div key={p.id} onClick={() => onOpenProject(p)} className="bg-white p-6 rounded-2xl border border-slate/5 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-slate">{p.title}</h3>
              <span className="text-xs font-bold text-slate/40">Last edited: 2 hours ago</span>
            </div>
            <p className="text-slate/60 text-sm mb-4">Progress: 15/20 documents coded</p>
            <div className="w-full bg-slate/10 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-charcoal/80" style={{ width: '75%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate/5 shadow-sm">
          <p className="text-slate/60 font-bold mb-1">Total Codes</p>
          <h3 className="text-3xl font-bold text-slate">{totalCodes}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate/5 shadow-sm">
          <p className="text-slate/60 font-bold mb-1">Coding Time</p>
          <h3 className="text-3xl font-bold text-slate">{totalTime}</h3>
        </div>
      </div>
    </div>
  );
};
