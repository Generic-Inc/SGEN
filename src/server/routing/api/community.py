from flask import request

from config.config import CONFIG
from global_src.global_classes import Community, User
from . import community_blueprint

@community_blueprint.route('/', methods=['POST'])
async def create_community():
    authorization = request.headers.get('Authorization')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401
    communities = await user.get_communities_owned()
    if len(communities) >= CONFIG.config['limits']["max_owned_communities_per_user"]:
        return {"error": "Community creation limit reached"}, 403

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

        owner = user
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
            return {"error": "Invalid data or community already exists"}, 400
        else:
            return community_post.public_json

@community_blueprint.route("/<int:community_id>", methods=["GET", "PATCH", "DELETE"])
async def get_community(community_id: int):
    """Get a community's public information by their community ID"""
    community_get = await Community.get_community(community_id)
    if not community_get:
        return {"error": "Community not found"}, 404
    if request.method == "GET":
        return community_get.public_json
    elif request.method == "PATCH":
        authorization = request.headers.get('Authorization')
        if not authorization:
            return {"error": "Unauthorized"}, 401
        user = await User.get_user_by_token(authorization)
        if not user:
            return {"error": "Unauthorized"}, 401
        community = await Community.get_community(community_id)
        if community.owner.user_id != user.user_id:
            return {"error": "Unauthorized"}, 403

        data = request.get_json()
        kwargs = {}
        if "displayName" in data:
            kwargs["display_name"] = data["displayName"]
        if "description" in data:
            kwargs["description"] = data["description"]
        if "iconUrl" in data:
            kwargs["icon_url"] = data["iconUrl"]
        if "postsGuidelines" in data:
            kwargs["posts_guidelines"] = data["postsGuidelines"]
        if "messagesGuidelines" in data:
            kwargs["messages_guidelines"] = data["messagesGuidelines"]
        if "offlineText" in data:
            kwargs["offline_text"] = data["offlineText"]
        if "onlineText" in data:
            kwargs["online_text"] = data["onlineText"]

        community_update = await community_get.update_community(community_id, **kwargs)
        return community_update.public_json

    elif request.method == "DELETE":
        authorization = request.headers.get('Authorization')
        if not authorization:
            return {"error": "Unauthorized"}, 401
        user = await User.get_user_by_token(authorization)
        if not user:
            return {"error": "Unauthorized"}, 401
        community = await Community.get_community(community_id)
        if community.owner.user_id != user.user_id:
            return {"error": "Unauthorized"}, 403

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

            


