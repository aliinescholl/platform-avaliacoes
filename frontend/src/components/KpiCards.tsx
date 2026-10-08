import React from 'react';
import { SubordinateStatus } from '../types';
import { Users, CheckCircle2, Clock, Award, TrendingUp } from 'lucide-react';

interface KpiCardsProps {
  subordinates: SubordinateStatus[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({ subordinates }) => {
  const total = subordinates.length;
  const directCount = subordinates.filter((s) => s.is_direct).length;
  const evaluatedByMe = subordinates.filter((s) => s.evaluated_by_current_leader_this_week).length;
  const pendingByMe = total - evaluatedByMe;

  // Calculate average of prevailing scores for this week
  const scoresWithValues = subordinates
    .map((s) => s.prevailing_score_this_week || s.latest_score)
    .filter((s): s is number => s !== null && s !== undefined);

  const avgScore =
    scoresWithValues.length > 0
      ? (scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length).toFixed(2)
      : 'N/A';

  const progressPercent = total > 0 ? Math.round((evaluatedByMe / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Subordinates */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total na Hierarquia
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{total}</span>
            <span className="text-xs font-medium text-slate-500">colaboradores</span>
          </div>
          <span className="text-xs text-indigo-600 font-medium mt-1 inline-block">
            {directCount} diretos • {total - directCount} indiretos
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Evaluated This Week */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Avaliados por Você (Semana)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600">{evaluatedByMe}</span>
            <span className="text-xs text-slate-400">de {total}</span>
          </div>
          <div className="w-32 bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>

      {/* Pending Evaluations */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pendentes por Você
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${pendingByMe > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {pendingByMe}
            </span>
            <span className="text-xs text-slate-500">nesta semana</span>
          </div>
          <span className="text-xs text-slate-400 mt-1 inline-block">
            {pendingByMe === 0 ? 'Toda a equipe avaliada! 🎉' : 'Aguardando sua nota'}
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      {/* Team Average Score */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Média da Equipe
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-indigo-700">{avgScore}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 4.00</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Escala ponderada 1-4</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <Award className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
