from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # /app

SERVER_PATH = BASE_DIR
CLIENT_PATH = BASE_DIR / "client"

DATABASE_FOLDER_PATH = BASE_DIR / "database"
DATABASE_FOLDER_PATH.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = DATABASE_FOLDER_PATH / "app.db"
SCHEMA_PATH = DATABASE_FOLDER_PATH / "schema.sql"
