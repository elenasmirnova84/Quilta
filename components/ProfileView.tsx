import React, { useState } from 'react';
import { LocalProfile } from '../types';
import { dbService } from '../services/dbService';
import { showToast } from '../lib/toast';

export const ProfileView: React.FC<{
  profile: LocalProfile | null,
  onUpdateProfile: (p: LocalProfile) => void
}> = ({ profile, onUpdateProfile }) => {
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [institution, setInstitution] = useState(profile?.institution || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const updated = { ...profile, name, email, institution };
    dbService.updateProfile(updated);
    onUpdateProfile(updated);
    showToast.success('Profile updated successfully');
  };

  return (
    <div className="max-w-2xl mx-auto p-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-slate mb-8">Personal Settings</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate/5 shadow-sm space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-slate/40 uppercase tracking-widest mb-2">Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full h-12 px-4 rounded-xl border-2 border-slate/5 bg-slate/5 font-bold text-slate outline-none focus:border-terracotta" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate/40 uppercase tracking-widest mb-2">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-12 px-4 rounded-xl border-2 border-slate/5 bg-slate/5 font-bold text-slate outline-none focus:border-terracotta" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate/40 uppercase tracking-widest mb-2">Institution</label>
          <input value={institution} onChange={e => setInstitution(e.target.value)} className="w-full h-12 px-4 rounded-xl border-2 border-slate/5 bg-slate/5 font-bold text-slate outline-none focus:border-terracotta" />
        </div>
        <button type="submit" className="w-full py-4 bg-terracotta text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform">Save Changes</button>
      </form>

      <div className="mt-12 bg-white p-8 rounded-2xl border border-slate/5 shadow-sm">
        <h2 className="text-xl font-bold text-slate mb-6">Security</h2>
        <button className="text-terracotta font-bold hover:underline">Change Password</button>
      </div>
    </div>
  );
};
