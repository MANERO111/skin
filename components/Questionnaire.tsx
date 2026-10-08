'use client';

import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface QuestionnaireProps {
  questions: Array<{
    id: string;
    question: string;
    options: Array<{ value: string; label: string }>;
  }>;
  onSubmit: (answers: Record<string, string>) => void;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ questions, onSubmit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQ = questions[currentIndex];
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelect = (val: string) => {
    const updated = { ...answers, [currentQ.id]: val };
    setAnswers(updated);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onSubmit(answers);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const isCurrentAnswered = !!answers[currentQ.id];

  // Renders bilingual text (French on top, Arabic right below)
  const renderBilingual = (rawText: string, isTitle: boolean = false) => {
    const lines = rawText.split('\n');
    const frenchText = lines[0] || '';
    const arabicText = lines[1] || '';

    return (
      <div className="space-y-1">
        <div className={isTitle ? "text-lg sm:text-xl font-bold text-white leading-snug" : "text-sm font-medium text-slate-100"}>
          {frenchText}
        </div>
        {arabicText && (
          <div
            dir="rtl"
            className={
              isTitle
                ? "text-base sm:text-lg font-semibold text-cyan-300/90 leading-snug tracking-normal pt-1"
                : "text-xs font-semibold text-cyan-400/90 tracking-normal pt-0.5"
            }
          >
            {arabicText}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/80 shadow-2xl relative">
        {/* Header & Progress */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <Sparkles className="w-4 h-4" />
            Questionnaire de Routine / استبيان البشرة
          </div>
          <span className="text-xs font-bold text-slate-400">
            Question {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-2 mb-8 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>

        {/* Question Title */}
        <div className="mb-6">
          {renderBilingual(currentQ.question, true)}
          <p className="text-xs text-slate-400 mt-2">
            Complète votre analyse visuelle faciale à 3 angles (pesant pour 25% du résultat final).
          </p>
        </div>

        {/* Options Cards */}
        <div className="space-y-3 mb-8">
          {currentQ.options.map((opt) => {
            const isSelected = answers[currentQ.id] === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-400/80 text-white shadow-lg shadow-cyan-500/10 scale-[1.01]'
                    : 'glass-card border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="pr-4 flex-1">
                  {renderBilingual(opt.label, false)}
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-600'
                }`}>
                  {isSelected && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Toolbar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              currentIndex === 0
                ? 'opacity-30 cursor-not-allowed text-slate-600'
                : 'text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Précédent
          </button>

          <button
            onClick={handleNext}
            disabled={!isCurrentAnswered}
            className={`px-6 py-3 rounded-2xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all ${
              isCurrentAnswered
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 hover:scale-105 shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {currentIndex === questions.length - 1 ? 'Terminer & Lancer le diagnostic' : 'Question Suivante'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
