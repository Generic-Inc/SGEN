import asyncio
import os
import threading

from flask import Flask, render_template
from routing.api import api
from global_src.db import DATABASE
from config.config import CONFIG
base_dir = os.path.dirname(os.path.abspath(__file__))
client_folder = os.path.abspath(os.path.join(base_dir, "..", "client"))
template_folder = os.path.join(client_folder, "templates")
static_folder = os.path.join(client_folder, "static")
app = Flask(__name__,
            template_folder=template_folder,
            static_folder=static_folder)

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
    print(f"Server running. Templates at: {template_folder}")