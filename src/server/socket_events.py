# socket_events.py
from flask_socketio import join_room, leave_room, emit
from extensions import socketio

# Store counts in memory: { '1': 5, '2': 3 } (Room ID: Count)
room_counts = {}


@socketio.on('join')
def handle_join(data):
    room = str(data.get('room'))
    join_room(room)

    # 1. Increment Count
    if room not in room_counts:
        room_counts[room] = 0
    room_counts[room] += 1

    # 2. Broadcast new count to everyone in the room
    # We send a specific event 'room_data' that React will listen for
    emit('room_data', {'count': room_counts[room]}, room=room)

    print(f"User joined room: {room} | Total: {room_counts[room]}")


@socketio.on('leave')
def handle_leave(data):
    room = str(data.get('room'))
    leave_room(room)

    # 3. Decrement Count
    if room in room_counts and room_counts[room] > 0:
        room_counts[room] -= 1

    # 4. Broadcast new count
    emit('room_data', {'count': room_counts[room]}, room=room)

    print(f"User left room: {room} | Total: {room_counts[room]}")