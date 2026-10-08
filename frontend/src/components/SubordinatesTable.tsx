import React, { useState } from 'react';
import { SubordinateStatus } from '../types';
import {
  Search,
  CheckCircle2,
  Clock,
  Eye,
  PlusCircle,
  Crown,
  Network
} from 'lucide-react';

interface SubordinatesTableProps {
  subordinates: SubordinateStatus[];
  onOpenEvaluationModal: (subordinate: SubordinateStatus) => void;
  onOpenHistoryModal: (subordinate: SubordinateStatus) => void;
}

export const SubordinatesTable: React.FC<SubordinatesTableProps> = ({
  subordinates,
  onOpenEvaluationModal,
  onOpenHistoryModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'direct' | 'indirect' | 'pending' | 'evaluated'>('all');

  const filtered = subordinates.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.position_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.direct_leader_name && s.direct_leader_name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'direct') return s.is_direct;
    if (filterType === 'indirect') return !s.is_direct;
    if (filterType === 'pending') return !s.evaluated_by_current_leader_this_week;
    if (filterType === 'evaluated') return s.evaluated_by_current_leader_this_week;

    return true;
  });

  const getScoreBadge = (score: number | null) => {
    if (score === null || score === undefined) {
      return (
        <span className="text-xs text-slate-400 font-medium italic">Sem avaliações</span>
      );
    }
    let colorClass = 'bg-slate-100 text-slate-700';
    if (score >= 3.5) colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    else if (score >= 2.8) colorClass = 'bg-indigo-100 text-indigo-800 border-indigo-200';
    else if (score >= 2.0) colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
    else colorClass = 'bg-rose-100 text-rose-800 border-rose-200';

    return (
      <div className="flex items-center gap-1.5">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${colorClass} shadow-xs`}>
          {score.toFixed(2)} ★
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por colaborador, cargo ou líder direto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({subordinates.length})
          </button>

          <button
            onClick={() => setFilterType('direct')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'direct'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Diretos ({subordinates.filter((s) => s.is_direct).length})
          </button>

          <button
            onClick={() => setFilterType('indirect')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'indirect'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Indiretos ({subordinates.filter((s) => !s.is_direct).length})
          </button>

          <button
            onClick={() => setFilterType('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-amber-700 hover:bg-slate-200'
            }`}
          >
            Pendentes ({subordinates.filter((s) => !s.evaluated_by_current_leader_this_week).length})
          </button>

          <button
            onClick={() => setFilterType('evaluated')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'evaluated'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-emerald-700 hover:bg-slate-200'
            }`}
          >
            Avaliados ({subordinates.filter((s) => s.evaluated_by_current_leader_this_week).length})
          </button>
        </div>
      </div>

      {/* Table Content */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">Nenhum liderado encontrado</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Tente ajustar os termos de busca ou remover os filtros aplicados.'
              : 'Este líder não possui subordinados sob sua hierarquia.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5">Colaborador (Avaliado)</th>
                <th className="py-3 px-4">Relacionamento Hierárquico</th>
                <th className="py-3 px-4">Sua Avaliação (Semana)</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1 text-slate-600 font-extrabold">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>Nota Oficial Prevalente</span>
                  </div>
                </th>
                <th className="py-3 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((sub) => {
                const alreadyEvaluated = sub.evaluated_by_current_leader_this_week;
                return (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Employee Identifiers */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-100 border border-slate-200 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {sub.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{sub.name}</span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              ID: #{sub.id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <span className="font-medium text-slate-700">{sub.position_name}</span>
                            <span>•</span>
                            <span className="text-slate-400">{sub.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Hierarchy Relationship */}
                    <td className="py-4 px-4">
                      {sub.is_direct ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Liderado Direto
                        </div>
                      ) : (
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Network className="w-3 h-3" />
                            Indireto (Nível {sub.depth})
                          </div>
                          {sub.direct_leader_name && (
                            <div className="text-[11px] text-slate-400 mt-1">
                              Via: <span className="font-medium text-slate-600">{sub.direct_leader_name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Current Leader Weekly Status */}
                    <td className="py-4 px-4">
                      {alreadyEvaluated ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-100 w-fit">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Concluída por você</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 w-fit">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Pendente por você</span>
                        </div>
                      )}
                    </td>

                    {/* Prevailing Hierarchy Evaluation */}
                    <td className="py-4 px-4">
                      {sub.prevailing_score_this_week ? (
                        <div>
                          {getScoreBadge(sub.prevailing_score_this_week)}
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate max-w-[180px]">
                              Por: <strong className="text-slate-700">{sub.prevailing_leader_name_this_week}</strong>
                              {sub.prevailing_leader_level_this_week && (
                                <span className="text-[10px] text-indigo-600 ml-1">
                                  (Nvl {sub.prevailing_leader_level_this_week})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      ) : sub.latest_score ? (
                        <div>
                          {getScoreBadge(sub.latest_score)}
                          <div className="text-[11px] text-slate-400 mt-1">
                            Semana anterior ({sub.latest_period})
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Nenhuma ainda</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* History & Answers button */}
                        <button
                          onClick={() => onOpenHistoryModal(sub)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
                          title="Ver respostas cadastradas e histórico de avaliações"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Histórico</span>
                        </button>

                        {/* Evaluate button */}
                        {alreadyEvaluated ? (
                          <button
                            disabled
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed flex items-center gap-1.5"
                            title="Você já avaliou este colaborador nesta semana (1 avaliação por semana)"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Avaliado</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenEvaluationModal(sub)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-200 transition-all flex items-center gap-1.5 group-hover:scale-105"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Avaliar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Info Banner */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>
            <strong>Regra de Negócio:</strong> Líderes podem avaliar liderados diretos e indiretos. Apenas avaliações da sua própria hierarquia são visíveis.
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Mostrando {filtered.length} de {subordinates.length} liderados
        </div>
      </div>
    </div>
  );
};
