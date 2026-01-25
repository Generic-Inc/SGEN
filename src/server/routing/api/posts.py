from flask import request
from global_src.global_classes import Community, User
from modules.posts import Post, Comment, Like
from . import community_blueprint
from . import api  # <--- Important!


# ==================================================
#  1. HOME FEED ROUTE (Global or Personalized)
# ==================================================
@api.route("/feed", methods=["GET"])
async def get_home_feed():
    # [AUTH PLACEHOLDER] - Hardcoded to 1 for now
    viewer_id = 1

    # This automatically calls the logic we wrote in Step 1
    posts = await Post.get_user_feed(viewer_id)
    return {"posts": [p.public_json for p in posts]}


# ==================================================
#  2. COMMUNITY POSTS (Specific Feed)
# ==================================================
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


# ==================================================
#  3. LIKES & COMMENTS (Interactions)
# ==================================================
@community_blueprint.route("/<int:community_id>/posts/<int:post_id>/likes", methods=["POST"])
async def post_likes(community_id: int, post_id: int):
    # [AUTH PLACEHOLDER]
    user_id = 1
    if not await Post.get_by_id(post_id): return {"error": "Post not found"}, 404

    liked = await Like.toggle_post_like(post_id, user_id)
    count = await Like.get_post_like_count(post_id)
    return {"liked": liked, "likeCount": count}


@community_blueprint.route("/<int:community_id>/posts/<int:post_id>/comments", methods=["GET", "POST"])
async def post_comments(community_id: int, post_id: int):
    if not await Post.get_by_id(post_id): return {"error": "Post not found"}, 404

    if request.method == "GET":
        comments = await Comment.get_by_post(post_id)
        return {"comments": [c.public_json for c in comments]}

    elif request.method == "POST":
        data = request.get_json() or {}
        if not data.get("content") or not data.get("authorId"): return {"error": "Missing info"}, 400
        new_comment = await Comment.create(content=data.get("content"), post_id=post_id, author_id=data.get("authorId"))
        if new_comment: return new_comment.public_json, 201
        return {"error": "Failed"}, 500