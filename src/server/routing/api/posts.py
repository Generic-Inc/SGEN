from flask import request
from global_src.global_classes import Community, User, CommunityMember
from modules.authentications import Permissions
from modules.posts import Post, Comment, Like
from global_src.db import DATABASE
from modules.onboarding.Onboarding import Onboarding
from . import community_blueprint
from . import api
from datetime import datetime
from .content_censorship import censor_fields, build_post_content, censor_text

@api.route("/my-communities", methods=["GET"])
async def get_my_communities():
    authorization = request.cookies.get('token')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401
    communities = await user.get_communities()
    return {"communities": [c.public_json for c in communities]}


@api.route("/feed", methods=["GET"])
async def get_home_feed():
    authorization = request.cookies.get('token')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401

    try:
        page = int(request.args.get('page', 1))
    except:
        page = 1
    limit = 10
    offset = (page - 1) * limit

    posts = await Post.get_user_feed(user.user_id, limit=limit, offset=offset)
    return {"posts": [p.public_json for p in posts]}


@community_blueprint.route("/<int:community_id>/posts", methods=["GET", "POST"])
async def community_posts(community_id: int):
    authorization = request.cookies.get('token')
    if not authorization:
        return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user:
        return {"error": "Unauthorized"}, 401

    community = await Community.get_community(community_id)
    if not community:
        return {"error": "Community not found"}, 404

    if request.method == "GET":
        try:
            page = int(request.args.get('page', 1))
        except:
            page = 1
        limit = 10
        offset = (page - 1) * limit

        posts = await Post.get_by_community(
            community_id,
            viewer_id=user.user_id,
            community_name=community.display_name,
            limit=limit,
            offset=offset
        )
        return {"posts": [p.public_json for p in posts]}

    elif request.method == "POST":
        community_member = await CommunityMember.get_member(user.user_id, community_id)
        if not community_member:
            return {"error": "You must first join this community before posting"}, 403
        if not community_member.requires_permissions(Permissions.CREATE_POSTS):
            return {"error": "Forbidden"}, 403

        data = request.get_json() or {}
        censor_fields(data, ("content", "title", "description"))
        post_content = build_post_content(data)
        if not post_content:
            return {"error": "Missing content (content or title/description required)"}, 400
        new_post = await Post.create(
            content=post_content,
            community_id=community_id,
            author_id=user.user_id,
            image_url=data.get("imageUrl")
        )
        return new_post.public_json, 201


@community_blueprint.route("/<int:community_id>/posts/<int:post_id>", methods=["GET", "PATCH", "DELETE"])
async def single_post(community_id: int, post_id: int):
    authorization = request.cookies.get('token')
    if not authorization: return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user: return {"error": "Unauthorized"}, 401

    post = await Post.get_by_id(post_id, viewer_id=user.user_id)
    if not post: return {"error": "Post not found"}, 404

    if request.method == "DELETE":
        if post.author.user_id != user.user_id:
            return {"error": "Forbidden"}, 403

        await post.delete()
        return {"message": "Post deleted"}, 200

    elif request.method == "PATCH":
        if post.author.user_id != user.user_id:
            return {"error": "Forbidden"}, 403

        data = request.get_json() or {}
        censor_fields(data, ("content", "title", "description"))
        new_content = build_post_content(data)

        if not new_content: return {"error": "Missing content (content or title/description required)"}, 400

        updated_post = await post.update(new_content)
        return updated_post.public_json

    return post.public_json


@community_blueprint.route("/<int:community_id>/posts/<int:post_id>/likes", methods=["POST"])
async def post_likes(community_id: int, post_id: int):
    authorization = request.cookies.get('token')
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
    authorization = request.cookies.get('token')
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
        new_comment = await Comment.create(
            content=censor_text(data.get("content")),
            post_id=post_id,
            author_id=user.user_id
        )
        if new_comment: return new_comment.public_json, 201
        return {"error": "Failed"}, 500


@community_blueprint.route("/<int:community_id>/posts/<int:post_id>/comments/<int:comment_id>",
                           methods=["GET", "PATCH", "DELETE"])
async def single_comment(community_id: int, post_id: int, comment_id: int):
    authorization = request.cookies.get('token')
    if not authorization: return {"error": "Unauthorized"}, 401
    user = await User.get_user_by_token(authorization)
    if not user: return {"error": "Unauthorized"}, 401

    comment = await Comment.get_by_id(comment_id)
    if not comment: return {"error": "Comment not found"}, 404

    if request.method == "DELETE":
        if comment.author.user_id != user.user_id:
            return {"error": "Forbidden"}, 403

        await comment.delete()
        return {"message": "Comment deleted"}, 200

    elif request.method == "PATCH":
        if comment.author.user_id != user.user_id:
            return {"error": "Forbidden"}, 403

        data = request.get_json() or {}
        new_content = data.get("content")
        if not new_content: return {"error": "Missing content"}, 400

        updated_comment = await comment.update(censor_text(new_content))
        return updated_comment.public_json

    return comment.public_json


@community_blueprint.route("/<int:community_id>/posts/<int:post_id>/comments/<int:comment_id>/likes", methods=["POST"])
async def comment_likes(community_id: int, post_id: int, comment_id: int):
    authorization = request.cookies.get('token')
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
