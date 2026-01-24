from flask import request
from . import chat_blueprint
from modules.chat_model import ChatMessage

# ==========================================
# GROUP 1: HANDLING THE LIST OF MESSAGES
# URL Example: /api/community/1/messages
# ==========================================

@chat_blueprint.route('/community/<int:community_id>/messages', methods=['GET'])
async def get_community_messages(community_id):
    """
    Called when the website wants to SEE the chat history.
    """
    # 1. Ask the Model to get the data
    messages = await ChatMessage.get_messages(community_id)

    # 2. Loop through the results and convert them to JSON format
    return {"messages": [msg.public_json for msg in messages]}


@chat_blueprint.route('/community/<int:community_id>/messages', methods=['POST'])
async def post_message(community_id):
    """
    Called when a user clicks 'SEND' on the website.
    """
    # 1. Get the data sent by the user (JSON body)
    data = request.get_json()

    # 2. Validation: Ensure they actually sent the necessary info
    if not data or "userId" not in data or "content" not in data:
        return {"error": "Missing userId or content"}, 400

    # 3. Ask the Model to create the new message
    new_msg = await ChatMessage.create_message(
        community_id=community_id,
        author_id=data["userId"],
        content=data["content"]
    )

    if new_msg:
        return new_msg.public_json
    return {"error": "Failed to create message"}, 500


# ==========================================
# GROUP 2: HANDLING A SPECIFIC MESSAGE
# URL Example: /api/community/1/messages/55
# ==========================================

@chat_blueprint.route('/community/<int:community_id>/messages/<int:message_id>', methods=['PATCH'])
async def edit_message(community_id, message_id):
    """
    Called when a user EDITS a message.
    Method: PATCH (used for partial updates)
    """
    data = request.get_json()

    # 1. Check if they sent new text
    if not data or "content" not in data:
        return {"error": "New content is required"}, 400

    # 2. Ask the Model to update the specific message ID
    updated_msg = await ChatMessage.update_message(message_id, data["content"])

    if updated_msg:
        return updated_msg.public_json
    return {"error": "Message not found or update failed"}, 404


@chat_blueprint.route('/community/<int:community_id>/messages/<int:message_id>', methods=['DELETE'])
async def remove_message(community_id, message_id):
    """
    Called when a user DELETES a message.
    Method: DELETE
    """
    # 1. Ask the Model to delete the specific message ID
    success = await ChatMessage.delete_message(message_id)

    if success:
        return {"success": True}
    return {"error": "Failed to delete message"}, 500