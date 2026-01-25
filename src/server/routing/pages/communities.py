from flask import render_template, request, redirect, url_for

from global_src.global_classes import User, Community
from modules.posts import Post
from . import pages_community_blueprint

@pages_community_blueprint.route('/<int:community_id>')
async def community_page(community_id: int):
    token = request.cookies.get('token')
    if not token:
        return redirect(url_for('pages.login_page'))
    user = await User.get_user_by_token(token)
    if not user:
        return redirect(url_for('pages.login_page'))
    posts = await Post.get_user_feed(user.user_id)

    community = await Community.get_community(community_id)

    return render_template('communities.html', community_posts=posts, community=community)