'use client';

import React, { useState } from 'react';
import { ShieldCheck, History, Camera, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  userInfo?: { full_name?: string } | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setTab, userInfo }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: string) => {
    setTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/90 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 bg-white/80 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
        >
          <div className="group-hover:scale-[1.02] transition-transform flex items-center justify-center p-0.5 bg-white rounded-lg">
            <img
              src="/img/runcare_logo.png" 
              alt="DermVision Logo" 
              className="object-contain h-10 sm:h-12 md:h-14 w-auto" 
            />
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => handleNavClick('home')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'home' 
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Nouvelle Analyse
          </button>
          
          <button
            onClick={() => handleNavClick('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'history' 
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historique des Progrès
          </button>

          <button
            onClick={() => handleNavClick('privacy')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'privacy' 
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Confidentialité & Données
          </button>
        </nav>

        {/* Right side: User status + Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-teal-700 bg-teal-50 border border-teal-200 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full font-semibold max-w-[170px] sm:max-w-[260px] md:max-w-none truncate">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0"></span>
            <span className="truncate">
              {userInfo?.full_name ? `Client : ${userInfo.full_name}` : 'Bien-être Non-Médical'}
            </span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-200 animate-fade-in space-y-1">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'home'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            Nouvelle Analyse
          </button>

          <button
            onClick={() => handleNavClick('history')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'history'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            Historique des Progrès
          </button>

          <button
            onClick={() => handleNavClick('privacy')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'privacy'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Confidentialité & Données
          </button>
        </div>
      )}
    </header>
  );
};


