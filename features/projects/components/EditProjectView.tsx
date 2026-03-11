import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import { useProjects } from '../hooks/useProjects';

const EditProjectView: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getProject, updateProject } = useProjects();
  
  const project = projectId ? getProject(projectId) : null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project) return;
    const fd = new FormData(e.currentTarget);
    const tags = (fd.get('tags') as string).split(',').map(t => t.trim()).filter(t => t !== '');
    updateProject(project.id, fd.get('title') as string, fd.get('desc') as string, tags);
    navigate(`/projects/${project.id}`);
  };

  if (!project) return null;

  return (
    <Layout title="Edit Project" onBack={() => navigate(`/projects/${project.id}`)}>
      <div className="max-w-2xl bg-white p-10 rounded-3xl shadow-lg mx-auto animate-fade-in">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div>
            <label className="block text-slate font-bold mb-2 uppercase tracking-widest text-xs">Project Title</label>
            <input name="title" defaultValue={project.title} required className="w-full h-14 px-6 rounded-2xl border-2 border-slate/10 outline-none text-xl focus:border-terracotta transition-colors" />
          </div>
          <div>
            <label className="block text-slate font-bold mb-2 uppercase tracking-widest text-xs">Description</label>
            <textarea name="desc" defaultValue={project.description} rows={4} className="w-full p-6 rounded-2xl border-2 border-slate/10 outline-none text-lg resize-none focus:border-terracotta transition-colors" />
          </div>
          <div>
            <label className="block text-slate font-bold mb-2 uppercase tracking-widest text-xs">Tags (comma separated)</label>
            <input name="tags" defaultValue={project.tags?.join(', ')} className="w-full h-14 px-6 rounded-2xl border-2 border-slate/10 outline-none text-xl focus:border-terracotta transition-colors" />
          </div>
          <button type="submit" className="w-full h-16 bg-terracotta text-white rounded-2xl font-bold text-xl btn-bounce shadow-lg">Save Changes</button>
        </form>
      </div>
    </Layout>
  );
};

export default EditProjectView;