from flask import render_template, request, redirect, url_for

from routing.pages import pages_blueprint


@pages_blueprint.route('/login')
def login_page():
    return render_template('login.html')

@pages_blueprint.route('/signup')
def signup_page():
    return render_template('signup.html')

@pages_blueprint.route('/')
def home_page():
    if not request.cookies.get('token'):
        return redirect(url_for('pages.login_page'))
    return render_template('index.html')