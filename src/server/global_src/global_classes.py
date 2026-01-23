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

    async def get_member(self, community_id: int):
        role_fetch = await DATABASE.fetch_one("""
        SELECT 
            role
        FROM Memberships
            WHERE member_id=? AND community_id=?
        """, (self.user_id, community_id))
        if not role_fetch:
            return None
        role, = role_fetch
        return role

class Community(BaseClass):
    """A class representing a community"""
    def __init__(self,
                 community_id: int,
                 community_name: str,
                 display_name: str,
                 owner: Optional[User],
                 member_count: int=0,
                 description: str=None,
                 icon_url: str=None,
                 post_guidelines: str=None,
                 messages_guidelines: str=None,
                 offline_text: str=None,
                 online_text: str=None
                 ):
        self.community_id = int(community_id)
        self.community_name = community_name
        self.display_name = display_name
        self.owner = owner
        self.member_count = member_count
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
        member_count = await DATABASE.fetch_all("SELECT * FROM Memberships WHERE community_id=? AND active=1", (community_id,))
        member_count = 0 if not member_count else len(member_count)
        return cls(
            community_id=community_id,
            community_name=community_name,
            display_name=display_name,
            owner=owner,
            member_count=member_count,
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
            "memberCount": self.member_count,
            "description": self.description,
            "iconUrl": self.icon_url,
            "postGuidelines": self.post_guidelines,
            "messagesGuidelines": self.messages_guidelines,
            "offlineText": self.offline_text,
            "onlineText": self.online_text
        }
        return base_json

    async def get_members(self):
        member_fetch = await DATABASE.fetch_all("""
        SELECT 
            member_id,
            role
        FROM Memberships
            WHERE community_id=?
        """, (self.community_id,))
        if not member_fetch:
            return []
        member_ids = [row[0] for row in member_fetch]
        members = [CommunityMember.get_member(i, self.community_id) for i in member_ids]
        return await asyncio.gather(*members)

class CommunityMember(BaseClass):
    def __init__(self, community_id: int, user: User, role: str):
        self.community_id = community_id
        self.user = user
        self.role = role

    @classmethod
    async def get_member(cls, user_id: int, community_id: int):
        role_fetch = DATABASE.fetch_one("""
        SELECT 
            role
        FROM Memberships
            WHERE member_id=? AND community_id=?
        """, (user_id, community_id))
        user_fetch = User.get_user(user_id)
        role_fetch, user_fetch = await asyncio.gather(role_fetch, user_fetch)
        if not role_fetch or not user_fetch:
            return None
        role, = role_fetch
        return cls(
            community_id=community_id,
            user=user_fetch,
            role=role
        )

    @property
    def public_json(self) -> dict[str, Any]:
        return {
            "user": self.user.public_json,
            "role": self.role
        }

class Post(BaseClass):
    def __init__(self,
                 post_id: int,
                 content: str,
                 community_id: int,
                 author: User,
                 created: str,
                 modified: str,
                 active: int,
                 image_url: Optional[str] = None):
        self.post_id = post_id
        self.content = content
        self.image_url = image_url
        self.community_id = community_id
        self.author = author
        self.created = created
        self.modified = modified
        self.active = active

    @property
    def public_json(self) -> dict[str, Any]:
        return {
            "postId": self.post_id,
            "content": self.content,
            "imageUrl": self.image_url,
            "communityId": self.community_id,
            "author": self.author.public_json,
            "created": self.created,
            "modified": self.modified
        }

    @classmethod
    async def get_by_community(cls, community_id: int) -> list['Post']:
        query = """
                SELECT p.post_id, \
                       p.content, \
                       p.image_url, \
                       p.community_id, \
                       p.created, \
                       p.modified, \
                       p.active, \
                       u.user_id, \
                       u.username, \
                       u.display_name, \
                       u._email, \
                       u.language, \
                       u.avatar_url, \
                       u.bio
                FROM Posts p
                         JOIN Profiles u ON p.author_id = u.user_id
                WHERE p.community_id = ? \
                  AND p.active = 1
                ORDER BY p.created DESC \
                """
        rows = await DATABASE.fetch_all(query, (community_id,))

        posts = []
        for row in rows:
            (p_id, p_content, p_img, p_comm_id, p_created, p_mod, p_active,
             u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio) = row

            author_obj = User(u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio)

            posts.append(cls(p_id, p_content, p_comm_id, author_obj, p_created, p_mod, p_active, p_img))

        return posts

    @classmethod
    async def create(cls, content: str, community_id: int, author_id: int, image_url: Optional[str] = None) -> Optional[
        'Post']:
        query = """
                INSERT INTO Posts (content, community_id, author_id, image_url)
                VALUES (?, ?, ?, ?) RETURNING post_id, content, image_url, community_id, created, modified, active;
                """
        row = await DATABASE.fetch_one(query, (content, community_id, author_id, image_url))
        if not row: return None
        author_obj = await User.get_user(author_id)

        return cls(row[0], row[1], row[3], author_obj, row[4], row[5], row[6], row[2])