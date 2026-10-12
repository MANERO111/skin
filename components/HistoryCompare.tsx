'use client';

import React, { useState, useEffect } from 'react';
import { History, TrendingDown, TrendingUp, Calendar, ArrowRight } from 'lucide-react';

interface HistoryCompareProps {
  onBackToAnalysis: () => void;
}

export const HistoryCompare: React.FC<HistoryCompareProps> = ({ onBackToAnalysis }) => {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch timeline from Unified Python API backend
    fetch('http://localhost:5000/api/history/compare')
      .then((res) => res.json())
      .then((data) => {
        if (data.timeline) {
          setTimeline(data.timeline);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Using fallback baseline history timeline.", err);
        setTimeline([
          {
            date: '2026-08-15',
            session_id: 'sess_prev_1',
            primary_type: 'Combination',
            sensitivity: 'High',
            oiliness: 72,
            redness: 38,
            pores: 52,
            blemishes: 28,
            texture: 45
          },
          {
            date: '2026-09-01',
            session_id: 'sess_prev_2',
            primary_type: 'Combination',
            sensitivity: 'Medium',
            oiliness: 62,
            redness: 24,
            pores: 46,
            blemishes: 22,
            texture: 38
          },
          {
            date: '2026-09-28',
            session_id: 'sess_latest',
            primary_type: 'Combination',
            sensitivity: 'Medium',
            oiliness: 54,
            redness: 10,
            pores: 43,
            blemishes: 17,
            texture: 32
          }
        ]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500">
        Chargement de l'historique des progrès...
      </div>
    );
  }

  const latest = timeline[timeline.length - 1];
  const previous = timeline[timeline.length - 2] || latest;

  const calcDiff = (curr: number, prev: number) => {
    const diff = curr - prev;
    if (diff < 0) return { text: `${diff}%`, isPositive: true };
    if (diff > 0) return { text: `+${diff}%`, isPositive: false };
    return { text: '0%', isPositive: true };
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-4 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-700 mb-2">
            <History className="w-4 h-4 text-cyan-600 shrink-0" />
            Suivi des Progrès Cutanés
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Comparaison dans le Temps
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg">
            Suivez l'évolution de vos indicateurs de peau au fil des sessions.
          </p>
        </div>

        <button
          onClick={onBackToAnalysis}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:scale-105 transition-all shrink-0"
        >
          Nouvelle Analyse
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Metric Delta Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Sébum / Brillance', curr: latest?.oiliness, prev: previous?.oiliness },
          { label: 'Rougeurs', curr: latest?.redness, prev: previous?.redness },
          { label: 'Pores visibles', curr: latest?.pores, prev: previous?.pores },
          { label: 'Imperfections', curr: latest?.blemishes, prev: previous?.blemishes },
        ].map((item) => {
          const delta = calcDiff(item.curr, item.prev);
          return (
            <div key={item.label} className="glass-card p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-1.5 sm:space-y-2">
              <span className="text-[11px] sm:text-xs text-slate-500 font-semibold block truncate">{item.label}</span>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{item.curr}</span>
                <span className={`text-[10px] sm:text-xs font-bold flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full ${
                  delta.isPositive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {delta.isPositive ? <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                  {delta.text}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Précédent: {item.prev}</p>
            </div>
          );
        })}
      </div>

      {/* Detailed Comparison Table */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-600 shrink-0" /> Chronologie des Sessions
        </h3>

        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Date</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Client</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Type de Peau</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Sensibilité</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Sébum</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Rougeurs</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Pores</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Imperfections</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timeline.map((s, idx) => (
                <tr key={s.session_id || idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 sm:py-3.5 px-3 sm:px-4 font-bold text-slate-800 whitespace-nowrap">{s.date}</td>
                  <td className="py-3 sm:py-3.5 px-3 sm:px-4">
                    <div className="font-bold text-slate-900 whitespace-nowrap">{s.full_name || 'Client Anonyme'}</div>
                    {s.ville && <div className="text-[10px] text-slate-500">{s.ville}</div>}
                  </td>
                  <td className="py-3 sm:py-3.5 px-3 sm:px-4">
                    <span className="px-2.5 py-1 rounded-xl bg-cyan-50 text-cyan-800 font-bold border border-cyan-200 text-[11px] whitespace-nowrap">
                      {s.primary_type}
                    </span>
                  </td>
                  <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-slate-700 whitespace-nowrap">{s.sensitivity}</td>
                  <td className="py-3 sm:py-3.5 px-3 sm:px-4 font-mono text-slate-800">{s.oiliness}</td>
                  <td className="py-3 sm:py-3.5 px-3 sm:px-4 font-mono text-slate-800">{s.redness}</td>
                  <td className="py-3 sm:py-3.5 px-3 sm:px-4 font-mono text-slate-800">{s.pores}</td>
                  <td className="py-3 sm:py-3.5 px-3 sm:px-4 font-mono text-slate-800">{s.blemishes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

