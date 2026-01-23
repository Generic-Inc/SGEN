from flask import request

from global_src.global_classes import Community, User
from . import community_blueprint

@community_blueprint.route('/', methods=['POST'])
async def create_community():
    if request.method == "POST":
        data = request.get_json()
        if not data: return {"error": "No data"}, 400
        community_name = data.get("communityName")
        display_name = data.get("displayName")
        description = data.get("description")
        icon_url = data.get("iconUrl")
        posts_guidelines = data.get("postsGuidelines")
        messages_guidelines = data.get("messagesGuidelines")
        offline_text = data.get("offlineText")
        online_text = data.get("onlineText")

        if not "communityName" in data: return {"error": "No community name"}, 400
        if not "displayName" in data: return {"error": "No display name"}, 400
        if not "description" in data: return {"error": "No description"}, 400
        if not "iconUrl" in data: return {"error": "No icon url"}, 400
        if not "description" in data: return {"error": "No description"}, 400
        if not "iconUrl" in data: return {"error": "No icon url"}, 400
        if not "postsGuidelines" in data: return {"error": "No posts guidelines"}, 400
        if not "messagesGuidelines" in data: return {"error": "No messages guidelines"}, 400
        if not "offlineText" in data: return {"error": "No offline text"}, 400
        if not "onlineText" in data: return {"error": "No online text"}, 400


        owner = await User.get_user(user_id=data["userId"])
        community_post = await Community.create_community(
            community_name=community_name,
            display_name=display_name,
            owner=owner,
            description=description,
            icon_url=icon_url,
            post_guidelines=posts_guidelines,
            messages_guidelines=messages_guidelines,
            offline_text=offline_text,
            online_text=online_text,
        )
        if not community_post:
            return {"error": "Invalid data or community exist"}, 400
        else:
            return community_post.public_json

@community_blueprint.route("/<int:community_id>", methods=["GET","DELETE"])
async def get_community(community_id: int):
    """Get a community's public information by their community ID"""
    community_get = await Community.get_community(community_id)
    if request.method == "GET":
        if not community_get:
            return {"error": "Community not found"}, 404
        return community_get.public_json
    elif request.method == "DELETE":
        check = await community_get.delete_community()
        if not check: return {"error": "Community never existed"}
        return {"success": True}


@community_blueprint.route("/<int:community_id>/members", methods=["GET", "POST", "DELETE"])
async def get_community_members(community_id: int):
    """
    GET: Get a list of members in a community by the community ID
    POST: join a community by the community ID
    """
    community_get = await Community.get_community(community_id)
    if not community_get:
        return {"error": "Community not found"}, 404
    if request.method == "GET":
        members = await community_get.get_members()
        return {"members": [i.public_json for i in members]}
    elif request.method == "POST":
        try:
            data = request.get_json()
            user_id = data.get("userId")
            user_get = await User.get_user(user_id)
            if not user_get:
                return {"error": "User not found"}, 404
            await community_get.add_member(user_id)
            members = await community_get.get_members()
            return {"members": [i.public_json for i in members]}
        except Exception as e:
            return {"error": e}, 500
    elif request.method == "DELETE":
        try:
            data = request.get_json()
            user_id = data.get("userId")
            members = await community_get.delete_member(user_id)
            return {"members": [i.public_json for i in members]}
        except Exception as e:
            return {"error": e}, 500

            


