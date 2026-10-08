import os
from datetime import datetime
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Plataforma de Avaliação de Liderados"
    API_V1_STR: str = "/api"
    # Default to local sqlite file if DATABASE_URL is not set
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./evaluations.db")
    CORS_ORIGINS: list[str] = ["*"]

    @staticmethod
    def get_current_period() -> str:
        """Returns current ISO week in format YYYY-Www, e.g. 2026-W41"""
        now = datetime.now()
        year, week, _ = now.isocalendar()
        return f"{year}-W{week:02d}"

settings = Settings()
