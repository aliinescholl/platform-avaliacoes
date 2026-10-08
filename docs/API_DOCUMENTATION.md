# Documentação dos Endpoints REST

A API foi desenvolvida em Python 3.11+ utilizando o framework **FastAPI**, com tipagem estrita via **Pydantic v2**, documentação interativa OpenAPI/Swagger acessível em `/docs` e documentação ReDoc em `/redoc`.

---

## 1. Autenticação e Identificação da Liderança

Conforme especificação, a plataforma dispensa um fluxo de login tradicional e identifica a liderança ativa via:
1. **Header HTTP**: `X-Leader-Id: <id_do_lider>` (recomendado para integrações e frontend).
2. **Cookie**: `leader_id=<id_do_lider>` (armazenado automaticamente pelo navegador).
3. **Query Param**: `?current_leader_id=<id_do_lider>` (disponível para testes manuais no Swagger).

---

## 2. Sumário de Endpoints

| Método | Rota | Descrição | Autenticação Requerida |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/leaders` | Lista todos os colaboradores com metadados de liderança e nível hierárquico | Não |
| `GET` | `/api/leaders/me` | Obtém o perfil e estatísticas do líder ativo | **Sim** (`X-Leader-Id`) |
| `GET` | `/api/leaders/hierarchy-tree` | Retorna o organograma hierárquico em árvore do líder ativo | **Sim** (`X-Leader-Id`) |
| `GET` | `/api/subordinates` | Lista todos os subordinados (diretos e indiretos) com status da semana | **Sim** (`X-Leader-Id`) |
| `POST` | `/api/evaluations` | Submete uma nova avaliação semanal de desempenho | **Sim** (`X-Leader-Id`) |
| `GET` | `/api/evaluations/employee/{id}` | Consulta o histórico de avaliações de um subordinado | **Sim** (`X-Leader-Id`) |
| `GET` | `/api/evaluations/{id}` | Consulta uma avaliação específica por ID | **Sim** (`X-Leader-Id`) |
| `GET` | `/api/questions` | Retorna as 6 questões oficiais e seus pesos percentuais | Não |
| `GET` | `/api/questions/scales` | Retorna os descritores da escala de notas (1 a 4) | Não |

---

## 3. Detalhamento dos Endpoints

### 3.1. `GET /api/leaders`
Lista todos os funcionários cadastrados no banco de dados, enriquecidos com seu nível na hierarquia corporativa e contagem de subordinados diretos e indiretos.

#### Resposta de Sucesso (`200 OK`):
```json
[
  {
    "id": 1,
    "name": "Alice Hartman",
    "email": "alice.hartman@company.com",
    "position_name": "CEO",
    "hierarchy_level": 1,
    "direct_subordinates_count": 4,
    "total_subordinates_count": 19,
    "is_leader": true
  },
  {
    "id": 2,
    "name": "Bob Sinclair",
    "email": "bob.sinclair@company.com",
    "position_name": "CTO",
    "hierarchy_level": 2,
    "direct_subordinates_count": 5,
    "total_subordinates_count": 11,
    "is_leader": true
  }
]
```

---

### 3.2. `GET /api/subordinates`
Retorna todos os colaboradores que pertencem à hierarquia do líder ativo (diretos e indiretos).

#### Headers Requeridos:
- `X-Leader-Id: 2` (Exemplo: Bob Sinclair - CTO)

#### Query Parameters:
- `period` *(opcional, string)*: Semana no formato ISO `YYYY-Www` (ex: `2026-W41`). Se omitido, assume a semana corrente.

#### Resposta de Sucesso (`200 OK`):
```json
[
  {
    "id": 4,
    "name": "David Okafor",
    "email": "david.okafor@company.com",
    "position_name": "Engineering Manager",
    "depth": 1,
    "is_direct": true,
    "direct_leader_id": 2,
    "direct_leader_name": "Bob Sinclair",
    "hierarchy_level": 3,
    "evaluated_by_current_leader_this_week": false,
    "current_leader_evaluation_id": null,
    "prevailing_score_this_week": null,
    "prevailing_leader_name_this_week": null,
    "prevailing_leader_level_this_week": null,
    "prevailing_evaluation_id_this_week": null,
    "latest_score": null,
    "latest_period": null,
    "latest_evaluator_name": null,
    "total_evaluations_count": 0
  },
  {
    "id": 10,
    "name": "James Watanabe",
    "email": "james.watanabe@company.com",
    "position_name": "Software Engineer",
    "depth": 3,
    "is_direct": false,
    "direct_leader_id": 8,
    "direct_leader_name": "Henry Patel",
    "hierarchy_level": 5,
    "evaluated_by_current_leader_this_week": false,
    "current_leader_evaluation_id": null,
    "prevailing_score_this_week": 3.65,
    "prevailing_leader_name_this_week": "David Okafor",
    "prevailing_leader_level_this_week": 3,
    "prevailing_evaluation_id_this_week": 2,
    "latest_score": 3.65,
    "latest_period": "2026-W41",
    "latest_evaluator_name": "David Okafor",
    "total_evaluations_count": 2
  }
]
```

---

### 3.3. `POST /api/evaluations`
Registra a avaliação oficial para um colaborador da hierarquia do líder ativo.

#### Headers Requeridos:
- `X-Leader-Id: 4`

#### Request Body:
```json
{
  "lead_id": 8,
  "period": "2026-W41",
  "feedback": "Excelente desempenho técnico no sprint.",
  "answers": [
    {
      "question_key": "results_delivery",
      "score": 4,
      "comment": "Superou as metas do trimestre."
    },
    {
      "question_key": "execution_quality",
      "score": 4,
      "comment": "Código limpo e alta cobertura de testes."
    },
    {
      "question_key": "learning_capacity",
      "score": 3,
      "comment": "Boa assimilação das novidades da stack."
    },
    {
      "question_key": "problem_solving",
      "score": 3
    },
    {
      "question_key": "collaboration_leadership",
      "score": 4,
      "comment": "Excelente mentoria para novos contratados."
    },
    {
      "question_key": "strategic_vision",
      "score": 3
    }
  ]
}
```

#### Resposta de Sucesso (`201 Created`):
```json
{
  "id": 5,
  "leader_id": 4,
  "leader_name": "David Okafor",
  "leader_position": "Engineering Manager",
  "leader_hierarchy_level": 3,
  "lead_id": 8,
  "lead_name": "Henry Patel",
  "lead_position": "Senior Software Engineer",
  "period": "2026-W41",
  "final_score": 3.55,
  "feedback": "Excelente desempenho técnico no sprint.",
  "created_at": "2026-10-08T13:30:00Z",
  "is_prevailing": true,
  "answers": [
    {
      "id": 25,
      "question_key": "results_delivery",
      "question_title": "Entrega de Resultados",
      "weight": 25,
      "score": 4,
      "comment": "Superou as metas do trimestre."
    }
  ]
}
```

#### Possíveis Erros:
- `400 Bad Request`: Autoavaliação, nota fora do intervalo [1..4] ou menos de 6 questões enviadas.
- `403 Forbidden`: Colaborador não pertence à hierarquia do líder.
- `409 Conflict`: O líder já avaliou este colaborador no período semanal indicado (frequência máxima: 1 por semana).

---

### 3.4. `GET /api/evaluations/employee/{employee_id}`
Consulta o histórico de avaliações de um subordinado.

#### Regras de Segurança:
- Se `current_leader_id == employee_id` $\rightarrow$ **`403 Forbidden`** (vedado ver a própria avaliação).
- Se `employee_id` for superior ou par $\rightarrow$ **`403 Forbidden`** (vedado ver pares ou superiores).
- Se `employee_id` for subordinado (direto ou indireto) $\rightarrow$ **`200 OK`**.

#### Identificação de Prevalência Hierárquica:
No JSON de retorno, o atributo `"is_prevailing": true` indica qual avaliação prevaleceu no período com base na maior hierarquia.
