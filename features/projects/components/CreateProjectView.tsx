import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import { useProjects } from '../hooks/useProjects';

const CreateProjectView: React.FC = () => {
  const navigate = useNavigate();
  const { createProject } = useProjects();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p = createProject(fd.get('title') as string, fd.get('desc') as string);
    navigate(`/projects/${p.id}`);
  };

  return (
    <Layout title="New Project" onBack={() => navigate('/projects')}>
      <div className="max-w-2xl bg-white p-10 rounded-3xl shadow-lg mx-auto animate-fade-in">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div>
            <label className="block text-slate font-bold mb-2 uppercase tracking-widest text-xs">Project Title</label>
            <input name="title" required placeholder="e.g., Urban Sustainability" className="w-full h-14 px-6 rounded-2xl border-2 border-slate/10 outline-none text-xl focus:border-terracotta transition-colors" />
          </div>
          <div>
            <label className="block text-slate font-bold mb-2 uppercase tracking-widest text-xs">Description</label>
            <textarea name="desc" rows={4} placeholder="Describe the research goals..." className="w-full p-6 rounded-2xl border-2 border-slate/10 outline-none text-lg resize-none focus:border-terracotta transition-colors" />
          </div>
          <button type="submit" className="w-full h-16 bg-terracotta text-white rounded-2xl font-bold text-xl btn-bounce shadow-lg">Create Project</button>
        </form>
      </div>
    </Layout>
  );
};

export default CreateProjectView;