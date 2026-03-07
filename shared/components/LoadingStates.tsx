import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="bg-white p-6 rounded-xl border border-slate/5 shadow-sm animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="h-6 bg-slate/10 rounded w-3/4" />
      <div className="h-5 bg-slate/10 rounded w-16" />
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-slate/10 rounded w-full" />
      <div className="h-4 bg-slate/10 rounded w-5/6" />
    </div>
    <div className="mt-4 pt-4 border-t border-slate/5">
      <div className="h-3 bg-slate/10 rounded w-24" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white p-5 rounded-xl animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate/10" />
          <div className="flex-1">
            <div className="h-5 bg-slate/10 rounded w-2/3 mb-2" />
            <div className="h-3 bg-slate/10 rounded w-1/3" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const ProcessingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <div className="bg-white p-20 rounded-3xl shadow-lg text-center flex flex-col items-center gap-6">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
      <div className="absolute inset-0 w-16 h-16 border-4 border-sage/20 rounded-full" />
    </div>
    {message && (
      <div>
        <h2 className="text-2xl font-bold text-slate mb-2">Processing</h2>
        <p className="text-slate/60">{message}</p>
        <p className="text-[10px] uppercase tracking-widest text-slate/30 font-bold mt-4">Verbatim Multilingual Extraction (EN, DE, ES, RU)</p>
      </div>
    )}
  </div>
);