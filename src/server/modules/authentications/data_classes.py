from datetime import datetime
from hashlib import sha256
import os
from typing import Union

from global_src.db import DATABASE
from global_src.global_classes import User
from config.config import CONFIG


class SaltHash:
    def __init__(self, salt: str, hash_value: str):
        self.salt = salt
        self.hash_value = hash_value

    @classmethod
    def create_salt_hash(cls, password_string: str) -> "SaltHash":
        salt = os.urandom(16).hex()
        hash_value = sha256((password_string + salt).encode('utf-8')).hexdigest()
        return cls(salt=salt, hash_value=hash_value)

class AuthKeys:

    @classmethod
    def generate_random_key(cls, length: int = 32) -> str:
        return "sgen_" + str(os.urandom(length-5).hex())

class AuthenticationsUser(User):
    def __init__(self, user_id: int, username: str, email: str, display_name: str,
                 bio: str, avatar_url: str, language: str, created: str):
        super().__init__(user_id, username, email, display_name,
                         bio, avatar_url, language, created)

    async def _clean_devices(self):
        tokens = await DATABASE.fetch_all("""SELECT * FROM AuthTokens WHERE user_id = ?""", (self.user_id,))
        if len(tokens)+1 > CONFIG.config["limits"]["max_devices_per_user"]:
            await DATABASE.execute("""DELETE FROM AuthTokens 
                                      WHERE token_hash=(
                                          SELECT token_hash 
                                          FROM AuthTokens 
                                          WHERE user_id=? 
                                          ORDER BY created ASC LIMIT 1)""", (self.user_id,))
            return False
        return True

    async def validate_password(self, password_string: str) -> bool:
        record = await DATABASE.fetch_one("""SELECT salt, password_hash FROM UserAuthentication WHERE user_id = ?""", (self.user_id,))
        if not record:
            return False
        salt, stored_hash = record
        computed_hash = sha256((password_string + salt).encode('utf-8')).hexdigest()
        return computed_hash == stored_hash

    async def login(self, password_string: str, user_agent: str, bypass=False) -> Union[bool, str]:
        if not await self.validate_password(password_string) and not bypass:
            return False
        await self._clean_devices()
        new_token = AuthKeys.generate_random_key()
        hashed_token = sha256(new_token.encode('utf-8')).hexdigest()
        await DATABASE.execute("""INSERT INTO AuthTokens (user_id, user_agent, token_hash)
                                 VALUES (?,?,?)""", (self.user_id, user_agent, hashed_token))
        return new_token




if __name__ == "__main__":
    # Example usage
    start = datetime.now().timestamp()
    print(AuthKeys.generate_random_key(32))
    print(datetime.now().timestamp() - start)