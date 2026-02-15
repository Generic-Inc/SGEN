from flask import request
from extensions import socketio

from global_src.global_classes import User, CommunityMember
from modules.authentications import Permissions
from . import chat_blueprint
from modules.chat_model import ChatMessage


# --- HELPER: Verify Auth & Membership ---
async def verify_user_and_membership(community_id):
    authorization = request.cookies.get('token')
    if not authorization:
        return None, None, "Unauthorized"

    user = await User.get_user_by_token(authorization)
    if not user:
        return None, None, "Unauthorized"

    community_member = await CommunityMember.get_member(user.user_id, community_id)
    if not community_member:
        return user, None, "Forbidden: Not a member"

    return user, community_member, None


# --- ROUTES ---

@chat_blueprint.route('/community/<int:community_id>/messages', methods=['GET'])
async def get_messages(community_id):
    user, member, error = await verify_user_and_membership(community_id)
    if error: return {"error": error}, 401 if "Unauthorized" in error else 403

    messages = await ChatMessage.get_messages(community_id)
    return {"messages": [msg.public_json for msg in messages]}


@chat_blueprint.route('/community/<int:community_id>/messages', methods=['POST'])
async def create_message(community_id):
    user, member, error = await verify_user_and_membership(community_id)
    if error: return {"error": error}, 401 if "Unauthorized" in error else 403

    # FIX 1: Unpack the tuple (bool, message) from requires_permissions
    has_perm, msg = member.requires_permissions(Permissions.CREATE_MESSAGES)
    if not has_perm:
        return {"error": f"Forbidden: {msg}"}, 403

    data = request.get_json()
    if not data or "content" not in data:
        return {"error": "Missing content"}, 400

    new_msg = await ChatMessage.create_message(
        community_id=community_id,
        author_id=user.user_id,
        content=data["content"]
    )

    if new_msg:
        socketio.emit('receive_message', new_msg.public_json, room=str(community_id))
        return new_msg.public_json

    return {"error": "Failed to create message"}, 500


@chat_blueprint.route('/community/<int:community_id>/messages/<int:message_id>', methods=['PATCH'])
async def update_message(community_id, message_id):
    user, member, error = await verify_user_and_membership(community_id)
    if error: return {"error": error}, 401 if "Unauthorized" in error else 403

    data = request.get_json()
    if not data or "content" not in data:
        return {"error": "New content is required"}, 400

    message = await ChatMessage.get_message(message_id)
    if not message:
        return {"error": "Message not found"}, 404

    if message.author.user_id != user.user_id:
        return {"error": "You can only edit your own messages"}, 403

    updated_msg = await ChatMessage.update_message(message_id, data["content"])

    # Optional: Broadcast the edit
    # socketio.emit('update_message', updated_msg.public_json, room=str(community_id))

    return updated_msg.public_json


@chat_blueprint.route('/community/<int:community_id>/messages/<int:message_id>', methods=['DELETE'])
async def delete_message(community_id, message_id):
    user, member, error = await verify_user_and_membership(community_id)
    if error: return {"error": error}, 401 if "Unauthorized" in error else 403

    message = await ChatMessage.get_message(message_id)
    if not message:
        return {"error": "Message not found"}, 404

    # FIX 2: Unpack the tuple here too
    is_author = message.author.user_id == user.user_id
    is_mod, _ = member.requires_permissions(Permissions.MANAGE_MESSAGES)

    if not (is_author or is_mod):
        return {"error": "Forbidden: You cannot delete this message"}, 403

    success = await ChatMessage.delete_message(message_id)

    if success:
        # Optional: Broadcast the delete so it vanishes for everyone
        # socketio.emit('delete_message', {'messageId': message_id}, room=str(community_id))
        return {"success": True}

    return {"error": "Failed to delete message"}, 500