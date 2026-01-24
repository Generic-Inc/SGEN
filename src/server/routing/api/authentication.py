from datetime import datetime, timedelta
import traceback

from global_src.db import DATABASE
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
    agent = request.headers.get("User-Agent") or "Unknown"
    login = await user.login(password, user_agent=agent)
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
async def verify_email():
    """Verify a user's email address using a verification code"""
    data = request.get_json()
    if not data:
        return {"error": "No data provided"}, 400

    email = data.get("email")
    verification_code = data.get("verificationCode")

    if not email or not verification_code:
        return {"error": "Email and verification code are required"}, 400

    record = await DATABASE.fetch_one(
        """SELECT username, display_name, language, avatar_url, bio, password_hash, salt, created
           FROM EmailVerifications 
           WHERE email=? AND verification_code=?""",
        (email, verification_code)
    )
    if not record:
        return {"error": "Invalid email or verification code"}, 400

    username, display_name, language, avatar_url, bio, password_hash, salt, created = record

    if datetime.now() - timedelta(minutes=5) > created:
        await DATABASE.execute("""DELETE FROM EmailVerifications WHERE email = ?""", (email,))
        return {"error": "Email verification code expired"}, 400

    try:
        user = await AuthenticationsUser.create_user(
            username=username,
            email=email,
            display_name=display_name,
            bio=bio,
            avatar_url=avatar_url,
            language=language
        )
        await DATABASE.execute(
            """INSERT INTO UserAuthentication (user_id, password_hash, salt) 
               VALUES (?, ?, ?)""",
            (user.user_id, password_hash, salt),
            commit=False
        )
        await DATABASE.execute(
            """DELETE FROM EmailVerifications WHERE email = ?""",
            (email,),
            commit=False
        )
        await DATABASE.commit()
        user = await AuthenticationsUser.get_user_by_username(username=username)
        agent = request.headers.get("User-Agent") or "Unknown"
        token = await user.login("", user_agent=agent, bypass=True)
        return {"success": "Email verified and user registered successfully",
                "user": user.public_json,
                "token": token}, 201
    except Exception as e:
        traceback.print_exc()
        print(f"Error during email verification: {e}")
        return {"error": "Failed to register user"}, 500