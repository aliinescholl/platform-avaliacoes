import React, { useEffect, useState } from 'react';
import { SubordinateStatus, EvaluationResponse } from '../types';
import { api } from '../services/api';
import {
  X,
  History,
  Crown,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

interface EvaluationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  subordinate: SubordinateStatus | null;
}

export const EvaluationHistoryModal: React.FC<EvaluationHistoryModalProps> = ({
  isOpen,
  onClose,
  subordinate,
}) => {
  const [evaluations, setEvaluations] = useState<EvaluationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  useEffect(() => {
    if (isOpen && subordinate) {
      loadHistory();
    }
  }, [isOpen, subordinate]);

  const loadHistory = async () => {
    if (!subordinate) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEmployeeEvaluations(subordinate.id);
      setEvaluations(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar histórico de avaliações.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !subordinate) return null;

  // Periods available
  const periods = Array.from(new Set(evaluations.map((e) => e.period)));

  const filteredEvals =
    selectedPeriod === 'all'
      ? evaluations
      : evaluations.filter((e) => e.period === selectedPeriod);

  // Group by period to detect and highlight multiple evaluations in the same week
  const groupedByPeriod: Record<string, EvaluationResponse[]> = {};
  filteredEvals.forEach((e) => {
    groupedByPeriod[e.period] = groupedByPeriod[e.period] || [];
    groupedByPeriod[e.period].push(e);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Histórico de Avaliações: {subordinate.name}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  ID #{subordinate.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {subordinate.position_name} • {subordinate.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hierarchy Precedence Principle Banner */}
        <div className="bg-indigo-50/80 border-b border-indigo-100 px-6 py-3 flex items-center gap-3 text-indigo-900 text-xs">
          <Crown className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Princípio da Maior Hierarquia:</strong> Quando mais de um líder avalia o funcionário no mesmo período semanal, a nota e respostas cadastradas pelo líder de <strong>maior hierarquia (menor nível numérico na árvore)</strong> prevalecem como a nota oficial.
          </span>
        </div>

        {/* Filter controls */}
        {periods.length > 1 && (
          <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Filtrar por período:</span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedPeriod('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  selectedPeriod === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({evaluations.length})
              </button>
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    selectedPeriod === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <span className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin inline-block mb-3" />
              <p className="text-sm">Carregando avaliações...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : filteredEvals.length === 0 ? (
            <div className="py-16 text-center">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhuma avaliação encontrada</p>
              <p className="text-xs text-slate-400 mt-1">
                Este colaborador ainda não possui avaliações cadastradas na sua hierarquia.
              </p>
            </div>
          ) : (
            Object.entries(groupedByPeriod).map(([period, periodEvals]) => {
              const hasMultiple = periodEvals.length > 1;
              return (
                <div key={period} className="space-y-4">
                  {/* Period Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-slate-900 text-sm">
                        Período Semanal: <span className="text-indigo-600">{period}</span>
                      </h4>
                      {hasMultiple && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {periodEvals.length} avaliações concorrentes registradas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Evaluations list for this period */}
                  <div className="space-y-4">
                    {periodEvals.map((ev) => {
                      const isPrevailing = ev.is_prevailing;
                      return (
                        <div
                          key={ev.id}
                          className={`rounded-2xl border transition-all overflow-hidden ${
                            isPrevailing
                              ? 'border-indigo-300 ring-2 ring-indigo-500/10 bg-white shadow-sm'
                              : 'border-slate-200/90 bg-slate-50/50'
                          }`}
                        >
                          {/* Card Header */}
                          <div
                            className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isPrevailing
                                ? 'bg-gradient-to-r from-indigo-50/90 to-white border-indigo-100'
                                : 'bg-slate-100/60 border-slate-200/80'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                  isPrevailing
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {ev.leader_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">
                                    {ev.leader_name}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200 shadow-xs">
                                    Nível Hierárquico {ev.leader_hierarchy_level}
                                  </span>
                                  {isPrevailing && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 shadow-xs">
                                      <Crown className="w-3 h-3 text-amber-600" />
                                      Prevalente (Maior Hierarquia)
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {ev.leader_position} • Enviada em{' '}
                                  {new Date(ev.created_at).toLocaleString('pt-BR')}
                                </div>
                              </div>
                            </div>

                            {/* Score badge */}
                            <div className="text-right">
                              <div className="flex items-baseline gap-1 justify-end">
                                <span className="text-2xl font-black text-indigo-700">
                                  {ev.final_score.toFixed(2)}
                                </span>
                                <span className="text-xs text-slate-400 font-bold">/ 4.00</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                Nota Ponderada
                              </span>
                            </div>
                          </div>

                          {/* Answers breakdown table */}
                          <div className="p-4">
                            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Respostas por Competência</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {ev.answers.map((ans) => (
                                <div
                                  key={ans.id}
                                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start justify-between gap-3 text-xs"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800 block">
                                      {ans.question_title}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                      Peso: {ans.weight}%
                                    </span>
                                    {ans.comment && (
                                      <p className="text-[11px] text-slate-600 italic mt-1 bg-white p-1.5 rounded border border-slate-100">
                                        "{ans.comment}"
                                      </p>
                                    )}
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-extrabold text-xs shadow-xs">
                                      Nota {ans.score}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* General feedback if present */}
                            {ev.feedback && (
                              <div className="mt-3 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs">
                                <span className="font-bold text-indigo-900 flex items-center gap-1 mb-1">
                                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Feedback e Observações Gerais do Líder</span>
                                </span>
                                <p className="text-slate-700 whitespace-pre-wrap">{ev.feedback}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Respostas registradas no banco de dados e imutáveis.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
