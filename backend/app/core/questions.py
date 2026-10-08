from typing import Dict, List, Any

QUESTIONS_CONFIG: List[Dict[str, Any]] = [
    {
        "key": "results_delivery",
        "title": "Entrega de Resultados",
        "weight": 25,
        "description": "Capacidade de cumprir prazos, atingir metas pactuadas e gerar impacto tangível para o negócio."
    },
    {
        "key": "execution_quality",
        "title": "Execução e Qualidade do Trabalho",
        "weight": 20,
        "description": "Atenção a detalhes, robustez técnica, conformidade com padrões e baixa taxa de retrabalho."
    },
    {
        "key": "learning_capacity",
        "title": "Capacidade de Aprendizado e Desenvolvimento",
        "weight": 20,
        "description": "Abertura para novos conhecimentos, assimilação rápida de feedbacks e busca contínua por aprimoramento."
    },
    {
        "key": "problem_solving",
        "title": "Resolução de Problemas e Pensamento Crítico",
        "weight": 15,
        "description": "Habilidade para analisar cenários complexos, diagnosticar causas-raiz e propor soluções pragmáticas."
    },
    {
        "key": "collaboration_leadership",
        "title": "Colaboração, Influência e Liderança",
        "weight": 10,
        "description": "Trabalho em equipe, comunicação assertiva, engajamento positivo e capacidade de inspirar colegas."
    },
    {
        "key": "strategic_vision",
        "title": "Visão Estratégica e Potencial de Crescimento",
        "weight": 10,
        "description": "Compreensão do impacto do seu trabalho no ecossistema da empresa e prontidão para assumir maiores desafios."
    }
]

SCORE_DESCRIPTIONS: Dict[int, Dict[str, str]] = {
    1: {
        "label": "Abaixo do Esperado",
        "description": "Apresenta lacunas relevantes nas entregas e necessita de acompanhamento constante."
    },
    2: {
        "label": "Em Desenvolvimento",
        "description": "Atende parcialmente aos requisitos, demonstrando evolução, mas ainda sem consistência plena."
    },
    3: {
        "label": "Atende ao Esperado",
        "description": "Cumpre consistentemente as expectativas e padrões de excelência com autonomia."
    },
    4: {
        "label": "Supera Expectativas",
        "description": "Performance diferenciada, referência técnica/comportamental, gera impacto acima do previsto."
    }
}
