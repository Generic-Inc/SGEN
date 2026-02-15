from pathlib import Path
import os

# Use the absolute path of the current working directory (which is /app on Railway)
SRC_PATH = Path(os.getcwd())
print(SRC_PATH)
SERVER_PATH = SRC_PATH
CLIENT_PATH = SRC_PATH / "client"

# Ensure the database folder actually exists before SQLite tries to write to it
DATABASE_FOLDER_PATH = SERVER_PATH / "database"
DATABASE_FOLDER_PATH.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = DATABASE_FOLDER_PATH / "app.db"
# ... rest of your paths

CONFIG_FOLDER_PATH = SERVER_PATH / "config"
DATABASE_FOLDER_PATH = SERVER_PATH / "database"

CONFIG_PATH: Path = CONFIG_FOLDER_PATH / "config.json"
SCHEMA_PATH = DATABASE_FOLDER_PATH / "schema.sql"

STATIC_PATH = CLIENT_PATH / "static"
TEMPLATES_PATH = CLIENT_PATH / "templates"
print(STATIC_PATH)
print(TEMPLATES_PATH)