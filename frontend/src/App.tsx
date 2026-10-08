import React, { useEffect, useState } from 'react';
import { Leader, SubordinateStatus, QuestionDefinition, ScoreScaleInfo, EvaluationCreate } from './types';
import { api, getStoredLeaderId, setStoredLeaderId } from './services/api';
import { Navbar } from './components/Navbar';
import { KpiCards } from './components/KpiCards';
import { SubordinatesTable } from './components/SubordinatesTable';
import { LeaderSelectorModal } from './components/LeaderSelectorModal';
import { EvaluationModal } from './components/EvaluationModal';
import { EvaluationHistoryModal } from './components/EvaluationHistoryModal';
import { OrgTreeView } from './components/OrgTreeView';
import { CriteriaGuide } from './components/CriteriaGuide';
import { AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [currentLeader, setCurrentLeader] = useState<Leader | null>(null);
  const [subordinates, setSubordinates] = useState<SubordinateStatus[]>([]);
  const [questions, setQuestions] = useState<QuestionDefinition[]>([]);
  const [scales, setScales] = useState<ScoreScaleInfo[]>([]);

  const [activeTab, setActiveTab] = useState<'subordinates' | 'tree' | 'criteria'>('subordinates');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals
  const [isLeaderSelectorOpen, setIsLeaderSelectorOpen] = useState(false);
  const [evaluatingSubordinate, setEvaluatingSubordinate] = useState<SubordinateStatus | null>(null);
  const [historySubordinate, setHistorySubordinate] = useState<SubordinateStatus | null>(null);

  // Current ISO week
  const getCurrentPeriodString = () => {
    const d = new Date();
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  };

  const currentPeriod = getCurrentPeriodString();

  // Load initial data
  useEffect(() => {
    bootstrapApp();
  }, []);

  const bootstrapApp = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch questions and scales
      const [questionsData, scalesData, leadersData] = await Promise.all([
        api.getQuestions(),
        api.getScales(),
        api.getLeaders(),
      ]);

      setQuestions(questionsData);
      setScales(scalesData);
      setLeaders(leadersData);

      // 2. Resolve active leader
      let selectedId = getStoredLeaderId();
      if (!selectedId || !leadersData.some((l) => l.id === selectedId)) {
        // Default to Bob Sinclair (CTO, ID 2) or first leader
        const defaultLeader = leadersData.find((l) => l.id === 2) || leadersData.find((l) => l.is_leader) || leadersData[0];
        selectedId = defaultLeader.id;
        setStoredLeaderId(selectedId);
      }

      await switchLeader(selectedId, leadersData);
    } catch (err: any) {
      setError(err.message || 'Falha ao inicializar a aplicação.');
    } finally {
      setLoading(false);
    }
  };

  const switchLeader = async (leaderId: number, availableLeaders?: Leader[]) => {
    const list = availableLeaders || leaders;
    const ldr = list.find((l) => l.id === leaderId);
    if (ldr) {
      setCurrentLeader(ldr);
      setStoredLeaderId(leaderId);
    }

    try {
      const subs = await api.getSubordinates();
      setSubordinates(subs);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar equipe do líder.');
    }
  };

  const handleSelectLeader = async (leader: Leader) => {
    setLoading(true);
    await switchLeader(leader.id);
    setLoading(false);
    showToast(`Identidade alterada com sucesso para ${leader.name} (${leader.position_name})`);
  };

  const handleSubmitEvaluation = async (payload: EvaluationCreate) => {
    await api.submitEvaluation(payload);
    showToast('Avaliação semanal registrada com sucesso! As respostas foram salvas de forma imutável.');
    // Refresh subordinates list
    const subs = await api.getSubordinates();
    setSubordinates(subs);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        currentLeader={currentLeader}
        onOpenLeaderSelector={() => setIsLeaderSelectorOpen(true)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        currentPeriod={currentPeriod}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Leader Greeting / Banner */}
        <div className="mb-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold tracking-wide text-indigo-200 border border-white/10 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Painel de Gestão de Desempenho</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Olá, {currentLeader?.name || 'Líder'}!
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1.5 leading-relaxed">
              Você está visualizando a hierarquia como{' '}
              <strong>{currentLeader?.position_name}</strong> (Nível {currentLeader?.hierarchy_level}).
              Avalie seus liderados diretos e indiretos de acordo com os 6 critérios institucionais ponderados.
            </p>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 pointer-events-none">
            <ShieldCheck className="w-80 h-80 text-white" />
          </div>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="py-24 text-center">
            <span className="w-10 h-10 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin inline-block mb-3" />
            <h4 className="text-sm font-bold text-slate-700">Carregando dados da liderança...</h4>
            <p className="text-xs text-slate-400 mt-1">Sincronizando hierarquia e histórico de avaliações</p>
          </div>
        ) : (
          <>
            {activeTab === 'subordinates' && (
              <div>
                {/* KPI Cards */}
                <KpiCards subordinates={subordinates} />

                {/* Subordinates Table */}
                <SubordinatesTable
                  subordinates={subordinates}
                  onOpenEvaluationModal={(sub) => setEvaluatingSubordinate(sub)}
                  onOpenHistoryModal={(sub) => setHistorySubordinate(sub)}
                />
              </div>
            )}

            {activeTab === 'tree' && (
              <OrgTreeView currentLeaderName={currentLeader?.name || ''} />
            )}

            {activeTab === 'criteria' && (
              <CriteriaGuide questions={questions} scales={scales} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-400 mt-12">
        <p>
          Plataforma de Avaliação de Liderados • Sistema Corporativo de Avaliação Semanal & Gestão de Performance
        </p>
      </footer>

      {/* Modals */}
      <LeaderSelectorModal
        isOpen={isLeaderSelectorOpen}
        onClose={() => setIsLeaderSelectorOpen(false)}
        leaders={leaders}
        currentLeaderId={currentLeader?.id || null}
        onSelectLeader={handleSelectLeader}
      />

      <EvaluationModal
        isOpen={!!evaluatingSubordinate}
        onClose={() => setEvaluatingSubordinate(null)}
        subordinate={evaluatingSubordinate}
        questions={questions}
        currentPeriod={currentPeriod}
        onSubmit={handleSubmitEvaluation}
      />

      <EvaluationHistoryModal
        isOpen={!!historySubordinate}
        onClose={() => setHistorySubordinate(null)}
        subordinate={historySubordinate}
      />
    </div>
  );
};
