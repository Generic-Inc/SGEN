import asyncio
import os
import threading

from flask import Flask, render_template

from global_src.constants import TEMPLATES_PATH, STATIC_PATH
from routing.api import api
from global_src.db import DATABASE
from config.config import CONFIG

app = Flask(__name__,
            template_folder=TEMPLATES_PATH,
            static_folder=STATIC_PATH)

app.json.sort_keys = False
app.register_blueprint(api, url_prefix='/api')

@app.before_request
async def startup():
    await DATABASE.initialize()
    await CONFIG.load_config()

def main():
    asyncio.run(startup())
@app.route('/')
async def index():
    return render_template('index.html')

if __name__ == '__main__':
    thread = threading.Thread(target=main, daemon=True)
    thread.start()
    app.run(use_reloader=False, debug=True)
    print(f"Server running. Templates at: {TEMPLATES_PATH}")