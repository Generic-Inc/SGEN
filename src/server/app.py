import asyncio
import os
import threading

from flask import Flask, render_template
from flask_cors import CORS

from global_src.constants import TEMPLATES_PATH, STATIC_PATH
from routing.api import api
from global_src.db import DATABASE
from config.config import CONFIG
from routing.pages import pages_blueprint

# --- 1. ADD THESE IMPORTS ---
from extensions import socketio  # Import the socket instance we created
import socket_events  # Import the events file so the handlers are registered

app = Flask(__name__,
            template_folder=TEMPLATES_PATH,
            static_folder=STATIC_PATH)
allowed_origins = [
    "http://localhost:5173",
    "https://nurturing-peace-production.up.railway.app"
]

CORS(app, origins=allowed_origins, supports_credentials=True)

socketio.init_app(
    app,
    cors_allowed_origins=allowed_origins
)



@app.before_request
async def startup():
    await DATABASE.initialize()
    await CONFIG.load_config()


def main():
    asyncio.run(startup())


if __name__ == '__main__':
    thread = threading.Thread(target=main, daemon=True)
    thread.start()

    print(f"Server running. Templates at: {TEMPLATES_PATH}")

    # --- 3. REPLACE APP.RUN WITH SOCKETIO.RUN ---
    # use_reloader=False is important to prevent the server from starting twice
    socketio.run(app, debug=True, use_reloader=False)