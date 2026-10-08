import React from 'react';
import { QuestionDefinition, ScoreScaleInfo } from '../types';
import { HelpCircle, Award, CheckCircle2, Calculator } from 'lucide-react';

interface CriteriaGuideProps {
  questions: QuestionDefinition[];
  scales: ScoreScaleInfo[];
}

export const CriteriaGuide: React.FC<CriteriaGuideProps> = ({ questions, scales }) => {
  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Diretrizes de Avaliação & Pesos Oficiais
            </h3>
            <p className="text-xs text-slate-500">
              Conheça os pilares de avaliação, a fórmula da média ponderada e os critérios da escala 1 a 4.
            </p>
          </div>
        </div>

        {/* Weighted Formula Box */}
        <div className="mt-4 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-indigo-950 block">
                Fórmula de Cálculo da Nota Final Ponderada (1.00 a 4.00)
              </span>
              <p className="text-indigo-800/80 mt-0.5 font-mono text-[11px]">
                Nota = (25×Q1 + 20×Q2 + 20×Q3 + 15×Q4 + 10×Q5 + 10×Q6) ÷ 100
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block">
              Soma dos Pesos
            </span>
            <span className="text-xl font-extrabold text-indigo-900">100%</span>
          </div>
        </div>
      </div>

      {/* Grid: 6 Dimensions */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          <span>As 6 Dimensões de Performance</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questions.map((q, idx) => (
            <div
              key={q.key}
              className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400">Dimensão #{idx + 1}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800">
                    Peso {q.weight}%
                  </span>
                </div>
                <h5 className="font-bold text-slate-900 text-sm mb-1">{q.title}</h5>
                <p className="text-xs text-slate-500 leading-relaxed">{q.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scale 1-4 definitions */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          <span>Significado da Escala de Notas (1 a 4)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {scales.map((s) => {
            let bgClass = 'bg-rose-50 border-rose-200 text-rose-900';
            if (s.score === 2) bgClass = 'bg-amber-50 border-amber-200 text-amber-900';
            if (s.score === 3) bgClass = 'bg-blue-50 border-blue-200 text-blue-900';
            if (s.score === 4) bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-900';

            return (
              <div key={s.score} className={`p-4 rounded-2xl border ${bgClass}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-black">Nota {s.score}</span>
                  <span className="text-xs font-extrabold px-2 py-0.5 bg-white/80 rounded shadow-xs">
                    {s.label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">{s.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
