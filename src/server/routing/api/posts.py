from flask import request
from global_src.global_classes import Community, User
from modules.posts import Post, Comment, Like
from . import community_blueprint
from . import api
@api.route("/feed", methods=["GET"])
async def get_home_feed():
    # [AUTH PLACEHOLDER] - Hardcoded to 1 for now
    viewer_id = 1

    posts = await Post.get_user_feed(viewer_id)
    return {"posts": [p.public_json for p in posts]}

@community_blueprint.route("/<int:community_id>/posts", methods=["GET", "POST"])
async def community_posts(community_id: int):
    # [AUTH PLACEHOLDER]
    viewer_id = 1

    if not await Community.get_community(community_id):
        return {"error": "Community not found"}, 404

    if request.method == "GET":
        posts = await Post.get_by_community(community_id, viewer_id=viewer_id)
        return {"posts": [p.public_json for p in posts]}

    elif request.method == "POST":
        data = request.get_json() or {}
        if not data.get("content") or not data.get("authorId"):
            return {"error": "Missing content or authorId"}, 400

        if not await User.get_user(data.get("authorId")):
            return {"error": "User not found"}, 404

        new_post = await Post.create(
            content=data.get("content"),
            community_id=community_id,
            author_id=data.get("authorId"),
            image_url=data.get("imageUrl")
        )
        return new_post.public_json, 201

@community_blueprint.route("/<int:community_id>/posts/<int:post_id>", methods=["GET", "PATCH"])
async def single_post(community_id: int, post_id: int):
    # [AUTH PLACEHOLDER]
    viewer_id = 1

    post = await Post.get_by_id(post_id, viewer_id=viewer_id)
    if not post: return {"error": "Post not found"}, 404

    if request.method == "GET":
        return post.public_json

    elif request.method == "PATCH":
        data = request.get_json() or {}
        new_content = data.get("content")

        if not new_content:
            return {"error": "Missing content"}, 400

        await post.update(new_content)
        return post.public_json


@community_blueprint.route("/<int:community_id>/posts/<int:post_id>/likes", methods=["POST"])
async def post_likes(community_id: int, post_id: int):
    data = request.get_json() or {}
    user_id = data.get("userId") or 1

    post = await Post.get_by_id(post_id)
    if not post: return {"error": "Post not found"}, 404

    liked = await Like.toggle_post_like(post_id, user_id)
    count = await Like.get_post_like_count(post_id)

    return {"liked": liked, "likeCount": count}

@community_blueprint.route("/<int:community_id>/posts/<int:post_id>/comments", methods=["GET", "POST"])
async def post_comments(community_id: int, post_id: int):
    if not await Post.get_by_id(post_id):
        return {"error": "Post not found"}, 404

    if request.method == "GET":
        comments = await Comment.get_by_post(post_id)
        return {"comments": [c.public_json for c in comments]}

    elif request.method == "POST":
        data = request.get_json() or {}
        if not data.get("content") or not data.get("authorId"):
            return {"error": "Missing content or authorId"}, 400

        new_comment = await Comment.create(
            content=data.get("content"),
            post_id=post_id,
            author_id=data.get("authorId")
        )
        if new_comment: return new_comment.public_json, 201
        return {"error": "Failed to create comment"}, 500


@community_blueprint.route("/<int:community_id>/posts/<int:post_id>/comments/<int:comment_id>",
                           methods=["GET", "PATCH"])
async def single_comment(community_id: int, post_id: int, comment_id: int):
    comment = await Comment.get_by_id(comment_id)
    if not comment: return {"error": "Comment not found"}, 404

    if request.method == "GET":
        return comment.public_json

    elif request.method == "PATCH":
        data = request.get_json() or {}
        new_content = data.get("content")
        if not new_content: return {"error": "Missing content"}, 400

        await comment.update(new_content)
        return comment.public_json


@community_blueprint.route("/<int:community_id>/posts/<int:post_id>/comments/<int:comment_id>/likes", methods=["POST"])
async def comment_likes(community_id: int, post_id: int, comment_id: int):
    comment = await Comment.get_by_id(comment_id)
    if not comment: return {"error": "Comment not found"}, 404

    data = request.get_json() or {}
    user_id = data.get("userId")

    if not user_id: return {"error": "Missing userId"}, 400

    liked = await Like.toggle_comment_like(comment_id, user_id)
    count = await Like.get_comment_like_count(comment_id)

    return {"liked": liked, "likeCount": count}