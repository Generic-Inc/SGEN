from abc import ABC, abstractmethod
from .db import DATABASE

class BaseClass(ABC):

    @classmethod
    @abstractmethod
    async def public_json(cls) -> dict[str, str]:
        """Return a dict of information about the obj that is allowed to be public"""
        raise NotImplementedError

class User(BaseClass):
    """A class representing a user"""
    def __init__(self,
                 user_id: int,
                 username: str,
                 display_name: str,
                 email: str,
                 language: str,
                 profile_picture_url: str=None,
                 bio: str=None
                 ):
        self.user_id = user_id
        self.username = username
        self.display_name = display_name
        self.profile_picture_url = profile_picture_url
        self.bio = bio
        self.language = language
        self._email = email

    @classmethod
    async def get_user(cls, user_id: int) -> "User":
        """Form a user obj after fetching a user from the user id"""
        profile = await DATABASE.fetch_one("""
SELECT 
      username, 
      display_name, 
      _email, 
      language, 
      profile_picture_url, 
      bio
FROM Profiles
    WHERE user_id=?
""", (user_id,))
        if not profile: return None
        username, display_name, email, language, profile_picture_url, bio = profile
        return cls(
            user_id=user_id,
            username=username,
            display_name=display_name,
            email=email,
            language=language,
            profile_picture_url=profile_picture_url,
            bio=bio
        )

    @property
    def public_json(self) -> dict[str, str]:
        """Get a dict of information about the user that is allowed to be public"""
        base_json = {
            "userId": self.user_id,
            "username": self.username,
            "displayName": self.display_name,
            "language": self.language
        }
        if self.profile_picture_url:
            base_json["profilePictureUrl"] = self.profile_picture_url
        if self.bio:
            base_json["bio"] = self.bio
        return base_json



