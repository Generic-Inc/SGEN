import random

from global_src.db import DATABASE
from modules.authentications.data_classes import SaltHash


async def insert_email(email: str,
                       username: str,
                       display_name: str,
                       password: str,
                       language: str=None,
                       avatar_url: str=None,
                        bio: str=None
                       ) -> bool:
    """Insert email into the email list for newsletters or notifications"""
    try:
        password_obj = SaltHash.create_salt_hash(password)
        verification_code = "".join(random.randint(0, 9) for _ in range(6))

        await DATABASE.execute(
            """INSERT INTO EmailVerifications 
                   (email, verification_code, username, display_name, language, avatar_url, bio, password_hash, salt)
            VALUES(?,?,?,?,?,?,?,?,?)""",
            (email, verification_code, username, display_name, language, avatar_url, bio, password_obj.hash_value, password_obj.salt)
        )
        return True
    except Exception as e:
        print(f"Error inserting email: {e}")
        return False