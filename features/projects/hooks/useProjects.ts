import { useState, useEffect } from 'react';
import { dbService } from '../../../services/dbService';
import { Project } from '../../../types';
import { showToast } from '../../../lib/toast';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setIsLoading(true);
    const data = dbService.getProjects();
    setProjects(data);
    setTimeout(() => setIsLoading(false), 300);
  };

  const createProject = (title: string, description: string) => {
    const project = dbService.createProject(title, description);
    setProjects(prev => [...prev, project]);
    showToast.success('Project created successfully!');
    return project;
  };

  const updateProject = (id: string, title: string, description: string) => {
    const updated = dbService.updateProject(id, title, description);
    setProjects(prev => prev.map(p => p.id === id ? updated : p));
    showToast.success('Project updated');
    return updated;
  };

  const getProject = (id: string) => {
    return projects.find(p => p.id === id) || dbService.getProjects().find(p => p.id === id);
  };

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
    getProject,
    refresh: loadProjects,
  };
};