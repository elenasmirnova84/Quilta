import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { showToast } from '../../../lib/toast';

const AuthView: React.FC = () => {
  const { login, activeProfile } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    login(formData.get('email') as string);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast.success('Password reset link sent to your email.');
  };

  if (activeProfile) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="w-full max-w-md bg-transparent p-6 animate-fade-in">
        <div className="mb-12 flex flex-col items-center">
          <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(50, 48)">
              <path d="M-25,-15 C-40,-5 -35,25 -5,35 C25,45 45,15 35,-15 C25,-45 -10,-40 -25,-15" stroke="#E07A5F" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
              <path d="M-15,-25 C-35,-20 -40,10 -20,30 C0,50 35,35 40,5 C45,-25 15,-45 -15,-25" stroke="#81B29A" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
              <path d="M5,-35 C-25,-35 -45,0 -25,25 C-5,50 40,40 45,10 C50,-20 35,-35 5,-35" stroke="#3D405B" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
              <path d="M15,20 C25,20 45,40 45,50" stroke="#3D405B" strokeWidth="4" strokeLinecap="round" />
            </g>
          </svg>
          <h1 className="text-6xl font-bold text-slate tracking-tight -mt-6 font-sans text-center">Quilta</h1>
          <p className="text-sage font-medium tracking-widest text-xl uppercase mt-1 font-sans text-center">QDA for Students</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <input name="email" type="email" required placeholder="Email Address" className="w-full h-14 px-4 rounded-xl border-2 border-slate/10 focus:border-terracotta outline-none transition-all text-lg bg-white/80" />
            <input name="password" type="password" required placeholder="Password" className="w-full h-14 px-4 rounded-xl border-2 border-slate/10 focus:border-terracotta outline-none transition-all text-lg bg-white/80" />
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 accent-terracotta cursor-pointer rounded border-slate/10"
              />
              <span className="text-slate/60 font-medium select-none group-hover:text-slate transition-colors">Remember me</span>
            </label>
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="text-terracotta font-semibold hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className="w-full h-16 bg-slate text-white rounded-2xl font-bold text-xl btn-bounce shadow-xl">Sign In</button>
        </form>
      </div>
    </div>
  );
};

export default AuthView;