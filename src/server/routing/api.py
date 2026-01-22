from flask import Blueprint

from global_src.global_classes import User
from global_src.global_classes import Community
api = Blueprint('api', __name__, url_prefix='/api')

@api.route('/ping')
def ping():
    return {"message": "pong!"}

@api.route("/user/<int:user_id>")
async def get_user(user_id: int):
    user = await User.get_user(user_id)
    if not user:
        return {"error": "User not found"}, 404
    return user.public_json

@api.route("/community/<community_id>")
async def get_community(community_id: str):
    community = await Community.get_community(community_id)
    if not community:
        return {"error": "Community not found"}, 404
    return community.public_json