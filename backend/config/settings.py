from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    
    # JWT Settings
    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = ["ppt", "pptx", "pdf"]
    
    # Model Settings
    MODEL_PATH: str = "models/gesture_model.pth"
    GESTURE_CLASSES: List[str] = [
        "next_slide",
        "previous_slide",
        "pointer",
        "draw",
        "erase",
        "highlight",
        "stop",
        "zoom_in",
        "zoom_out",
        "first_slide",
        "last_slide",
        "undo",
        "redo",
        "save"
    ]
    
    # Gesture Recognition
    MIN_DETECTION_CONFIDENCE: float = 0.7
    MIN_TRACKING_CONFIDENCE: float = 0.7
    
    # Training
    BATCH_SIZE: int = 32
    LEARNING_RATE: float = 0.001
    NUM_EPOCHS: int = 50
    
    class Config:
        env_file = ".env"

settings = Settings()

