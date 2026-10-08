'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CameraGuide } from '@/components/CameraGuide';
import { AnalysisLoading } from '@/components/AnalysisLoading';
import { ResultDashboard } from '@/components/ResultDashboard';
import { HistoryCompare } from '@/components/HistoryCompare';
import { PrivacyModal } from '@/components/PrivacyModal';
import { Sparkles, ShieldCheck, Camera, CheckCircle2, ArrowRight, Zap, User } from 'lucide-react';

export default function Home() {
  const [currentTab, setTab] = useState<'home' | 'capture' | 'analyzing' | 'result' | 'history' | 'privacy'>('home');

  // Single-user details state (no login required)
  const [userInfo, setUserInfo] = useState<{
    full_name: string;
    address: string;
    email: string;
    phone_number: string;
    ville: string;
  }>({
    full_name: '',
    address: '',
    email: '',
    phone_number: '',
    ville: ''
  });

  const [showUserInfoModal, setShowUserInfoModal] = useState(false);

  const [photos, setPhotos] = useState<{ front: string; left: string; right: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Restore user info from localStorage on mount
  useEffect(() => {
    try {
      const savedInfo = localStorage.getItem('skinai_user_info');
      if (savedInfo) {
        setUserInfo(JSON.parse(savedInfo));
      }
    } catch (e) {
      console.warn('Could not restore user info:', e);
    }
  }, []);

  const handleStartScanClick = () => {
    setShowUserInfoModal(true);
  };

  const handleSaveUserInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('skinai_user_info', JSON.stringify(userInfo));
    } catch (err) {
      console.warn('Could not save user info to localStorage:', err);
    }
    setShowUserInfoModal(false);
    setTab('capture');
  };

  const handlePhotosComplete = async (capturedPhotos: { front: string; left: string; right: string }) => {
    setPhotos(capturedPhotos);
    setTab('analyzing');
    setAnalysisError(null);

    const payload: any = {
      full_name: userInfo.full_name,
      address: userInfo.address,
      email: userInfo.email,
      phone_number: userInfo.phone_number,
      ville: userInfo.ville,
      photos: capturedPhotos,
    };

    try {
      const res = await fetch('http://localhost:5000/api/analysis/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Erreur serveur: ${res.status}`);

      const data = await res.json();
      if (!data?.data?.classification) throw new Error('Réponse invalide du serveur.');

      setTimeout(() => {
        setAnalysisResult(data.data);
        setTab('result');
      }, 2000);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setTimeout(() => {
        setAnalysisError(err?.message || 'Impossible de contacter le serveur.');
        setTab('result');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header Navbar */}
      <Navbar
        currentTab={currentTab}
        setTab={(tab: string) => {
          if (tab === 'capture') {
            handleStartScanClick();
          } else {
            setTab(tab as any);
          }
        }}
        userInfo={userInfo}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {/* Landing Page Hero View */}
        {currentTab === 'home' && (
          <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
            {/* Hero Banner */}
            <div className="text-center space-y-6 pt-4 relative">
              {/* Ambient glow */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-bold text-cyan-700 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                Diagnostic Visuel & Guide de Routine Cutanée
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
                Profil de Peau Cosmétique & Guide de Soins Personnalisé
              </h1>

              <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Évaluation faciale sous 3 angles. Recevez des mesures transparentes de la peau, votre type de peau principal, un score de sensibilité et des routines cosmétiques sur mesure.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <button
                  onClick={handleStartScanClick}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/20 hover:scale-105 hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Démarrer l'Analyse Guidée de la Peau
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setTab('history')}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm transition-colors"
                >
                  Voir l'Historique des Analyses
                </button>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="glass-card p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center border border-cyan-200">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">1. Scan Facial 3 Angles</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Photos guidées face, gauche ~45° et droite ~45° avec validation de qualité en temps réel (flou, distance, éclairage).
                </p>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center border border-teal-200">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">2. Fusion de Signaux Contrôlée</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Combine les observations d'images pour déterminer le type de peau et le score de sensibilité.
                </p>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">3. Enregistrement & PDF Logo</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Génération instantanée du rapport avec le logo RunCare et vos informations personnelles intégrées.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Capture Step */}
        {currentTab === 'capture' && (
          <CameraGuide onPhotosComplete={handlePhotosComplete} />
        )}

        {/* Loading Step */}
        {currentTab === 'analyzing' && <AnalysisLoading />}

        {/* Result Step */}
        {currentTab === 'result' && (
          <ResultDashboard
            data={analysisResult}
            error={analysisError}
            onCompareClick={() => setTab('history')}
            onDeleteClick={() => setTab('privacy')}
            onRetry={() => { setAnalysisResult(null); setAnalysisError(null); handleStartScanClick(); }}
          />
        )}

        {/* History Progress Step */}
        {currentTab === 'history' && (
          <HistoryCompare onBackToAnalysis={handleStartScanClick} />
        )}

        {/* Privacy Center */}
        {currentTab === 'privacy' && (
          <PrivacyModal onClose={() => setTab('home')} />
        )}
      </main>

      {/* User Info Modal (No Login Required) */}
      {showUserInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 max-w-md w-full space-y-5 shadow-2xl bg-white">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-lg">
                <User className="w-5 h-5 text-cyan-600" />
                <span>Informations du Client</span>
              </div>
              <button
                type="button"
                onClick={() => setShowUserInfoModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Veuillez saisir vos coordonnées ci-dessous. Elles seront enregistrées avec votre analyse et imprimées sur le rapport PDF.
            </p>

            <form onSubmit={handleSaveUserInfoSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Jean Dupont"
                  value={userInfo.full_name}
                  onChange={(e) => setUserInfo({ ...userInfo, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1">Adresse E-mail *</label>
                <input
                  type="email"
                  required
                  placeholder="ex: jean.dupont@email.com"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1">Numéro de Téléphone *</label>
                <input
                  type="tel"
                  required
                  placeholder="ex: 06 12 34 56 78"
                  value={userInfo.phone_number}
                  onChange={(e) => setUserInfo({ ...userInfo, phone_number: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1">Ville *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Paris"
                  value={userInfo.ville}
                  onChange={(e) => setUserInfo({ ...userInfo, ville: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1">Adresse (optionnelle)</label>
                <input
                  type="text"
                  placeholder="ex: 15 Rue de la Paix"
                  value={userInfo.address}
                  onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUserInfoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-xs font-bold shadow-md hover:scale-105 transition-all flex items-center gap-2"
                >
                  Continuer l'analyse
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
