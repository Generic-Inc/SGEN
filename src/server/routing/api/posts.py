from flask import request

from global_src.global_classes import Community, User, Post
from . import community_blueprint


@community_blueprint.route("/<int:community_id>/posts", methods=["GET", "POST"])
async def community_posts(community_id: int):
    """
    GET: Fetch all active posts for a community
    POST: Create a new post in the community
    """
    community_get = await Community.get_community(community_id)
    if not community_get:
        return {"error": "Community not found"}, 404

    if request.method == "GET":
        posts = await Post.get_by_community(community_id)
        return {"posts": [p.public_json for p in posts]}

    elif request.method == "POST":
        try:
            data = request.get_json()

            author_id = data.get("authorId")
            content = data.get("content")
            image_url = data.get("imageUrl")

            if not author_id or not content:
                return {"error": "Missing authorId or content"}, 400

            user_get = await User.get_user(author_id)
            if not user_get:
                return {"error": "User (Author) not found"}, 404

            new_post = await Post.create(
                content=content,
                community_id=community_id,
                author_id=author_id,
                image_url=image_url
            )

            if new_post:
                return new_post.public_json, 201
            else:
                return {"error": "Failed to create post"}, 500

        except Exception as e:
            return {"error": str(e)}, 500


@community_blueprint.route("/<int:community_id>/posts/<int:post_id>", methods=["GET"])
async def get_single_post(community_id: int, post_id: int):
    """
    GET: Fetch a single specific post
    """
    post = await Post.get_by_id(post_id)

    if not post:
        return {"error": "Post not found"}, 404

    return post.public_json