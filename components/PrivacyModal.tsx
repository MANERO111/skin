'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Trash2, CheckCircle2, AlertTriangle, EyeOff } from 'lucide-react';

interface PrivacyModalProps {
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
  // const [deletedMsg, setDeletedMsg] = useState(false);

  // const handleDeleteAllData = () => {
  //   fetch('http://localhost:5000/api/analysis/sess_curr_latest', { method: 'DELETE' })
  //     .then(() => {
  //       setDeletedMsg(true);
  //       setTimeout(() => setDeletedMsg(false), 3000);
  //     })
  //     .catch(() => {
  //       setDeletedMsg(true);
  //       setTimeout(() => setDeletedMsg(false), 3000);
  //     });
  // };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Confidentialité et sécurité des données biométriques</h2>
            <p className="text-xs text-slate-500">Minimisation stricte des données, normes de chiffrement et de propriété de l'utilisateur</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-200 space-y-2 bg-slate-50">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700">
              <Lock className="w-4 h-4" /> Aucun stockage public
            </div>
            <p className="text-xs text-slate-600">
              Les images faciales sont traitées de manière éphémère en mémoire volatile. Aucun espace de stockage public ou URL publique n'est jamais généré.
            </p>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-200 space-y-2 bg-slate-50">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-700">
              <EyeOff className="w-4 h-4" /> Aucun entraînement de modèle sans consentement
            </div>
            <p className="text-xs text-slate-600">
              Vos photos téléchargées sont strictement utilisées pour l'analyse de votre session active et ne sont jamais intégrées dans des ensembles d'entraînement de modèles d'IA globaux.
            </p>
          </div>
        </div>

        {/* <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
               <h4 className="text-xs font-bold text-rose-700">Suppression permanente des données</h4>
               <p className="text-[11px] text-slate-500">Supprimez instantanément tous les journaux d'analyse stockés, les métriques numériques et les enregistrements photo.</p>
            </div>
            <button
              onClick={handleDeleteAllData}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer mes données
            </button>
          </div>
           {deletedMsg && (
             <div className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
               <CheckCircle2 className="w-4 h-4" /> Toutes les données photo et les journaux de session ont été supprimés avec succès !
             </div>
           )}
        </div> */}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200"
          >
            Fermer le centre de confidentialité
          </button>
        </div>
      </div>
    </div>
  );
};
