from flask import request

from global_src.global_classes import Community, User
from . import community_blueprint


@community_blueprint.route("/<int:community_id>")
async def get_community(community_id: int):
    """Get a community's public information by their community ID"""
    community_get = await Community.get_community(community_id)
    if not community_get:
        return {"error": "Community not found"}, 404
    return community_get.public_json


@community_blueprint.route("/<int:community_id>/members", methods=["GET", "POST"])
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
            return {"success": False}, 500

            


