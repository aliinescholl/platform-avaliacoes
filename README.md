# 🌟 Plataforma Corporativa de Avaliação de Liderados

Plataforma web *full-stack* desenvolvida para possibilitar que líderes avaliem o desempenho de colaboradores que fazem parte da sua hierarquia organizacional (diretos e indiretos), respeitando rigorosas regras de governança, imutabilidade, ponderação de pesos institucionais e privacidade de dados.

---

## 🎯 Sumário dos Recursos Implementados

- **Hierarquia Dinâmica (Grafo Organizacional)**:
  - Avaliação de liderados diretos e indiretos utilizando *Common Table Expressions* (CTE recursivo SQL).
  - Visualização em organograma navegável e interativo.
- **Pesos e Dimensões Oficiais**:
  - Respostas inteiras na escala de **1 a 4** com pesos percentuais totalizando 100%:
    1. *Entrega de Resultados* (Peso: 25%)
    2. *Execução e Qualidade do Trabalho* (Peso: 20%)
    3. *Capacidade de Aprendizado e Desenvolvimento* (Peso: 20%)
    4. *Resolução de Problemas e Pensamento Crítico* (Peso: 15%)
    5. *Colaboração, Influência e Liderança* (Peso: 10%)
    6. *Visão Estratégica e Potencial de Crescimento* (Peso: 10%)
- **Frequência e Imutabilidade**:
  - Permitida exatamente **1 avaliação por semana** para cada par líder-liderado.
  - Respostas **imutáveis**: uma vez submetidas, não podem ser alteradas.
- **Prevalência por Maior Hierarquia**:
  - Líderes superiores podem avaliar os liderados dos seus subordinados, mesmo que o subordinado já o tenha avaliado no período.
  - A nota e respostas cadastradas exibidas respeitam sempre o líder de **maior hierarquia corporativa** (precedência institucional).
- **Segurança & Privacidade Rigorosa**:
  - É estritamente vedado ao usuário visualizar a sua própria avaliação (HTTP 403).
  - É vedado visualizar avaliações de seus pares e superiores (HTTP 403).
  - Visibilidade concedida unicamente sobre a cadeia de subordinados.
- **Simulação Ágil de Lideranças**:
  - Seletor de liderança com 1 clique (Alice - CEO, Bob - CTO, David - Eng Mgr, Carol - CFO, etc.) persistido via `localStorage` e cookies, injetando o cabeçalho `X-Leader-Id`.

---

## 🏗️ Arquitetura e Fluxo do Sistema

```mermaid
flowchart LR
    subgraph Frontend["Frontend (React 18 + TypeScript + Tailwind)"]
        UI["Interface SPA (:3000)"]
        Context["Contexto de Liderança (LocalStorage / Cookie)"]
        Tree["Organograma & Matriz de Avaliação"]
    end

    subgraph Backend["Backend (Python 3.11 + FastAPI)"]
        Router["API Endpoints (/api/...)"]
        Security["Middleware de Segurança & Validação de Acesso"]
        Engine["Engine Hierárquico (Recursive CTE)"]
        Scoring["Cálculo Ponderado & Prevalência"]
    end

    subgraph Database["Banco Relacional (PostgreSQL 16 / SQLite)"]
        EmpTable[("employee (20 colaboradores)")]
        LeadTable[("leader_lead (Relacionamentos)")]
        EvalTable[("evaluation + evaluation_answer")]
    end

    UI -->|HTTP Requests + X-Leader-Id| Router
    Router --> Security
    Security --> Engine
    Security --> Scoring
    Engine -->|Queries Parametrizadas| LeadTable
    Engine -->|Queries Parametrizadas| EmpTable
    Scoring -->|Transações Atômicas| EvalTable
```

---

## 🚀 Como Executar o Projeto

Você pode executar o projeto de duas maneiras:
1. **Via Docker Compose** (recomendado para ambiente conteinerizado com PostgreSQL).
2. **Localmente / Nativo** (execução rápida com Python e Node.js).

---

### Opção 1: Execução com Docker Compose (1 Comando)

