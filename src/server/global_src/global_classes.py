from abc import ABC, abstractmethod
from typing import Any, Optional

from .db import DATABASE

class BaseClass(ABC):

    @property
    @abstractmethod
    def public_json(self) -> dict[str, Any]:
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
                 avatar_url: str=None,
                 bio: str=None
                 ):
        self.user_id = user_id
        self.username = username
        self.display_name = display_name
        self.avatar_url = avatar_url
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
      avatar_url, 
      bio
FROM Profiles
    WHERE user_id=?
""", (user_id,))
        if not profile: return None
        username, display_name, email, language, avatar_url, bio = profile
        return cls(
            user_id=user_id,
            username=username,
            display_name=display_name,
            email=email,
            language=language,
            avatar_url=avatar_url,
            bio=bio
        )

    @property
    def public_json(self) -> dict[str, Any]:
        """Get a dict of information about the user that is allowed to be public"""
        base_json = {
            "userId": self.user_id,
            "username": self.username,
            "displayName": self.display_name,
            "language": self.language
        }
        if self.avatar_url:
            base_json["profilePictureUrl"] = self.avatar_url
        if self.bio:
            base_json["bio"] = self.bio
        return base_json

class Community(BaseClass):
    """A class representing a community"""
    def __init__(self,
                 community_id: str,
                 display_name: str,
                 owner: Optional[User],
                 description: str,
                 icon_url: str=None,
                 post_guidelines: str=None,
                 messages_guidelines: str=None,
                 offline_text: str=None,
                 online_text: str=None
                 ):
        self.community_id = community_id
        self.display_name = display_name
        self.owner = owner
        self.description = description
        self.icon_url = icon_url
        self.post_guidelines = post_guidelines
        self.messages_guidelines = messages_guidelines
        self.offline_text = offline_text
        self.online_text = online_text

    @classmethod
    async def get_community(cls, community_id: int) -> "Community":
        """Form a community obj after fetching a community from the community id"""
        community_fetch = await DATABASE.fetch_one("""
SELECT 
    display_name,
    owner_id,
    description,
    icon_url,
    post_guidelines,
    messages_guidelines,
    offine_text,
    online_text
FROM Communities
    WHERE community_id=?
        """, (community_id,))
        if not community_fetch: return None
        display_name, owner_id, description, icon_url, post_guidelines, messages_guidelines, offline_text, online_text = community_fetch
        owner = await User.get_user(owner_id)
        return cls(
            community_id=community_id,
            display_name=display_name,
            owner=owner,
            description=description,
            icon_url=icon_url,
            post_guidelines=post_guidelines,
            messages_guidelines=messages_guidelines,
            offline_text=offline_text,
            online_text=online_text
        )

    @property
    def public_json(self) -> dict[str, Any]:
        """Get a dict of information about the community that is allowed to be public"""
        base_json = {
            "communityId": self.community_id,
            "displayName": self.display_name,
            "owner": self.owner.public_json,
            "description": self.description,
        }
        if self.icon_url:
            base_json["iconUrl"] = self.icon_url
        if self.post_guidelines:
            base_json["postGuidelines"] = self.post_guidelines
        if self.messages_guidelines:
            base_json["messagesGuidelines"] = self.messages_guidelines
        if self.offline_text:
            base_json["offlineText"] = self.offline_text
        if self.online_text:
            base_json["onlineText"] = self.online_text
        return base_json




