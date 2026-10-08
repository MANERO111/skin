'use client';

import React from 'react';
import { ShieldCheck, History, Camera } from 'lucide-react';
import Image from 'next/image';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  userInfo?: { full_name?: string } | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setTab, userInfo }) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/90 px-4 lg:px-8 py-3 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="group-hover:scale-[1.02] transition-transform flex items-center justify-center p-1 bg-white">
            <Image src="/img/runcare_logo.png" width={150} height={80} alt="DermVision Logo" className="object-contain" style={{ height: '46px', width: 'auto' }} />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setTab('home')}
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
            onClick={() => setTab('history')}
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
            onClick={() => setTab('privacy')}
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

        {/* User Status / Quick Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 border border-teal-200 px-3.5 py-1.5 rounded-full font-semibold">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            {userInfo?.full_name ? `Client : ${userInfo.full_name}` : 'Système de Bien-être Non-Médical'}
          </div>
        </div>
      </div>
    </header>
  );
};


