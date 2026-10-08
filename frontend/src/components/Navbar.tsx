import React from 'react';
import { Leader } from '../types';
import { Shield, ChevronDown, Calendar, Users, GitBranch, HelpCircle } from 'lucide-react';

interface NavbarProps {
  currentLeader: Leader | null;
  onOpenLeaderSelector: () => void;
  activeTab: 'subordinates' | 'tree' | 'criteria';
  onChangeTab: (tab: 'subordinates' | 'tree' | 'criteria') => void;
  currentPeriod: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLeader,
  onOpenLeaderSelector,
  activeTab,
  onChangeTab,
  currentPeriod,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  Avalia<span className="text-indigo-600">Leader</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Performance & Hierarquia
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-6">
              <button
                onClick={() => onChangeTab('subordinates')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'subordinates'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Minha Equipe</span>
              </button>

              <button
                onClick={() => onChangeTab('tree')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'tree'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                <span>Organograma</span>
              </button>

              <button
                onClick={() => onChangeTab('criteria')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'criteria'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Critérios & Pesos</span>
              </button>
            </nav>
          </div>

          {/* Right Section: Period & Leader Switcher */}
          <div className="flex items-center gap-3">
            {/* Current Period Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Semana: <span className="text-indigo-700">{currentPeriod}</span></span>
            </div>

            {/* Leader Switcher Button */}
            <button
              onClick={onOpenLeaderSelector}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentLeader
                  ? currentLeader.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                  : 'L'}
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {currentLeader?.name || 'Selecionar Líder'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                    Nível {currentLeader?.hierarchy_level ?? '-'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1">
                  {currentLeader?.position_name || 'Clique para escolher'}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors ml-1" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-100 py-2">
          <button
            onClick={() => onChangeTab('subordinates')}
            className={`flex items-center gap-1.5 text-xs font-medium py-1 px-3 rounded-lg ${
              activeTab === 'subordinates' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Equipe</span>
          </button>
          <button
            onClick={() => onChangeTab('tree')}
            className={`flex items-center gap-1.5 text-xs font-medium py-1 px-3 rounded-lg ${
              activeTab === 'tree' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Organograma</span>
          </button>
          <button
            onClick={() => onChangeTab('criteria')}
            className={`flex items-center gap-1.5 text-xs font-medium py-1 px-3 rounded-lg ${
              activeTab === 'criteria' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Critérios</span>
          </button>
        </div>
      </div>
    </header>
  );
};
