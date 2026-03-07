import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  title: string;
  actions?: React.ReactNode;
}

const LogoIconSmall: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(50, 48) scale(0.9)">
      <path d="M-25,-15 C-40,-5 -35,25 -5,35 C25,45 45,15 35,-15 C25,-45 -10,-40 -25,-15" stroke="#E07A5F" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
      <path d="M-15,-25 C-35,-20 -40,10 -20,30 C0,50 35,35 40,5 C45,-25 15,-45 -15,-25" stroke="#81B29A" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
      <path d="M5,-35 C-25,-35 -45,0 -25,25 C-5,50 40,40 45,10 C50,-20 35,-35 5,-35" stroke="#3D405B" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
      <path d="M15,20 C25,20 45,40 45,50" stroke="#3D405B" strokeWidth="10" strokeLinecap="round" />
    </g>
  </svg>
);

const Layout: React.FC<LayoutProps> = ({ children, onBack, title, actions }) => {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-charcoal">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-terracotta/10 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pr-4 border-r border-slate/10">
            <LogoIconSmall />
            <span className="font-bold text-slate hidden lg:block uppercase tracking-tighter text-xl">Quilta</span>
          </div>
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-terracotta/10 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-bold tracking-tight text-slate truncate max-w-[200px] md:max-w-md">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {actions}
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;