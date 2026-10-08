import React, { useEffect, useState } from 'react';
import { OrgTreeNode } from '../types';
import { api } from '../services/api';
import { GitBranch, User, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

interface OrgTreeViewProps {
  currentLeaderName: string;
}

export const OrgTreeView: React.FC<OrgTreeViewProps> = ({ currentLeaderName }) => {
  const [treeData, setTreeData] = useState<OrgTreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTree();
  }, [currentLeaderName]);

  const loadTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHierarchyTree();
      setTreeData(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar organograma.');
    } finally {
      setLoading(false);
    }
  };

  const TreeNode: React.FC<{ node: OrgTreeNode; isRoot?: boolean }> = ({ node, isRoot = false }) => {
    const [collapsed, setCollapsed] = useState(false);
    const hasChildren = node.subordinates && node.subordinates.length > 0;

    return (
      <div className="flex flex-col items-start space-y-2">
        <div
          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
            isRoot
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-200'
              : node.is_direct
              ? 'bg-white border-emerald-300 shadow-xs'
              : 'bg-white border-slate-200/90 shadow-xs'
          }`}
        >
          {hasChildren && !isRoot && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
              isRoot ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {node.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${isRoot ? 'text-white' : 'text-slate-900'}`}>
                {node.name}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isRoot
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                Nível {node.hierarchy_level}
              </span>
              {!isRoot && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    node.is_direct
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {node.is_direct ? 'Direto' : `Profundidade ${node.depth}`}
                </span>
              )}
            </div>
            <div className={`text-xs ${isRoot ? 'text-indigo-100' : 'text-slate-500'} mt-0.5`}>
              {node.position_name} • {node.email}
            </div>
          </div>
        </div>

        {/* Children list */}
        {hasChildren && !collapsed && (
          <div className="pl-6 border-l-2 border-indigo-200/60 ml-5 space-y-3 mt-2">
            {node.subordinates.map((child) => (
              <TreeNode key={child.id} node={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            <span>Organograma Hierárquico</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Visualização em árvore da cadeia de comando a partir do líder ativo.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Liderado Direto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-400" />
            <span className="text-slate-600">Liderado Indireto</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <span className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin inline-block mb-3" />
          <p className="text-sm">Construindo visualização da árvore...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : !treeData || treeData.subordinates.length === 0 ? (
        <div className="py-12 text-center">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Sem subordinados para exibir</p>
          <p className="text-xs text-slate-400 mt-1">
            O colaborador selecionado não possui liderados cadastrados no organograma.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto p-2">
          <TreeNode node={treeData} isRoot={true} />
        </div>
      )}
    </div>
  );
};
