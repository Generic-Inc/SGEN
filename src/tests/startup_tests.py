import asyncio

from global_src.db import DATABASE


async def main():
    await DATABASE.initialize()
    print("Database initialized successfully.")
    tables = await DATABASE.fetch_all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'temp_%';")
    for table in tables:
        table_info = await DATABASE.fetch_one("PRAGMA table_info({})".format(table[0]))
        print(f"Table: {table[0]}, Info: {table_info}")

if __name__ == "__main__":
    asyncio.run(main())