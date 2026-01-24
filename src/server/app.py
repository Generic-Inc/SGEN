import asyncio
import sys
import threading

from flask import Flask
from hypercorn.config import Config
from hypercorn.asyncio import serve
from asgiref.wsgi import WsgiToAsgi

from config.config import CONFIG
from global_src.db import DATABASE
from routing.api import api

app = Flask(__name__)
app.json.sort_keys = False
app.register_blueprint(api)


async def main():
    await DATABASE.initialize()
    asyncio.create_task(CONFIG.auto_reload())

def start_main():
    asyncio.run(main())

@app.route('/')
def test():
    return "yep, the root route works!"


if __name__ == '__main__':
    thread = threading.Thread(target=start_main)
    thread.start()
    app.run(use_reloader=False)
