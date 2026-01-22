from flask import Blueprint

from global_src.global_classes import User
from global_src.global_classes import Community
api = Blueprint('api', __name__, url_prefix='/api')

user = Blueprint('user', __name__, url_prefix='/user')
community = Blueprint('community', __name__, url_prefix='/community')
api.register_blueprint(user)
api.register_blueprint(community)


@api.route('/ping')
def ping():
    return {"message": "pong!"}

@user.route("/<int:user_id>")
async def get_user(user_id: int):
    """Get a user's public information by their user ID"""
    user_get = await User.get_user(user_id)
    if not user_get:
        return {"error": "User not found"}, 404
    return user_get.public_json

@community.route("/<int:community_id>")
async def get_community(community_id: int):
    """Get a community's public information by their community ID"""
    community_get = await Community.get_community(community_id)
    if not community_get:
        return {"error": "Community not found"}, 404
    return community_get.public_json

@user.route("/<int:user_id>/communities")
async def get_user_communities(user_id: int):
    """Get a list of communities that a user is a member of by their user ID"""
    user_get = await User.get_user(user_id)
    if not user_get:
        return {"error": "User not found"}, 404
    communities = await user_get.get_communities()
    return {"communities": [i.public_json for i in communities]}

@community.route("/<int:community_id>/members")
async def get_community_members(community_id: int):
    """Get a list of members in a community by the community ID"""
    community_get = await Community.get_community(community_id)
    if not community_get:
        return {"error": "Community not found"}, 404
    members = await community_get.get_members()
    return {"members": [i.public_json for i in members]}