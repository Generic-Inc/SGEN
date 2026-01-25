from flask import request

from global_src.global_classes import User
from . import user_blueprint

@user_blueprint.route("/<int:user_id>", methods=["GET", "PATCH", "DELETE"])
async def get_user(user_id: int):
    """Get a user's public information by their user ID"""
    authorization = request.cookies.get('token')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401
    user_get = await User.get_user(user_id)
    if not user_get:
        return {"error": "User not found"}, 404
    if request.method == "GET":
        return user_get.public_json
    elif request.method == "PATCH":
        data = request.get_json()
        kwargs = {}
        if "displayName" in data:
            kwargs["display_name"] = data["displayName"]
        if "bio" in data:
            kwargs["bio"] = data["bio"]
        if "avatarUrl" in data:
            kwargs["avatar_url"] = data["avatarUrl"]
        if "language" in data:
            kwargs["language"] = data["language"]
        if "email" in data:
            kwargs["email"] = data["email"]
        updated_user = await user_get.update_user(**kwargs)
        if not updated_user:
            return {"error": "Failed to update user"}, 400
        return updated_user.public_json
    elif request.method == "DELETE":
        deleted = await user_get.delete_user()
        if not deleted:
            return {"error": "Failed to delete user"}, 400
        return {"success": "User deleted successfully"}



@user_blueprint.route("<int:user_id>/communities")
async def get_user_communities(user_id: int):
    """Get a list of communities that a user is a member of by their user ID"""
    authorization = request.cookies.get('token')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401
    user_get = await User.get_user(user_id)
    if not user_get:
        return {"error": "User not found"}, 404

    communities = await user_get.get_communities()
    return {"communities": [i.public_json for i in communities]}

@user_blueprint.route("/communities")
async def get_communities():
    """Get a list of communities that a user is a member of by their user ID"""
    authorization = request.cookies.get('token')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401

    communities = await user.get_communities()
    return {"communities": [i.public_json for i in communities]}

