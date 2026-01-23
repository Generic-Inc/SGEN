from flask import request

from global_src.global_classes import User
from . import user_blueprint

@user_blueprint.route("/<int:user_id>", methods=["GET", "PATCH", "DELETE"])
async def get_user(user_id: int):
    """Get a user's public information by their user ID"""
    user_get = await User.get_user(user_id)
    if not user_get:
        return {"error": "User not found"}, 404
    if request.method == "GET":
        return user_get.public_json
    elif request.method == "PATCH":
        data = request.get_json()



@user_blueprint.route("/<int:user_id>/communities")
async def get_user_communities(user_id: int):
    """Get a list of communities that a user is a member of by their user ID"""
    user_get = await User.get_user(user_id)
    if not user_get:
        return {"error": "User not found"}, 404
    communities = await user_get.get_communities()
    return {"communities": [i.public_json for i in communities]}

