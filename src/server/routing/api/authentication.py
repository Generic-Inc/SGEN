from global_src.global_classes import User
from . import user_blueprint
from flask import request

from modules.authentications.data_classes import AuthenticationsUser

@user_blueprint.route("/login", methods=["POST"])
async def login():
    """Authenticate a user and return a token"""
    data = request.get_json()
    if not data:
        return {"error": "No data provided"}, 400

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not (username or email) or not password:
        return {"error": "Username/email and password are required"}, 400
    user = None
    if username:
        user = await AuthenticationsUser.get_user_by_username(username=username)
    elif email:
        user = await AuthenticationsUser.get_user_by_email(email=email)
    if not user:
        return {"error": "Invalid username/email or password"}, 401
    login = await user.login(password)
    if not login:
        return {"error": "Invalid username/email or password"}, 401
    return {"token": login}