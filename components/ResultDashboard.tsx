'use client';

import React, { useState, useRef } from 'react';
import {
  Sparkles, ShieldCheck, CheckCircle2, AlertTriangle,
  Layers, Info, Sun, Moon, ThumbsUp, ThumbsDown,
  Trash2, History, RefreshCw, Download, FileText, Loader2
} from 'lucide-react';

interface ResultDashboardProps {
  data: any;
  error?: string | null;
  onCompareClick: () => void;
  onDeleteClick: () => void;
  onRetry?: () => void;
}

export const ResultDashboard: React.FC<ResultDashboardProps> = ({
  data,
  error,
  onCompareClick,
  onDeleteClick,
  onRetry
}) => {
  const [activeTab, setActiveTab] = useState<'routines' | 'ingredients'>('routines');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const jsPDF = (await import('jspdf')).default;

      const element = pdfRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - (margin * 2));

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - (margin * 2));
      }

      pdf.save(`Rapport_Cosmetique_DermVision_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Erreur lors de la génération du PDF:', err);
      alert("Erreur lors de la génération du PDF. Veuillez réessayer.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shadow-sm">
          <AlertTriangle className="w-8 h-8 text-rose-600" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black mb-2">Analyse non disponible</h2>
          <p className="text-sm text-slate-800 leading-relaxed max-w-md">{error}</p>
        </div>
        <div className="flex gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-xs font-bold shadow-md flex items-center gap-2 hover:scale-105 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer le questionnaire
            </button>
          )}
          <button
            onClick={onDeleteClick}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold border border-slate-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // ── No data state ────────────────────────────────────────────────────────────
  if (!data?.classification || !data?.recommendations) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
          <Info className="w-8 h-8 text-cyan-700" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black mb-2">Aucun résultat disponible</h2>
          <p className="text-sm text-slate-800">Aucune donnée d'analyse n'a été reçue. Veuillez relancer l'analyse.</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-xs font-bold shadow-md flex items-center gap-2 hover:scale-105 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Relancer l'analyse
          </button>
        )}
      </div>
    );
  }

  const classification = data.classification;
  const recommendations = data.recommendations;
  const explanation = data.explanation || '';
  const userInfo = data.user_info || {};

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // French skin type labels
  const typeFr: Record<string, string> = {
    Combination: 'Mixte', Oily: 'Grasse', Dry: 'Sèche', Normal: 'Normale'
  };
  const sensiFr: Record<string, string> = {
    High: 'Élevée', Medium: 'Moyenne', Low: 'Faible'
  };
  const primaryFr = typeFr[classification.primary_skin_type] || classification.primary_skin_type;
  const sensitFr = sensiFr[classification.sensitivity] || classification.sensitivity;

  // Metric labels in French
  const metricLabels: Record<string, string> = {
    Oiliness: 'Sébum / Brillance',
    Dryness: 'Sécheresse',
    Redness: 'Rougeur',
    'Visible Pores': 'Pores visibles',
    Blemishes: 'Imperfections',
    Texture: 'Texture'
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Action Header bar with PDF Download */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-300 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-900 font-bold">
          <FileText className="w-4 h-4 text-cyan-700" />
          <span className="font-extrabold text-black">Rapport de Synthèse Cutanée</span>
          <span className="text-slate-600 font-medium">• Généré le {new Date().toLocaleDateString('fr-FR')}</span>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-black text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Génération du PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Télécharger en PDF
            </>
          )}
        </button>
      </div>

      {/* Printable Report Wrapper (UI) */}
      <div className="space-y-8 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200">

        {/* ── 1. Header Banner & Profile Badges ─────────────────────────────── */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-md relative overflow-hidden bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-800 mb-2">
                <Sparkles className="w-4 h-4 text-cyan-700" />
                Profil Cosmétique Vérifié
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
                {primaryFr.toUpperCase()}
              </h1>
              {recommendations.summary_guidance && (
                <p className="text-sm font-semibold text-slate-800 mt-2 max-w-xl leading-relaxed">
                  {recommendations.summary_guidance}
                </p>
              )}
            </div>

            <div className="flex flex-wrap md:flex-col items-start md:items-end gap-3 shrink-0">
              <div className="glass-card px-4 py-2 rounded-2xl border border-cyan-300 bg-cyan-50 flex items-center gap-2">
                <span className="text-xs text-black font-bold">Sensibilité :</span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${classification.sensitivity === 'High'
                    ? 'bg-rose-100 text-rose-950 border border-rose-300'
                    : classification.sensitivity === 'Medium'
                      ? 'bg-amber-100 text-amber-950 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                  }`}>
                  {sensitFr}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                Évaluation Cosmétique & Bien-être
              </div>
            </div>
          </div>
        </div>

        {/* ── Client Info Card on Web UI ─────────────────────────────────── */}
        {(userInfo?.full_name || userInfo?.email || userInfo?.phone_number || userInfo?.ville) && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-300 bg-cyan-50/50 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-cyan-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
              Fiche Client / Utilisateur
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {userInfo.full_name && (
                <div>
                  <span className="text-slate-500 font-semibold block">Nom complet</span>
                  <span className="font-black text-slate-900 text-sm">{userInfo.full_name}</span>
                </div>
              )}
              {userInfo.email && (
                <div>
                  <span className="text-slate-500 font-semibold block">Email</span>
                  <span className="font-bold text-slate-800">{userInfo.email}</span>
                </div>
              )}
              {userInfo.phone_number && (
                <div>
                  <span className="text-slate-500 font-semibold block">Téléphone</span>
                  <span className="font-bold text-slate-800">{userInfo.phone_number}</span>
                </div>
              )}
              {userInfo.ville && (
                <div>
                  <span className="text-slate-500 font-semibold block">Ville</span>
                  <span className="font-bold text-slate-800">{userInfo.ville}</span>
                </div>
              )}
              {userInfo.address && (
                <div className="sm:col-span-2 lg:col-span-4">
                  <span className="text-slate-500 font-semibold block">Adresse</span>
                  <span className="font-bold text-slate-800">{userInfo.address}</span>
                </div>
              )}
            </div>
          </div>
        )}


        {/* ── 2. Detected Metrics & Why Reasoning ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: Skin metrics */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-300 bg-white shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-black flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-700" />
                Indicateurs Détectés
              </h3>
              <span className="text-xs font-bold text-slate-700">Scores visuels avancés</span>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Oiliness', color: 'bg-cyan-600' },
                { label: 'Dryness', color: 'bg-amber-600' },
                { label: 'Redness', color: 'bg-rose-600' },
                { label: 'Visible Pores', color: 'bg-purple-600' },
                { label: 'Blemishes', color: 'bg-teal-600' },
                { label: 'Texture', color: 'bg-indigo-600' },
              ].map(({ label, color }) => {
                const key = label.toLowerCase().replace(' ', '_');
                const val: string = classification.visual_summary?.[key] ?? '—';
                const num: number = classification.numeric_metrics?.[key] ?? 0;
                return (
                  <div key={label} className="glass-card p-3 rounded-2xl border border-slate-300 bg-slate-50">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-extrabold text-black">
                        {metricLabels[label] ?? label}
                      </span>
                      <span className="font-black text-cyan-800">{val}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full ${color} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.max(6, num)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Reasoning & explanation */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-300 bg-white shadow-sm space-y-5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-black flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-teal-700" />
                Pourquoi cette classification ?
              </h3>

              {/* Zone cards */}
              {classification.zones && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['forehead', 'nose', 'cheeks'] as const).map((zone) => {
                    const labels: Record<string, string> = { forehead: 'Front', nose: 'Nez', cheeks: 'Joues' };
                    return (
                      <div key={zone} className="glass-card p-3 rounded-2xl text-center border border-slate-300 bg-slate-50">
                        <span className="text-xs text-slate-800 uppercase font-bold block">{labels[zone]}</span>
                        <span className="text-xs font-black text-cyan-800 mt-1 block">
                          {classification.zones[zone]?.shine ?? '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Transparent reasoning list */}
              {Array.isArray(classification.reasoning) && classification.reasoning.length > 0 && (
                <div className="space-y-2.5">
                  {classification.reasoning.map((r: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-black font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Personalized explanation */}
            {explanation && (
              <div className="glass-card p-4 rounded-2xl border border-cyan-300 bg-cyan-50/90 text-xs text-black font-semibold leading-relaxed mt-4">
                <p className="font-black text-cyan-950 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-700" /> Résumé Personnalisé
                </p>
                {explanation}
              </div>
            )}
          </div>
        </div>

        {/* ── Visual Verification Card (Neutralized) ────────────────────── */}
        {data.luna_verification && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-md relative overflow-hidden bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 border border-cyan-300 text-cyan-800 flex items-center justify-center font-bold text-sm shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-cyan-800" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black flex items-center gap-2">
                    Contrôle de Cohérence Visuelle
                    <span className="text-[10px] uppercase tracking-wider font-black px-2.5 py-0.5 rounded-full bg-cyan-100 border border-cyan-300 text-cyan-900">
                      Vérification Validée
                    </span>
                  </h3>
                  <p className="text-xs text-black font-medium mt-0.5">Synthèse des observations visuelles & contrôle de cohérence cutanée</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-black font-bold">Cohérence Visuelle :</span>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  {String(data.luna_verification.consistency).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-black font-semibold">
              {/* Visual Observations */}
              <div className="glass-card p-4 rounded-2xl border border-slate-300 bg-slate-50 space-y-2">
                <h4 className="font-black text-black flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-700" /> Observations Visuelles Synthétiques
                </h4>
                {Array.isArray(data.luna_verification.visual_observations) ? (
                  <ul className="space-y-1.5 list-disc list-inside text-black font-semibold">
                    {data.luna_verification.visual_observations.map((obs: string, i: number) => (
                      <li key={i}>{obs}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="leading-relaxed text-black font-semibold">{data.luna_verification.visual_observations}</p>
                )}
              </div>

              {/* Discrepancies & Confirmation Summary */}
              <div className="glass-card p-4 rounded-2xl border border-slate-300 bg-slate-50 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-cyan-950 flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-700" /> Contrôle d'Incohérence
                  </h4>
                  <p className="text-black font-semibold leading-relaxed">
                    {Array.isArray(data.luna_verification.discrepancies)
                      ? data.luna_verification.discrepancies.join(' ')
                      : data.luna_verification.discrepancies}
                  </p>
                </div>

                {data.luna_verification.summary && (
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-300 text-xs text-teal-950 font-bold leading-relaxed">
                    💡 {data.luna_verification.summary}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 3. Recommendations Section ────────────────────────────────────── */}
        <div className="glass-panel p-6 sm:p-8 mt-42 rounded-3xl border border-slate-300 bg-white shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-black text-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-700" />
                Conseils Cosmétiques Personnalisés
              </h2>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">Étapes & ingrédients adaptés à votre profil de peau</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-300">
              <button
                onClick={() => setActiveTab('routines')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'routines' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-800 hover:text-black'
                  }`}
              >
                Routines Quotidiennes
              </button>
              <button
                onClick={() => setActiveTab('ingredients')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'ingredients' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-800 hover:text-black'
                  }`}
              >
                Guide Ingrédients
              </button>
            </div>
          </div>

          {/* Routines tab */}
          {activeTab === 'routines' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Morning */}
              {recommendations.morning_routine?.length > 0 && (
                <div className="glass-card p-5 rounded-2xl border border-amber-300 bg-amber-50/70 space-y-4">
                  <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                    <Sun className="w-4 h-4 text-amber-700" />
                    Routine Matin (AM)
                  </div>
                  <div className="space-y-3">
                    {recommendations.morning_routine.map((step: any, idx: number) => (
                      <div key={idx} className="glass-card p-3 rounded-xl border border-slate-300 bg-white text-xs">
                        <span className="text-[10px] uppercase font-black text-amber-800 block">{step.step}</span>
                        <h5 className="font-black text-black mt-0.5">{step.name}</h5>
                        <p className="text-slate-900 mt-1 text-xs font-medium">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evening */}
              {recommendations.evening_routine?.length > 0 && (
                <div className="glass-card p-5 rounded-2xl border border-indigo-300 bg-indigo-50/70 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-950 font-black text-sm">
                    <Moon className="w-4 h-4 text-indigo-700" />
                    Routine Soir (PM)
                  </div>
                  <div className="space-y-3">
                    {recommendations.evening_routine.map((step: any, idx: number) => (
                      <div key={idx} className="glass-card p-3 rounded-xl border border-slate-300 bg-white text-xs">
                        <span className="text-[10px] uppercase font-black text-indigo-800 block">{step.step}</span>
                        <h5 className="font-black text-black mt-0.5">{step.name}</h5>
                        <p className="text-slate-900 mt-1 text-xs font-medium">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ingredients tab */}
          {activeTab === 'ingredients' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {recommendations.ingredients_to_seek?.length > 0 && (
                  <div className="glass-card p-4 rounded-2xl border border-emerald-300 bg-emerald-50/70">
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ThumbsUp className="w-4 h-4 text-emerald-700" /> Ingrédients Recommandés
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.ingredients_to_seek.map((ing: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {recommendations.ingredients_to_avoid?.length > 0 && (
                  <div className="glass-card p-4 rounded-2xl border border-rose-300 bg-rose-50/70">
                    <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ThumbsDown className="w-4 h-4 text-rose-700" /> Ingrédients à Éviter
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.ingredients_to_avoid.map((ing: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-xl bg-rose-100 text-rose-950 border border-rose-300 font-extrabold">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Do's & Don'ts */}
              {recommendations.dos_and_donts && (
                <div className="glass-card p-4 rounded-2xl border border-slate-300 bg-slate-50 space-y-4">
                  {recommendations.dos_and_donts.dos?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-cyan-950 uppercase tracking-wider mb-2">À Faire</h4>
                      <ul className="space-y-1.5 text-xs text-slate-900 font-semibold">
                        {recommendations.dos_and_donts.dos.map((d: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-700 shrink-0" /> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recommendations.dos_and_donts.donts?.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider mb-2">À Éviter</h4>
                      <ul className="space-y-1.5 text-xs text-slate-900 font-semibold">
                        {recommendations.dos_and_donts.donts.map((d: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" /> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 text-xs text-slate-800 flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
            <span>
              <strong>Avertissement Cosmétique & Bien-être :</strong> Cette application fournit des conseils généraux en matière de cosmétique et de profil de peau. Elle ne constitue pas un diagnostic médical ni un plan de traitement dermatologique.
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Action Footer ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          onClick={onDeleteClick}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-slate-800 hover:text-rose-700 border border-slate-300 text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
        >
          <Trash2 className="w-4 h-4 text-rose-600" />
          Supprimer mes photos & données
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-black text-xs font-black border border-slate-300 shadow-xs flex items-center gap-2 transition-colors"
          >
            {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin text-cyan-700" /> : <Download className="w-4 h-4 text-cyan-700" />}
            Télécharger le Rapport (PDF)
          </button>

          <button
            onClick={onCompareClick}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-black border border-slate-300 flex items-center gap-2 transition-colors"
          >
            <History className="w-4 h-4 text-cyan-700" />
            Comparer les progrès
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-xs font-black shadow-md hover:scale-105 transition-all flex items-center gap-2"
          >
            {savedSuccess ? (
              <><CheckCircle2 className="w-4 h-4" /> Sauvegardé !</>
            ) : (
              <>Sauvegarder l'analyse</>
            )}
          </button>
        </div>
      </div>

      {/* ── PDF ONLY HIDDEN TEMPLATE ── */}
      <div className="absolute left-[-9999px] top-0 w-[1000px] bg-white text-black p-12 font-sans" ref={pdfRef}>
        {/* Header with Logo */}
        <div className="border-b-4 border-cyan-800 pb-6 mb-8 flex items-center justify-between">
          <div>
            <div className="mb-4">
              {/* Logo in PDF */}
              <img src="/img/runcare_logo.png" alt="RunCare Logo" className="h-16 w-auto object-contain" />
            </div>
            <div className="flex items-center gap-2 text-cyan-800 font-bold mb-1">
              <Sparkles className="w-5 h-5" />
              <span>DermVision - Rapport Cosmétique</span>
            </div>
            <h1 className="text-4xl font-black text-black tracking-tight">{primaryFr.toUpperCase()}</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-500">Date : {new Date().toLocaleDateString('fr-FR')}</p>
            <p className="text-sm font-bold text-slate-500 mt-1">Sensibilité : {sensitFr}</p>
          </div>
        </div>

        {/* Client User Info Card in PDF */}
        {(userInfo?.full_name || userInfo?.email || userInfo?.phone_number || userInfo?.ville) && (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-300 mb-8">
            <h3 className="font-black text-cyan-900 text-sm uppercase tracking-wider mb-3">Informations Client / Utilisateur</h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
              {userInfo.full_name && <div><span className="font-bold text-slate-600">Nom complet :</span> <span className="font-black text-black">{userInfo.full_name}</span></div>}
              {userInfo.email && <div><span className="font-bold text-slate-600">Email :</span> <span className="font-black text-black">{userInfo.email}</span></div>}
              {userInfo.phone_number && <div><span className="font-bold text-slate-600">Téléphone :</span> <span className="font-black text-black">{userInfo.phone_number}</span></div>}
              {userInfo.ville && <div><span className="font-bold text-slate-600">Ville :</span> <span className="font-black text-black">{userInfo.ville}</span></div>}
              {userInfo.address && <div className="col-span-2"><span className="font-bold text-slate-600">Adresse :</span> <span className="font-black text-black">{userInfo.address}</span></div>}
            </div>
          </div>
        )}

        {/* Summary */}
        {recommendations.summary_guidance && (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
            <h3 className="font-black text-lg mb-2">Résumé</h3>
            <p className="text-black font-medium leading-relaxed">{recommendations.summary_guidance}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Metrics */}
          <div>
            <h3 className="font-black text-xl mb-4 text-cyan-900 border-b-2 border-cyan-100 pb-2">1. Indicateurs Visuels</h3>
            <div className="space-y-3">
              {[
                { label: 'Oiliness', name: 'Sébum / Brillance' },
                { label: 'Dryness', name: 'Sécheresse' },
                { label: 'Redness', name: 'Rougeur' },
                { label: 'Visible Pores', name: 'Pores visibles' },
                { label: 'Blemishes', name: 'Imperfections' },
                { label: 'Texture', name: 'Texture' },
              ].map(({ label, name }) => {
                const key = label.toLowerCase().replace(' ', '_');
                const val = classification.visual_summary?.[key] ?? '—';
                return (
                  <div key={label} className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-bold">{name}</span>
                    <span className="font-black text-cyan-700">{val}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <h3 className="font-black text-xl mb-4 text-cyan-900 border-b-2 border-cyan-100 pb-2">2. Observations </h3>
            <div className="space-y-3">
              {Array.isArray(classification.reasoning) && classification.reasoning.map((r: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-black font-semibold leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Routines */}
        <h3 className="font-black text-2xl mb-6 text-cyan-900 border-b-2 border-cyan-100 pb-2">3. Routines Quotidiennes</h3>
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Morning */}
          <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200">
            <h4 className="font-black text-amber-900 text-lg mb-4 flex items-center gap-2"><Sun className="w-5 h-5" /> Matin (AM)</h4>
            <div className="space-y-4">
              {recommendations.morning_routine?.map((step: any, idx: number) => (
                <div key={idx}>
                  <span className="text-[10px] uppercase font-black text-amber-700 block">{step.step}</span>
                  <h5 className="font-black text-black">{step.name}</h5>
                  <p className="text-black mt-0.5 text-sm font-medium">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Evening */}
          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-200">
            <h4 className="font-black text-indigo-900 text-lg mb-4 flex items-center gap-2"><Moon className="w-5 h-5" /> Soir (PM)</h4>
            <div className="space-y-4">
              {recommendations.evening_routine?.map((step: any, idx: number) => (
                <div key={idx}>
                  <span className="text-[10px] uppercase font-black text-indigo-700 block">{step.step}</span>
                  <h5 className="font-black text-black">{step.name}</h5>
                  <p className="text-black mt-0.5 text-sm font-medium">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <h3 className="font-black text-2xl mb-6 mt-90 text-cyan-900 border-b-2 border-cyan-100 pb-2">4. Guide des Ingrédients</h3>
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-200">
            <h4 className="font-black text-emerald-900 mb-3 flex items-center gap-2"><ThumbsUp className="w-4 h-4" /> À Privilégier</h4>
            <div className="flex flex-wrap gap-2">
              {recommendations.ingredients_to_seek?.map((ing: string, i: number) => (
                <span key={i} className="text-sm px-3 py-1 rounded-lg bg-emerald-100 text-emerald-950 font-bold">{ing}</span>
              ))}
            </div>
          </div>
          <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-200">
            <h4 className="font-black text-rose-900 mb-3 flex items-center gap-2"><ThumbsDown className="w-4 h-4" /> À Éviter</h4>
            <div className="flex flex-wrap gap-2">
              {recommendations.ingredients_to_avoid?.map((ing: string, i: number) => (
                <span key={i} className="text-sm px-3 py-1 rounded-lg bg-rose-100 text-rose-950 font-bold">{ing}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Verification */}
        {data.luna_verification && (
          <div>
            <h3 className="font-black text-2xl mb-6 text-cyan-900 border-b-2 border-cyan-100 pb-2">5. Contrôle de Cohérence </h3>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <p className="font-black text-black mb-2">Statut : {String(data.luna_verification.consistency).toUpperCase()}</p>
              <p className="text-black font-medium mb-4">
                {Array.isArray(data.luna_verification.discrepancies)
                  ? data.luna_verification.discrepancies.join(' ')
                  : data.luna_verification.discrepancies}
              </p>
              {data.luna_verification.summary && (
                <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-950 font-bold">
                  {data.luna_verification.summary}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
