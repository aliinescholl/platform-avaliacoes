export interface Leader {
  id: number;
  name: string;
  email: string;
  position_name: string;
  hierarchy_level: number;
  direct_subordinates_count: number;
  total_subordinates_count: number;
  is_leader: boolean;
}

export interface SubordinateStatus {
  id: number;
  name: string;
  email: string;
  position_name: string;
  depth: number;
  is_direct: boolean;
  direct_leader_id: number | null;
  direct_leader_name: string | null;
  hierarchy_level: number;
  evaluated_by_current_leader_this_week: boolean;
  current_leader_evaluation_id: number | null;
  prevailing_score_this_week: number | null;
  prevailing_leader_name_this_week: string | null;
  prevailing_leader_level_this_week: number | null;
  prevailing_evaluation_id_this_week: number | null;
  latest_score: number | null;
  latest_period: string | null;
  latest_evaluator_name: string | null;
  total_evaluations_count: number;
}

export interface QuestionDefinition {
  key: string;
  title: string;
  weight: number;
  description: string;
}

export interface ScoreScaleInfo {
  score: number;
  label: string;
  description: string;
}

export interface EvaluationAnswerCreate {
  question_key: string;
  score: number;
  comment?: string;
}

export interface EvaluationCreate {
  lead_id: number;
  period?: string;
  feedback?: string;
  answers: EvaluationAnswerCreate[];
}

export interface EvaluationAnswerResponse {
  id: number;
  question_key: string;
  question_title: string;
  weight: number;
  score: number;
  comment?: string;
}

export interface EvaluationResponse {
  id: number;
  leader_id: number;
  leader_name: string;
  leader_position: string;
  leader_hierarchy_level: number;
  lead_id: number;
  lead_name: string;
  lead_position: string;
  period: string;
  final_score: number;
  feedback?: string;
  created_at: string;
  is_prevailing: boolean;
  answers: EvaluationAnswerResponse[];
}

export interface OrgTreeNode {
  id: number;
  name: string;
  email: string;
  position_name: string;
  hierarchy_level: number;
  is_direct: boolean;
  depth: number;
  subordinates: OrgTreeNode[];
}
