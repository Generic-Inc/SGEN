from global_src.global_classes import User
from .main import user

@user.route("/<int:user_id>")
async def get_user(user_id: int):
    """Get a user's public information by their user ID"""
    user_get = await User.get_user(user_id)
    if not user_get:
        return {"error": "User not found"}, 404
    return user_get.public_json

@user.route("/<int:user_id>/communities")
async def get_user_communities(user_id: int):
    """Get a list of communities that a user is a member of by their user ID"""
    user_get = await User.get_user(user_id)
    if not user_get:
        return {"error": "User not found"}, 404
    communities = await user_get.get_communities()
    return {"communities": [i.public_json for i in communities]}

