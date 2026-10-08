from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import routes_leaders, routes_subordinates, routes_evaluations, routes_questions
from app.seeds.seed_data import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema exists and initial seed data is loaded
    try:
        init_db(seed_evaluations=True)
    except Exception as e:
        print(f"Aviso durante inicialização do banco: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    API REST para Plataforma Corporativa de Avaliação de Liderados.
    
    ### Principais Recursos e Regras de Negócio:
    - **Hierarquia Organizacional Dinâmica**: Líderes avaliam subordinados diretos e indiretos usando CTE recursivo.
    - **Pesos e Perguntas Institucionais**: 6 dimensões estratégicas com notas de 1 a 4.
    - **Frequência e Imutabilidade**: 1 avaliação por semana por par líder-liderado; respostas não podem ser editadas após submissão.
    - **Prevalência por Maior Hierarquia**: Quando múltiplos líderes avaliam o mesmo liderado na mesma semana, a avaliação do líder de maior hierarquia prevalece como a nota oficial.
    - **Segurança e Privacidade**: É rigorosamente vedado visualizar a própria avaliação, ou avaliações de pares e superiores.
    - **Contexto de Liderança Flexível**: Identificação via header `X-Leader-Id` ou cookie `leader_id`.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(routes_leaders.router, prefix=settings.API_V1_STR)
app.include_router(routes_subordinates.router, prefix=settings.API_V1_STR)
app.include_router(routes_evaluations.router, prefix=settings.API_V1_STR)
app.include_router(routes_questions.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "current_period": settings.get_current_period(),
        "docs": "/docs"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "timestamp": settings.get_current_period()}
