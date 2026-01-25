from flask import request
from global_src.global_classes import Community, User, CommunityMember
from modules.authentications import Permissions
from modules.posts import Post, Comment, Like
from . import community_blueprint
from . import api

@api.route("/my-communities", methods=["GET"])
async def get_my_communities():
    authorization = request.headers.get('Authorization')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401
    communities = await user.get_communities()
    return {"communities": [c.public_json for c in communities]}

@api.route("/feed", methods=["GET"])
async def get_home_feed():
    authorization = request.headers.get('Authorization')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401

    posts = await Post.get_user_feed(user.user_id)
    return {"posts": [p.public_json for p in posts]}

@community_blueprint.route("/<int:community_id>/posts", methods=["GET", "POST"])
async def community_posts(community_id: int):
    authorization = request.headers.get('Authorization')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401

    community = await Community.get_community(community_id)
    if not community:
        return {"error": "Community not found"}, 404
    if request.method == "GET":
        posts = await Post.get_by_community(
            community_id,
            viewer_id=user.user_id,
            community_name=community.display_name
        )
        return {"posts": [p.public_json for p in posts]}

    elif request.method == "POST":
        community_member = await CommunityMember.get_member(user.user_id, community_id)
        if not community_member:
            return {"error": "You must first join this community before posting"}, 403
        if not community_member.requires_permissions(Permissions.CREATE_POSTS):
            return {"error": "Forbidden"}, 403

        data = request.get_json() or {}
        if not data.get("content"):
            return {"error": "Missing content"}, 400
        new_post = await Post.create(
            content=data.get("content"),
            community_id=community_id,
            author_id=user.user_id,
            image_url=data.get("imageUrl")
        )
        return new_post.public_json, 201

@community_blueprint.route("/<int:community_id>/posts/<int:post_id>", methods=["GET", "PATCH"])
async def single_post(community_id: int, post_id: int):
    authorization = request.headers.get('Authorization')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401

    post = await Post.get_by_id(post_id, viewer_id=user.user_id)
    if not post: return {"error": "Post not found"}, 404

    if request.method == "GET":
        return post.public_json

    elif request.method == "PATCH":
        if post.author.user_id != user.user_id:
            return {"error": "Forbidden"}, 403
        data = request.get_json() or {}
        new_content = data.get("content")

        if not new_content:
            return {"error": "Missing content"}, 400

        await post.update(new_content)
        return post.public_json

@community_blueprint.route("/<int:community_id>/posts/<int:post_id>/likes", methods=["POST"])
async def post_likes(community_id: int, post_id: int):
    authorization = request.headers.get('Authorization')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401

    post = await Post.get_by_id(post_id)
    if not post: return {"error": "Post not found"}, 404

    liked = await Like.toggle_post_like(post_id, user.user_id)
    count = await Like.get_post_like_count(post_id)

    return {"liked": liked, "likeCount": count}

@community_blueprint.route("/<int:community_id>/posts/<int:post_id>/comments", methods=["GET", "POST"])
async def post_comments(community_id: int, post_id: int):
    authorization = request.headers.get('Authorization')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401

    if not await Post.get_by_id(post_id):
        return {"error": "Post not found"}, 404

    if request.method == "GET":
        comments = await Comment.get_by_post(post_id, viewer_id=user.user_id)
        return {"comments": [c.public_json for c in comments]}

    elif request.method == "POST":
        community_user = await CommunityMember.get_member(user.user_id, community_id)
        if not community_user:
            return {"error": "You must first join this community before commenting"}, 403
        if not community_user.requires_permissions(
            Permissions.CREATE_POST_COMMENTS
        ):
            return {"error": "Forbidden"}, 403
        data = request.get_json() or {}
        if not data.get("content"): return {"error": "Missing info"}, 400
        new_comment = await Comment.create(content=data.get("content"), post_id=post_id, author_id=user.user_id)
        if new_comment: return new_comment.public_json, 201
        return {"error": "Failed"}, 500


@community_blueprint.route("/<int:community_id>/posts/<int:post_id>/comments/<int:comment_id>",
                           methods=["GET", "PATCH"])
async def single_comment(community_id: int, post_id: int, comment_id: int):
    authorization = request.headers.get('Authorization')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401

    comment = await Comment.get_by_id(comment_id)
    if not comment: return {"error": "Comment not found"}, 404

    if request.method == "GET":
        return comment.public_json

    elif request.method == "PATCH":
        if comment.author.user_id != user.user_id:
            return {"error": "Forbidden"}, 403
        data = request.get_json() or {}
        new_content = data.get("content")
        if not new_content: return {"error": "Missing content"}, 400

        await comment.update(new_content)
        return comment.public_json


@community_blueprint.route("/<int:community_id>/posts/<int:post_id>/comments/<int:comment_id>/likes", methods=["POST"])
async def comment_likes(community_id: int, post_id: int, comment_id: int):
    authorization = request.headers.get('Authorization')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401

    comment = await Comment.get_by_id(comment_id)
    if not comment: return {"error": "Comment not found"}, 404

    liked = await Like.toggle_comment_like(comment_id, user.user_id)
    count = await Like.get_comment_like_count(comment_id)

    return {"liked": liked, "likeCount": count}