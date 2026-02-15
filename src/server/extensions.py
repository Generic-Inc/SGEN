# extensions.py
from flask_socketio import SocketIO

# Initialize the socket instance
socketio = SocketIO(cors_allowed_origins="*")