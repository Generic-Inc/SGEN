from global_src.global_classes import User
from modules.authentications.utils import insert_email
from . import auth_blueprint
from flask import request

from modules.authentications.data_classes import AuthenticationsUser

@auth_blueprint.route("/login", methods=["POST"])
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

@auth_blueprint.route("/signup", methods=["POST"])
async def signup():
    """Register a new user"""
    data = request.get_json()
    if not data:
        return {"error": "No data provided"}, 400

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    display_name = data.get("displayName")
    bio = data.get("bio")
    avatar_url = data.get("avatarUrl")
    language = data.get("language")

    if not username or not email or not password:
        return {"error": "Username, email, and password are required"}, 400

    existing_user = await AuthenticationsUser.get_user_by_username(username=username)
    if existing_user:
        return {"error": "Username already taken"}, 409
    existing_email = await AuthenticationsUser.get_user_by_email(email=email)
    if existing_email:
        return {"error": "Email already registered"}, 409
    check = await insert_email(
        email=email,
        username=username,
        display_name=display_name,
        language=language,
        avatar_url=avatar_url,
        bio=bio,
        password=password
    )
    if check:
        return {"success": "Verification email sent. Please verify your email to complete registration."}, 201
    return {"error": "Failed to send verification email"}, 500

@auth_blueprint.route("/verify-email", methods=["POST"])
async def verify_email(): ...