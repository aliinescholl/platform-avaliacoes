import {
  Leader,
  SubordinateStatus,
  QuestionDefinition,
  ScoreScaleInfo,
  EvaluationCreate,
  EvaluationResponse,
  OrgTreeNode
} from '../types';

const API_BASE = '/api';

export const getStoredLeaderId = (): number | null => {
  const val = localStorage.getItem('active_leader_id');
  return val ? parseInt(val, 10) : null;
};

export const setStoredLeaderId = (id: number): void => {
  localStorage.setItem('active_leader_id', id.toString());
  // Also set cookie for redundancy as suggested in requirement
  document.cookie = `leader_id=${id}; path=/; max-age=2592000; SameSite=Lax`;
};

const getHeaders = (): HeadersInit => {
  const leaderId = getStoredLeaderId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (leaderId) {
    headers['X-Leader-Id'] = leaderId.toString();
  }
  return headers;
};

export const api = {
  async getLeaders(): Promise<Leader[]> {
    const res = await fetch(`${API_BASE}/leaders`);
    if (!res.ok) throw new Error('Falha ao buscar lista de líderes');
    return res.json();
  },

  async getCurrentLeaderMe(): Promise<Leader> {
    const res = await fetch(`${API_BASE}/leaders/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Falha ao buscar líder ativo');
    }
    return res.json();
  },

  async getHierarchyTree(): Promise<OrgTreeNode> {
    const res = await fetch(`${API_BASE}/leaders/hierarchy-tree`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Falha ao carregar organograma');
    return res.json();
  },

  async getSubordinates(period?: string): Promise<SubordinateStatus[]> {
    const url = period ? `${API_BASE}/subordinates?period=${encodeURIComponent(period)}` : `${API_BASE}/subordinates`;
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Falha ao buscar subordinados');
    }
    return res.json();
  },

  async getQuestions(): Promise<QuestionDefinition[]> {
    const res = await fetch(`${API_BASE}/questions`);
    if (!res.ok) throw new Error('Falha ao carregar questões');
    return res.json();
  },

  async getScales(): Promise<ScoreScaleInfo[]> {
    const res = await fetch(`${API_BASE}/questions/scales`);
    if (!res.ok) throw new Error('Falha ao carregar escala de notas');
    return res.json();
  },

  async submitEvaluation(data: EvaluationCreate): Promise<EvaluationResponse> {
    const res = await fetch(`${API_BASE}/evaluations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Erro ao registrar avaliação');
    }
    return res.json();
  },

  async getEmployeeEvaluations(employeeId: number, period?: string): Promise<EvaluationResponse[]> {
    const url = period
      ? `${API_BASE}/evaluations/employee/${employeeId}?period=${encodeURIComponent(period)}`
      : `${API_BASE}/evaluations/employee/${employeeId}`;
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Erro ao obter histórico de avaliações');
    }
    return res.json();
  },

  async getEvaluationById(id: number): Promise<EvaluationResponse> {
    const res = await fetch(`${API_BASE}/evaluations/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Erro ao obter avaliação');
    }
    return res.json();
  }
};
