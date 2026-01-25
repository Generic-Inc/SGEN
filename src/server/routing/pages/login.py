from flask import render_template

from routing.pages import pages_blueprint


@pages_blueprint.route('/login')
def login_page():
    return render_template('login.html')