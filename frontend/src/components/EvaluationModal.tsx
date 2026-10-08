import React, { useState } from 'react';
import { SubordinateStatus, QuestionDefinition, EvaluationCreate } from '../types';
import {
  X,
  AlertTriangle,
  Award,
  Send,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  subordinate: SubordinateStatus | null;
  questions: QuestionDefinition[];
  currentPeriod: string;
  onSubmit: (payload: EvaluationCreate) => Promise<void>;
}

const SCALE_DESCRIPTIONS: Record<number, { label: string; desc: string; color: string }> = {
  1: {
    label: 'Abaixo do Esperado',
    desc: 'Necessita de acompanhamento contínuo e evolução imediata.',
    color: 'border-rose-300 hover:border-rose-400 text-rose-700 bg-rose-50/50',
  },
  2: {
    label: 'Em Desenvolvimento',
    desc: 'Atende parcialmente, demonstrando evolução mas sem consistência.',
    color: 'border-amber-300 hover:border-amber-400 text-amber-700 bg-amber-50/50',
  },
  3: {
    label: 'Atende ao Esperado',
    desc: 'Cumpre com consistência as entregas com qualidade e autonomia.',
    color: 'border-blue-300 hover:border-blue-400 text-blue-700 bg-blue-50/50',
  },
  4: {
    label: 'Supera Expectativas',
    desc: 'Referência no time, gera impacto notório além do pactuado.',
    color: 'border-emerald-300 hover:border-emerald-400 text-emerald-700 bg-emerald-50/50',
  },
};

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  subordinate,
  questions,
  currentPeriod,
  onSubmit,
}) => {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !subordinate) return null;

  const handleScoreSelect = (questionKey: string, score: number) => {
    setScores((prev) => ({ ...prev, [questionKey]: score }));
  };

  const handleCommentChange = (questionKey: string, text: string) => {
    setComments((prev) => ({ ...prev, [questionKey]: text }));
  };

  // Calculate live weighted score
  const answeredCount = Object.keys(scores).length;
  const isAllAnswered = answeredCount === questions.length;

  let liveScore = 0;
  if (answeredCount > 0) {
    let weightedSum = 0;
    let currentWeightSum = 0;
    questions.forEach((q) => {
      const s = scores[q.key];
      if (s !== undefined) {
        weightedSum += s * q.weight;
        currentWeightSum += q.weight;
      }
    });
    liveScore = currentWeightSum > 0 ? Number((weightedSum / currentWeightSum).toFixed(2)) : 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllAnswered) {
      setErrorMessage('Por favor, atribua nota para todas as 6 questões obrigatórias.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const answersPayload = questions.map((q) => ({
        question_key: q.key,
        score: scores[q.key],
        comment: comments[q.key]?.trim() || undefined,
      }));

      await onSubmit({
        lead_id: subordinate.id,
        period: currentPeriod,
        answers: answersPayload,
        feedback: generalFeedback.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao registrar avaliação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Avaliar Desempenho: {subordinate.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
                  {subordinate.is_direct ? 'Liderado Direto' : `Indireto (Nível ${subordinate.depth})`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {subordinate.position_name} • {subordinate.email} • Período: <strong className="text-indigo-600">{currentPeriod}</strong>
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

        {/* Warning Alert: Immutability */}
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-6 py-3 flex items-center gap-3 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Atenção às regras de envio:</strong> As respostas são <strong>imutáveis</strong> após a submissão e não poderão ser alteradas. É permitida exatamente <strong>uma avaliação por semana</strong> para este colaborador.
          </span>
        </div>

        {/* Scrollable Questions Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Questions list */}
          <div className="space-y-6">
            {questions.map((q, idx) => {
              const currentScore = scores[q.key];
              return (
                <div
                  key={q.key}
                  className={`p-5 rounded-2xl border transition-all ${
                    currentScore
                      ? 'border-indigo-200 bg-white shadow-xs'
                      : 'border-slate-200/80 bg-slate-50/30'
                  }`}
                >
                  {/* Question header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{q.title}</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 self-start sm:self-auto">
                      Peso: {q.weight}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 ml-8">{q.description}</p>

                  {/* 1-4 scale choices */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {[1, 2, 3, 4].map((val) => {
                      const isSelected = currentScore === val;
                      const scale = SCALE_DESCRIPTIONS[val];
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleScoreSelect(q.key, val)}
                          className={`p-3 rounded-xl border text-left transition-all relative ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                              : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-base font-extrabold ${
                                isSelected ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              Nota {val}
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <div
                            className={`text-xs font-semibold ${
                              isSelected ? 'text-indigo-100' : 'text-slate-800'
                            }`}
                          >
                            {scale.label}
                          </div>
                          <div
                            className={`text-[10px] mt-1 leading-snug line-clamp-2 ${
                              isSelected ? 'text-indigo-200' : 'text-slate-400'
                            }`}
                          >
                            {scale.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional comment for this dimension */}
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Observações específicas para esta competência (opcional)..."
                      value={comments[q.key] || ''}
                      onChange={(e) => handleCommentChange(q.key, e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* General Feedback Textarea */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Feedback Geral e Recomendações de Desenvolvimento (Opcional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Descreva pontos fortes, oportunidades de evolução, alinhamentos de expectativas e próximos passos..."
              value={generalFeedback}
              onChange={(e) => setGeneralFeedback(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </form>

        {/* Modal Footer with Live Score and Submit Button */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Live Calculated Score */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nota Ponderada Calculada
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-indigo-600">
                    {liveScore > 0 ? liveScore.toFixed(2) : '--'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ 4.00</span>
                </div>
              </div>
              <div className="text-right pl-3 border-l border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 block">Progresso</span>
                <span className="text-xs font-bold text-slate-700">
                  {answeredCount} de {questions.length} respondidas
                </span>
              </div>
            </div>

            {!isAllAnswered && (
              <span className="text-xs text-amber-600 hidden md:inline">
                Responda todas as 6 para habilitar o envio
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleSubmit}
              disabled={!isAllAnswered || isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all ${
                isAllAnswered && !isSubmitting
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:scale-102 cursor-pointer'
                  : 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submeter Avaliação Oficial</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
