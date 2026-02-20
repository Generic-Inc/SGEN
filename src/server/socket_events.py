# socket_events.py
from flask import request
from flask_socketio import join_room, emit
from extensions import socketio

# Store unique users in memory: { 'room_id': {user_id1, user_id2} }
room_users = {}
# Track which user_id is associated with each specific socket connection
socket_to_user = {}


@socketio.on('join')
def handle_join(data):
    room = str(data.get('room'))
    user_id = data.get('user_id')

    # Fix: Use getattr to bypass the IDE's "Unresolved attribute" warning
    sid = getattr(request, 'sid')

    join_room(room)

    if room not in room_users:
        room_users[room] = set()

    # Use the user_id if we have it; otherwise, use the sid as a guest ID
    effective_id = str(user_id) if user_id else f"guest_{sid}"
    room_users[room].add(effective_id)

    # Store this for the disconnect handler
    socket_to_user[sid] = {'user_id': effective_id, 'room': room}

    current_count = len(room_users[room])
    emit('room_data', {'count': current_count}, room=room)

    print(f"User {effective_id} joined room: {room} | Unique Online: {current_count}")


@socketio.on('disconnect')
def handle_disconnect():
    # Fix: Access the sid safely here too
    sid = getattr(request, 'sid')

    # Find the user info associated with this specific disconnected tab
    user_info = socket_to_user.pop(sid, None)

    if user_info:
        user_id = str(user_info['user_id'])
        room = user_info['room']

        # Check if the user has ANY other tabs open in this room
        other_connections = [info for info in socket_to_user.values()
                             if str(info['user_id']) == user_id and info['room'] == room]

        if not other_connections and room in room_users:
            room_users[room].discard(user_id)
            # Update everyone in the room with the new count
            emit('room_data', {'count': len(room_users[room])}, room=room)

    print(f"A connection was closed. Current socket tracking size: {len(socket_to_user)}")