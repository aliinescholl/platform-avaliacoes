import React, { useState } from 'react';
import { Leader } from '../types';
import { UserCheck, Shield, Users, Search, X, Check, ArrowRight } from 'lucide-react';

interface LeaderSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaders: Leader[];
  currentLeaderId: number | null;
  onSelectLeader: (leader: Leader) => void;
}

export const LeaderSelectorModal: React.FC<LeaderSelectorModalProps> = ({
  isOpen,
  onClose,
  leaders,
  currentLeaderId,
  onSelectLeader,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyLeaders, setOnlyLeaders] = useState(true);

  if (!isOpen) return null;

  const filteredLeaders = leaders.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.position_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = onlyLeaders ? l.is_leader : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Shield className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">Alternar Identidade de Liderança</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Simule o acesso como qualquer líder da organização para visualizar e avaliar apenas sua respectiva hierarquia.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, cargo ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex gap-2">
              <button
                onClick={() => setOnlyLeaders(true)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  onlyLeaders
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Líderes com Equipe ({leaders.filter((l) => l.is_leader).length})
              </button>
              <button
                onClick={() => setOnlyLeaders(false)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  !onlyLeaders
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({leaders.length})
              </button>
            </div>
            <span className="text-slate-400">
              {filteredLeaders.length} colaboradores listados
            </span>
          </div>
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-2">
          {filteredLeaders.map((leader) => {
            const isSelected = leader.id === currentLeaderId;
            return (
              <div
                key={leader.id}
                onClick={() => {
                  onSelectLeader(leader);
                  onClose();
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-50/80 border border-indigo-200'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {leader.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{leader.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Nível {leader.hierarchy_level}
                      </span>
                      {leader.position_name.includes('CEO') && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                          Topo Org
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{leader.position_name}</span>
                      <span>•</span>
                      <span className="text-slate-400">{leader.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {leader.is_leader ? (
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-semibold text-indigo-700 justify-end">
                        <Users className="w-3.5 h-3.5" />
                        <span>{leader.total_subordinates_count} liderados</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        ({leader.direct_subordinates_count} diretos)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Sem subordinados</span>
                  )}

                  <div className="w-7 h-7 flex items-center justify-center">
                    {isSelected ? (
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-300 hover:text-indigo-600" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>A identidade é salva no LocalStorage e no cookie `leader_id`.</span>
          </div>
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
