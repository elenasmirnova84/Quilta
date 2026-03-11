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
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const updated = { ...profile, name, email, institution };
    dbService.updateProfile(updated);
    onUpdateProfile(updated);
    showToast.success('Profile updated successfully');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (profile.password && currentPassword !== profile.password) {
      showToast.error('Current password incorrect');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 4) {
      showToast.error('Password too short');
      return;
    }
    const updated = { ...profile, password: newPassword };
    dbService.updateProfile(updated);
    onUpdateProfile(updated);
    showToast.success('Password updated successfully');
    setShowPasswordChange(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
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
        {!showPasswordChange ? (
          <button onClick={() => setShowPasswordChange(true)} className="text-terracotta font-bold hover:underline">Change Password</button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4 animate-fade-in">
            {profile?.password && (
              <div>
                <label className="block text-[10px] font-bold text-slate/40 uppercase tracking-widest mb-2">Current Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full h-12 px-4 rounded-xl border-2 border-slate/5 bg-slate/5 font-bold text-slate outline-none focus:border-terracotta" />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-slate/40 uppercase tracking-widest mb-2">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full h-12 px-4 rounded-xl border-2 border-slate/5 bg-slate/5 font-bold text-slate outline-none focus:border-terracotta" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate/40 uppercase tracking-widest mb-2">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full h-12 px-4 rounded-xl border-2 border-slate/5 bg-slate/5 font-bold text-slate outline-none focus:border-terracotta" />
            </div>
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setShowPasswordChange(false)} className="flex-1 py-3 bg-slate/5 text-slate rounded-xl font-bold">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-terracotta text-white rounded-xl font-bold shadow-lg">Update Password</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
