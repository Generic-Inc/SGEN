import asyncio
import sys
import threading

from flask import Flask, render_template

from config.config import CONFIG
from global_src.db import DATABASE
import os
from routing.api import api

app = Flask(__name__)
app.json.sort_keys = False
app.register_blueprint(api)


async def main():
    await DATABASE.initialize()
    await CONFIG.load_config()
    asyncio.create_task(CONFIG.auto_reload())

def start_main():
    asyncio.run(main())

@app.route('/')
async def index():
    return render_template('index.html')

if __name__ == '__main__':
    thread = threading.Thread(target=start_main, daemon=True)
    thread.start()
    app.run(use_reloader=False)
