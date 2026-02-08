
import json

class ConfigRoot:
    def __init__(self):
        pass

import asyncio
import json
from typing import Optional

import aiohttp

from global_src.constants import CONFIG_PATH

class ConfigRoot:
    def __init__(self):
        self.config: Optional[dict] = None

    @property
    def default(self) -> dict:
        return self.config["default"]

    @property
    def default_user(self) -> dict:
        return self.default["user"]

    @property
    def default_community(self) -> dict:
        return self.default["community"]

    async def load_config(self) -> dict:
        """Reloads the config from the remote URL specified in the local config file"""
        with open(CONFIG_PATH, "r") as f:
            local_config = json.load(f)
        config_url = local_config["configUrl"]
        async with aiohttp.ClientSession() as session:
            async with session.get(config_url) as response:
                response.raise_for_status()
                self.config = await response.json(content_type=None)
        return self.config

    async def auto_reload(self) -> None:
        """Automatically reloads the config every 5 minutes, this should only be run as a separate task"""
        while True:
            await self.load_config()
            await asyncio.sleep(300)

CONFIG = ConfigRoot()