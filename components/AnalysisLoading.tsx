'use client';

import React, { useEffect, useState } from 'react';
import { Scan, Cpu } from 'lucide-react';

export const AnalysisLoading: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    "Validation de la netteté de l'image, de l'éclairage & de l'alignement...",
    "Segmentation des zones du visage (Zone T, Joues, Menton)...",
    "Calcul des indices de brillance, sécheresse et texture...",
    "Fusion des observations visuelles avec le questionnaire...",
    "Application des règles de classification et de sensibilité...",
    "Génération de la routine cosmétique personnalisée..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-center">
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-200 bg-white shadow-xl relative overflow-hidden flex flex-col items-center">
        {/* Animated Glow Backdrops */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-100/50 rounded-full blur-3xl animate-pulse"></div>

        {/* Pulse Face Mesh Indicator */}
        <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping"></div>
          <div className="w-24 h-24 rounded-full bg-cyan-50 border border-cyan-300 flex items-center justify-center shadow-md">
            <Scan className="w-10 h-10 text-cyan-600 animate-pulse" />
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          Analyse de votre Profil Cutané
        </h3>
        <p className="text-xs text-slate-500 mb-8 max-w-sm">
          Traitement des données d'images et synthèse du questionnaire
        </p>

        {/* Active Step Indicator */}
        <div className="w-full glass-card p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-3 text-left mb-6">
          <Cpu className="w-5 h-5 text-cyan-600 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-xs font-semibold text-slate-800">
            {steps[stepIndex]}
          </span>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx <= stepIndex ? 'w-6 bg-cyan-600' : 'w-2 bg-slate-200'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