> **Pré-requisito**: Ter o [Docker](https://www.docker.com/) e Docker Compose instalados.

1. **Clone o repositório ou acesse a pasta do projeto**:
   ```bash
   cd platform-avaliacoes
   ```

2. **Inicie todos os serviços conteinerizados**:
   ```bash
   docker compose up --build
   ```

3. **Acesse as aplicações**:
   - **Frontend (Interface Web)**: [http://localhost:3000](http://localhost:3000)
   - **Backend API (Swagger Docs)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **PostgreSQL**: Porta `5432` (`user: postgres`, `password: postgres`, `db: evaluations_db`)

O Docker Compose sobe automaticamente:
- O banco PostgreSQL 16 já inicializado com o dump oficial dos 20 funcionários.
- O backend FastAPI conectado na mesma rede `evaluations-network`.
- O frontend React servido via Nginx com proxy reverso configurado.

Para parar os containers:
```bash
docker compose down
```

---

### Opção 2: Execução Local Nativa (Sem Docker)

> **Pré-requisitos**:
> - Python 3.10+ instalado
> - Node.js 18+ e npm instalados

#### 1. Configuração do Backend (FastAPI)

Abra um terminal na pasta do backend:
```bash
cd platform-avaliacoes/backend

# (Opcional) Crie e ative um ambiente virtual:
python -m venv venv
# No Windows:
.\venv\Scripts\activate
# No Linux/Mac:
source venv/bin/activate

# Instale as dependências:
pip install -r requirements.txt

# Inicialize o banco de dados e popule com o dump oficial:
python -m app.seeds.seed_data

# Inicie o servidor da API:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
A API estará rodando em: `http://localhost:8000` (Documentação Swagger: `http://localhost:8000/docs`).

#### 2. Configuração do Frontend (React + Vite)

Abra outro terminal na pasta do frontend:
```bash
cd platform-avaliacoes/frontend

# Instale as dependências:
npm install

# Inicie o servidor de desenvolvimento:
npm run dev
```
O frontend estará acessível em: `http://localhost:3000`.

---

## 🔑 Variáveis de Ambiente & Configurações

O projeto inclui um arquivo modelo `.env.example` na raiz:

```ini
# Configurações do Banco de Dados
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=evaluations_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# URL de Conexão com o Banco (PostgreSQL ou SQLite)
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/evaluations_db

# (Se omitido DATABASE_URL no backend nativo, o sistema utiliza automaticamente SQLite local 'evaluations.db' com zero dependências externas)
```

Para personalizar as credenciais:
```bash
cp .env.example .env
```

---

## 🧪 Execução da Suíte de Testes Automatizados

O backend conta com uma suíte de testes unitários e de integração utilizando `pytest`, cobrindo 100% dos requisitos de negócio e cenários de segurança:

```bash
cd platform-avaliacoes/backend
pytest -v
```

### Cenários Cobertos pelos Testes:
- [x] **`test_hierarchy_levels`**: Cálculo da profundidade e ranking hierárquico na árvore organizacional.
- [x] **`test_subordinates_traversal`**: Resolução completa de liderados diretos e indiretos via CTE recursivo.
- [x] **`test_successful_evaluation_submission`**: Cálculo da média ponderada oficial (pesos 25, 20, 20, 15, 10, 10).
- [x] **`test_evaluation_score_range_validation`**: Rejeição de notas fora do intervalo inteiro de 1 a 4.
- [x] **`test_evaluation_missing_questions_validation`**: Garantia de que todas as 6 questões são obrigatórias.
- [x] **`test_evaluation_frequency_limit_one_per_week`**: Rejeição com HTTP 409 de múltiplas avaliações na mesma semana para o mesmo par líder-liderado.
- [x] **`test_superior_leader_can_evaluate_indirect_subordinate`**: Permissão para superior avaliar subordinado do seu liderado no mesmo período.
- [x] **`test_highest_hierarchy_prevails`**: Validação de que a avaliação do líder de maior hierarquia corporativa prevalece como oficial.
- [x] **`test_user_cannot_evaluate_themselves`**: Bloqueio de autoavaliação (HTTP 400).
- [x] **`test_user_cannot_evaluate_superior_or_peer`**: Bloqueio de avaliação de superiores ou colegas (HTTP 403).
- [x] **`test_user_cannot_view_own_evaluation`**: Bloqueio estrito de visualização da própria nota (HTTP 403).
- [x] **`test_user_cannot_view_peer_evaluation`**: Bloqueio de visualização de avaliações de pares (HTTP 403).
- [x] **`test_user_cannot_view_superior_evaluation`**: Bloqueio de visualização de avaliações de superiores (HTTP 403).
- [x] **`test_user_can_view_direct_and_indirect_subordinates_evaluations`**: Garantia de visibilidade sobre a cadeia descendente.

---

## 👥 Como Alternar entre Líderes no Sistema

1. No canto superior direito da aplicação, clique no cartão de identificação do líder ativo.
2. O modal **"Alternar Identidade de Liderança"** será aberto, listando todos os 20 colaboradores.
3. Você pode filtrar por *Líderes com Equipe* ou pesquisar por nome/cargo:
   - **Alice Hartman (CEO)**: Vê toda a empresa (19 colaboradores).
   - **Bob Sinclair (CTO)**: Vê David, Eva, Grace, Quinn, Paul e toda a engenharia/dados.
   - **David Okafor (Eng Manager)**: Vê Henry, Liam, James e Karen.
   - **Henry Patel (Senior Software Engineer)**: Vê James e Karen.
   - **James Watanabe (Software Engineer)**: Vê 0 subordinados (demonstra tela sem equipe).
4. Ao clicar em qualquer colaborador, o sistema atualiza instantaneamente o `localStorage` e o cookie `leader_id`, recarregando o painel de acordo com a hierarquia daquele líder.

---

## 📚 Documentação Complementar

- [Arquitetura & Engenharia do Sistema](docs/ARCHITECTURE.md) (Modelagem, SQL CTE, Decisões Técnicas)
- [Documentação Completa da API REST](docs/API_DOCUMENTATION.md) (Exemplos de Request/Response e Schemas)
- [Documentos Pré-Desenvolvimento](docs/PRE_DEVELOPMENT.md) (Histórias de Usuário, Critérios de Aceite, Diagramas UML e ADRs)

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite.
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn, Pytest.
- **Banco de Dados**: PostgreSQL 16 (produção/Docker) & SQLite (desenvolvimento ágil sem dependências).
- **DevOps**: Docker, Docker Compose, Nginx (Reverse Proxy).
