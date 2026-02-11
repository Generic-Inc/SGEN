from flask import request
from . import chat_blueprint
from modules.chat_model import ChatMessage

# Called when the website wants to SEE the chat history.
@chat_blueprint.route('/community/<int:community_id>/messages', methods=['GET'])
async def get_messages(community_id):
    messages = await ChatMessage.get_messages(community_id)

    return {"messages": [msg.public_json for msg in messages]}

# Called when a user clicks 'SEND' on the website.
@chat_blueprint.route('/community/<int:community_id>/messages', methods=['POST'])
async def create_message(community_id):
    data = request.get_json()

    if not data or "userId" not in data or "content" not in data:
        return {"error": "Missing userId or content"}, 400

    new_msg = await ChatMessage.create_message(
        community_id=community_id,
        author_id=data["userId"],
        content=data["content"])

    if new_msg:
        return new_msg.public_json

    return {"error": "Failed to create message"}, 500

# Called when a user EDITS a message. Method: Update
@chat_blueprint.route('/community/<int:community_id>/messages/<int:message_id>', methods=['PATCH'])
async def update_message(community_id, message_id):
    data = request.get_json()

    if not data or "content" not in data:
        return {"error": "New content is required"}, 400

    updated_msg = await ChatMessage.update_message(message_id, data["content"])

    if updated_msg:
        return updated_msg.public_json
    return {"error": "Message not found or update failed"}, 404

# Called when a user DELETES a message. Method: Delete
@chat_blueprint.route('/community/<int:community_id>/messages/<int:message_id>', methods=['DELETE'])
async def delete_message(community_id, message_id):
    success = await ChatMessage.delete_message(message_id)

    if success:
        return {"success": True}
    return {"error": "Failed to delete message"}, 500