'use client';

import React from 'react';
import { AlertTriangle, Camera, ArrowRight, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface PhotoQualityModalProps {
  isOpen: boolean;
  validationReports?: Record<string, { usable: boolean; reason?: string; provided?: boolean }>;
  onRetake: () => void;
  onContinueAnyway: () => void;
}

export const PhotoQualityModal: React.FC<PhotoQualityModalProps> = ({
  isOpen,
  validationReports,
  onRetake,
  onContinueAnyway
}) => {
  if (!isOpen) return null;

  const getPoseLabel = (key: string) => {
    switch (key) {
      case 'front': return 'Photo de Face';
      case 'left': return 'Profil Gauche';
      case 'right': return 'Profil Droit';
      default: return key;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/40 shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Glow accent behind background */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/10">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Header */}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Photo non claire ou visage non détecté
        </h3>

        {/* Core explanation with 75% / 25% emphasis */}
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 mb-5 text-xs sm:text-sm text-slate-300 space-y-2">
          <p className="font-semibold text-amber-200 flex items-center gap-2">
            <span>Pouvez-vous reprendre la photo s'il vous plaît ?</span>
          </p>
          <p className="text-slate-300 leading-relaxed">
            Notre diagnostic s'appuie à <strong className="text-amber-400 font-bold">75% sur l'analyse visuelle de vos photos</strong> et seulement à <strong className="text-cyan-400 font-bold">25% sur le questionnaire</strong>. Une photo nette est indispensable pour détecter le type de peau et la brillance avec précision.
          </p>
        </div>

        {/* Photo Status Details List */}
        {validationReports && Object.keys(validationReports).length > 0 && (
          <div className="space-y-2.5 mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Détails du contrôle qualité :</p>
            {Object.entries(validationReports).map(([key, rep]) => {
              const isUsable = rep?.usable ?? false;
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                    isUsable
                      ? 'bg-slate-900/40 border-teal-500/30 text-slate-200'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isUsable ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-semibold">{getPoseLabel(key)}</span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {isUsable ? 'Image valide ✓' : rep?.reason || 'Visage non détecté / Flou'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onRetake}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-teal-400 to-cyan-400 hover:from-amber-400 hover:to-cyan-300 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Camera className="w-4 h-4" />
            Reprendre la photo
          </button>

          <button
            onClick={onContinueAnyway}
            className="py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs border border-slate-800 transition-all text-center"
          >
            Continuer quand même
          </button>
        </div>
      </div>
    </div>
  );
};
