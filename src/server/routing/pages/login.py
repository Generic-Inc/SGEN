from flask import render_template, request, redirect, url_for
from routing.pages import pages_blueprint
from modules.posts import Post, Comment
from global_src.global_classes import User

@pages_blueprint.route('/login')
def login_page():
    if request.cookies.get('token'):
        return redirect(url_for('pages.home_page'))
    return render_template('login.html')

@pages_blueprint.route('/signup')
def signup_page():
    if request.cookies.get('token'):
        return redirect(url_for('pages.home_page'))
    return render_template('signup.html')

@pages_blueprint.route('/user/<int:user_id>')
def profile_page(user_id: int):
    if not request.cookies.get('token'):
        return redirect(url_for('pages.login_page'))
    return render_template('profile.html', target_id=user_id)

@pages_blueprint.route('/')
async def home_page():
    token = request.cookies.get('token')
    if not token:
        return redirect(url_for('pages.login_page'))
    user = await User.get_user_by_token(token)
    viewer_id = user.user_id if user else 0
    posts = await Post.get_user_feed(viewer_id)
    return render_template('index.html', posts=posts, user=user)