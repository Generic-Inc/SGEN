import asyncio
import json
from pprint import pprint

from ..configfiles.config import CONFIG
from global_src.db import DATABASE


async def main():
    await DATABASE.initialize()
    print("Database initialized successfully.")
    tables = await DATABASE.fetch_all(
        "SELECT name FROM sqlite_master WHERE type='table';")
    pprint(tables)
    for table in tables:
        table_name = table[0]
        schema = await DATABASE.fetch_all("PRAGMA table_info(%s);" % table_name)
        print(f"Schema for table '{table_name}': {json.dumps(schema)}")
        rows = await DATABASE.fetch_all(f"SELECT * FROM {table_name} LIMIT 5;")
        pprint(f"Sample data from table '{table_name}': {json.dumps(rows)}")
    print("*" * 20)
    config_stuff = await CONFIG.load_config()
    print(config_stuff)

if __name__ == "__main__":
    asyncio.run(main())