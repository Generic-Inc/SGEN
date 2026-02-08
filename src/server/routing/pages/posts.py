from flask import render_template, request, redirect, url_for
from . import pages_blueprint
from global_src.global_classes import User
from modules.posts import Post

@pages_blueprint.route('/user<int:user_id>/communities')
async def home_feed_page():

    token = request.cookies.get('token')
    if not token:
        return redirect(url_for('pages.login'))

    user = await User.get_user_by_token(token)
    if not user:
        return redirect(url_for('pages.login'))

    feed_posts = await Post.get_user_feed(user.user_id)

    user_communities = await user.get_communities()

    return render_template(
        'index.html',
        user=user.public_json,
        posts=feed_posts,
        user_communities=[c.public_json for c in user_communities]
    )