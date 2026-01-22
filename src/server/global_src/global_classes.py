import asyncio
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
            "language": self.language,
            "avatarUrl": self.avatar_url,
            "bio": self.bio
        }
        return base_json

    async def get_communities(self, limit=25) -> list["Community"]:
        community_fetch = await DATABASE.fetch_all("""
        SELECT 
            community_id
        FROM Memberships
            WHERE member_id=?
        LIMIT ?
        """, (self.user_id, limit))
        if not community_fetch:
            return []
        community_ids = [row[0] for row in community_fetch]
        communities = [Community.get_community(i) for i in community_ids]
        return await asyncio.gather(*communities)

class Community(BaseClass):
    """A class representing a community"""
    def __init__(self,
                 community_id: int,
                 community_name: str,
                 display_name: str,
                 owner: Optional[User],
                 description: str=None,
                 icon_url: str=None,
                 post_guidelines: str=None,
                 messages_guidelines: str=None,
                 offline_text: str=None,
                 online_text: str=None
                 ):
        self.community_id = community_id
        self.community_name = community_name
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
    community_name,
    display_name,
    owner_id,
    description,
    icon_url,
    posts_guidelines,
    messages_guidelines,
    offline_text,
    online_text
FROM Communities
    WHERE community_id=?
        """, (community_id,))
        if not community_fetch: return None
        community_name, display_name, owner_id, description, icon_url, post_guidelines, messages_guidelines, offline_text, online_text = community_fetch
        owner = await User.get_user(owner_id)
        return cls(
            community_id=community_id,
            community_name=community_name,
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
            "communityName": self.community_name,
            "displayName": self.display_name,
            "owner": self.owner.public_json,
            "description": self.description,
            "iconUrl": self.icon_url,
            "postGuidelines": self.post_guidelines,
            "messagesGuidelines": self.messages_guidelines,
            "offlineText": self.offline_text,
            "onlineText": self.online_text
        }
        return base_json




