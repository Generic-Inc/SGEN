from pathlib import Path

CONFIG_FOLDER_PATH = Path(__file__).parent.parent/ "config"
DATABASE_FOLDER_PATH = Path(__file__).parent.parent / "database"

CONFIG_PATH: Path = CONFIG_FOLDER_PATH / "config.json"
SCHEMA_PATH = DATABASE_FOLDER_PATH / "schema.sql"
DATABASE_PATH: Path = DATABASE_FOLDER_PATH / "app.db"
