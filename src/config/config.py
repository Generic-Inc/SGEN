import asyncio
import json
from pathlib import Path
from typing import Optional

import aiohttp

CONFIG_PATH: dict = Path(__file__).parent / "config.json"

class ConfigRoot:
    def __init__(self):
        self.config: Optional[dict] = None

    async def load_config(self) -> dict:
        """Reloads the config from the remote URL specified in the local config file"""
        with open(CONFIG_PATH, "r") as f:
            local_config = json.load(f)
        config_url = local_config["configUrl"]
        async with aiohttp.ClientSession() as session:
            async with session.get(config_url) as response:
                self.config = await response.json()
        return self.config

    async def auto_reload(self) -> None:
        """Automatically reloads the config every 5 minutes, this should only be run as a seperate task"""
        while True:
            await self.load_config()
            await asyncio.sleep(300)


CONFIG = ConfigRoot()