from flask import request
from modules.posts import Post
from global_src.global_classes import User
from modules.onboarding.Onboarding import Onboarding
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
        if user.user_id != user_get.user_id:
            return {"error": "Forbidden"}, 403
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
        if user.user_id != user_get.user_id:
            return {"error": "Forbidden"}, 403
        deleted = await user_get.delete_user()
        if not deleted:
            return {"error": "Failed to delete user"}, 400
        return {"success": "User deleted successfully"}


@user_blueprint.route("/<int:user_id>/communities")
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

@user_blueprint.route("/<int:user_id>/posts", methods=["GET"])
async def get_user_posts(user_id: int):
    authorization = request.cookies.get('token')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401
    target_user = await User.get_user(user_id)
    if not target_user:
         return {"error": "User not found"}, 404
    try:
        page = int(request.args.get('page', 1))
    except:
        page = 1
    limit = 10
    offset = (page - 1) * limit

    posts = await Post.get_by_author(user_id, viewer_id=user.user_id, limit=limit, offset=offset)
    return {"posts": [p.public_json for p in posts]}

@user_blueprint.route("/onboarding", methods=["POST"])
async def onboarding():
    """Onboarding route to get initial user data after signup/login"""
    authorization = request.cookies.get('token')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401

    data = request.get_json()
    if not data:
        return {"error": "No data provided"}, 400
    age = int(data.get("age"))
    interest = data.get("interest")
    pronouns = data.get("pronouns")
    region = data.get("region")

    if age <= 0:
        return {"error": "Invalid age"}, 400

    onboarding = await Onboarding.register_onboarding(user.user_id, age, interest, pronouns, region)
    if not onboarding:
        return {"error": "Failed to complete onboarding"}, 400
    return {"success": "Onboarding completed successfully"}

@user_blueprint.route("/communities/recommendations")
async def recommend_communities():
    """Get a list of recommended communities for a user based on their onboarding data"""
    authorization = request.cookies.get('token')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401
    try:

        recommendations = await user.recommended_communities()
        return {"communities": [i.public_json for i in recommendations]}
    except Exception as e:
        print(e)
        return {"communities": []}


