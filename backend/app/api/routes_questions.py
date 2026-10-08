from typing import List
from fastapi import APIRouter
from app.core.questions import QUESTIONS_CONFIG, SCORE_DESCRIPTIONS
from app.schemas.evaluation import QuestionDefinition, ScoreScaleInfo

router = APIRouter(prefix="/questions", tags=["Perguntas & Pesos"])

@router.get("", response_model=List[QuestionDefinition], summary="Listar questões e pesos da avaliação")
def get_questions():
    """
    Retorna as 6 perguntas institucionais com seus respectivos pesos percentuais:
    - Entrega de Resultados (25)
    - Execução e Qualidade do Trabalho (20)
    - Capacidade de Aprendizado e Desenvolvimento (20)
    - Resolução de Problemas e Pensamento Crítico (15)
    - Colaboração, Influência e Liderança (10)
    - Visão Estratégica e Potencial de Crescimento (10)
    """
    return [
        QuestionDefinition(
            key=q["key"],
            title=q["title"],
            weight=q["weight"],
            description=q["description"]
        )
        for q in QUESTIONS_CONFIG
    ]

@router.get("/scales", response_model=List[ScoreScaleInfo], summary="Listar escala de notas de 1 a 4")
def get_scales():
    """Retorna os significados da escala numérica inteira de 1 a 4."""
    return [
        ScoreScaleInfo(
            score=k,
            label=v["label"],
            description=v["description"]
        )
        for k, v in SCORE_DESCRIPTIONS.items()
    ]
