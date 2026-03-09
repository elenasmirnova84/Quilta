import React, { useState } from 'react';
import { LocalProfile } from '../types';
import { dbService } from '../services/dbService';

interface ProfileSelectionDialogProps {
  onProfileSelected: (profile: LocalProfile) => void;
}

const ProfileSelectionDialog: React.FC<ProfileSelectionDialogProps> = ({ onProfileSelected }) => {
  const [profiles] = useState<LocalProfile[]>(() => dbService.getProfiles());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    researchField: ''
  });
  const [isCreating, setIsCreating] = useState(profiles.length === 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;
    const profile = dbService.createProfile(formData);
    onProfileSelected(profile);
  };

  const handleSelect = (id: string) => {
    dbService.setActiveProfile(id);
    const profile = profiles.find(p => p.id === id);
    if (profile) onProfileSelected(profile);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta mx-auto mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate">Research Profile</h2>
          <p className="text-slate/40 font-medium mt-2">Set up your local workspace identity</p>
        </div>

        {isCreating ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate/30 uppercase tracking-widest">Full Name *</label>
                <input
                  autoFocus
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Jane Smith"
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate/5 bg-slate/5 font-bold text-slate outline-none focus:border-terracotta transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate/30 uppercase tracking-widest">Email Address *</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane.smith@uni.edu"
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate/5 bg-slate/5 font-bold text-slate outline-none focus:border-terracotta transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate/30 uppercase tracking-widest">Institution (Optional)</label>
              <input
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="e.g. University of Oxford"
                className="w-full h-12 px-4 rounded-xl border-2 border-slate/5 bg-slate/5 font-bold text-slate outline-none focus:border-terracotta transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate/30 uppercase tracking-widest">Research Field (Optional)</label>
              <input
                value={formData.researchField}
                onChange={(e) => setFormData({ ...formData, researchField: e.target.value })}
                placeholder="e.g. Medical Sociology"
                className="w-full h-12 px-4 rounded-xl border-2 border-slate/5 bg-slate/5 font-bold text-slate outline-none focus:border-terracotta transition-all"
              />
            </div>

            <div className="flex gap-3 pt-4">
              {profiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 h-14 bg-slate/5 text-slate rounded-2xl font-bold transition-all hover:bg-slate/10"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={!formData.name.trim() || !formData.email.trim()}
                className="flex-[2] h-14 bg-terracotta text-white rounded-2xl font-bold shadow-lg shadow-terracotta/20 transition-all hover:bg-terracotta/90 disabled:opacity-50"
              >
                Create Profile
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className="w-full h-16 px-6 rounded-2xl border-2 border-slate/5 bg-slate/5 flex items-center justify-between group hover:border-terracotta/30 hover:bg-white transition-all"
                >
                  <div className="text-left">
                    <div className="font-bold text-slate text-lg">{p.name}</div>
                    <div className="text-xs text-slate/40">{p.email}</div>
                  </div>
                  <svg className="w-5 h-5 text-slate/20 group-hover:text-terracotta transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="w-full h-14 border-2 border-dashed border-slate/10 rounded-2xl text-slate/40 font-bold hover:border-terracotta/30 hover:text-terracotta transition-all"
            >
              + Create New Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSelectionDialog;
