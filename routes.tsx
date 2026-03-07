import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import AuthView from './features/auth/components/AuthView';
import ProjectsView from './features/projects/components/ProjectsView';
import CreateProjectView from './features/projects/components/CreateProjectView';
import EditProjectView from './features/projects/components/EditProjectView';
import ProjectDetailView from './features/projects/components/ProjectDetailView';
import InterviewDetailView from './features/interviews/components/InterviewDetailView';
import RecordInterviewView from './features/interviews/components/RecordInterviewView';
import CodingView from './features/coding/components/CodingView';
import ExportView from './features/export/components/ExportView';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthView />,
  },
  {
    path: '/projects',
    element: (
      <ProtectedRoute>
        <ProjectsView />
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/new',
    element: (
      <ProtectedRoute>
        <CreateProjectView />
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/:projectId',
    element: (
      <ProtectedRoute>
        <ProjectDetailView />
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/:projectId/edit',
    element: (
      <ProtectedRoute>
        <EditProjectView />
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/:projectId/interviews/new',
    element: (
      <ProtectedRoute>
        <RecordInterviewView />
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/:projectId/interviews/:interviewId',
    element: (
      <ProtectedRoute>
        <InterviewDetailView />
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/:projectId/interviews/:interviewId/coding',
    element: (
      <ProtectedRoute>
        <CodingView />
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/:projectId/export',
    element: (
      <ProtectedRoute>
        <ExportView />
      </ProtectedRoute>
    ),
  },
]);