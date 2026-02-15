from pathlib import Path

SRC_PATH = Path(__file__).resolve().parent.parent.parent
SERVER_PATH = SRC_PATH / "server"
CLIENT_PATH = SRC_PATH / "client"

CONFIG_FOLDER_PATH = SERVER_PATH / "config"
DATABASE_FOLDER_PATH = SERVER_PATH / "database"

# 🔥 THIS LINE FIXES EVERYTHING
DATABASE_FOLDER_PATH.mkdir(parents=True, exist_ok=True)

CONFIG_PATH: Path = CONFIG_FOLDER_PATH / "config.json"
SCHEMA_PATH = DATABASE_FOLDER_PATH / "schema.sql"
DATABASE_PATH: Path = DATABASE_FOLDER_PATH / "app.db"

STATIC_PATH = CLIENT_PATH / "static"
TEMPLATES_PATH = CLIENT_PATH / "templates"
