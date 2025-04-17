from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Transcript Editor"

    # OpenAI Settings
    OPENAI_API_KEY: Optional[str] = None

    # Google AI Settings
    GOOGLE_API_KEY: Optional[str] = None

    # Database Settings
    DATABASE_URL: str = "sqlite:///./transcript_editor.db"

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()

# --- DEBUGGING: Print the loaded OpenAI key ---
# !!! REMOVE THIS AFTER DEBUGGING !!!
print(f"DEBUG: Loaded OPENAI_API_KEY: '{settings.OPENAI_API_KEY}'")
# ------------------------------------------
