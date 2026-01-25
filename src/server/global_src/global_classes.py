import asyncio
from datetime import datetime
from abc import ABC, abstractmethod
from typing import Any, Optional, Union

from slugify import slugify

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
                 created: datetime,
                 user_id: int,
                 username: str,
                 display_name: str,
                 email: str,
                 language: str,
                 avatar_url: str=None,
                 bio: str=None
                 ):
        self.created = created

        self.user_id = user_id
        self.username = username
        self.display_name = display_name
        self.avatar_url = avatar_url
        self.bio = bio
        self.language = language
        self._email = email

    @property
    def public_json(self) -> dict[str, Any]:
        """Get a dict of information about the user that is allowed to be public"""
        base_json = {
            "userId": self.user_id,
            "username": self.username,
            "displayName": self.display_name,
            "language": self.language,
            "avatarUrl": self.avatar_url,
            "bio": self.bio,
            "created": self.created,
        }
        return base_json

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
      bio, 
    created
FROM Profiles
    WHERE user_id=?
""", (user_id,))
        if not profile: return None
        username, display_name, email, language, avatar_url, bio, created = profile
        return cls(
            user_id=user_id,
            username=username,
            display_name=display_name,
            email=email,
            language=language,
            avatar_url=avatar_url,
            bio=bio,
            created=created
        )

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
    
    async def update_user(self,
                          display_name: str=None,
                          avatar_url: str=None,
                          bio: str=None,
                          language: str=None,
                          email: str=None
                          ):
        fields = []
        values = []
        if display_name:
            fields.append("display_name=?")
            values.append(display_name)
        if avatar_url:
            fields.append("avatar_url=?")
            values.append(avatar_url)
        if bio:
            fields.append("bio=?")
            values.append(bio)
        if language:
            fields.append("language=?")
            values.append(language)
        if email:
            fields.append("_email=?")
            values.append(email)
        fields = ",".join(fields)
        await DATABASE.execute(f"""
        UPDATE Profiles SET {fields} WHERE user_id=?
        """, tuple(values + [self.user_id]))
        return await User.get_user(self.user_id)

    async def delete_user(self):
        await DATABASE.execute("""
        UPDATE Profiles SET active=0 WHERE user_id=?
        """, (self.user_id,))
        check = await DATABASE.fetch_one("SELECT active FROM Profiles WHERE user_id=?", (self.user_id,))
        if check[0] == 0:
            return True
        return False

class Community(BaseClass):
    """A class representing a community"""
    def __init__(self,
                 created: datetime,
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
        self.created = created

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
            "onlineText": self.online_text,
            "created": self.created
        }
        return base_json

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
    online_text,
    created,
    modified
FROM Communities
    WHERE community_id=?
    AND active=1
        """, (community_id,))
        if not community_fetch: return None
        community_name, display_name, owner_id, description, icon_url, post_guidelines, messages_guidelines, offline_text, online_text, created, modified = community_fetch
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
            online_text=online_text,
            created=created
        )

    @classmethod
    async def create_community(cls,
                               community_name: str,
                               display_name: str,
                               owner: User,
                               description: str=None,
                               icon_url: str=None,
                               post_guidelines: str=None,
                               messages_guidelines: str=None,
                               offline_text: str=None,
                               online_text: str=None) -> Union["Community", bool]:
        community_name = slugify(community_name)
        check = await DATABASE.fetch_one("""SELECT * FROM Communities WHERE community_name=?""", (community_name,))
        if check:
            return False

        await DATABASE.execute("""
        INSERT INTO Communities (community_name, display_name, owner_id, description, icon_url, posts_guidelines, messages_guidelines, offline_text, online_text)
            VALUES (?,?,?,?,?,?,?,?,?)
            ON CONFLICT DO NOTHING

        """, (community_name, display_name, owner.user_id, description, icon_url, post_guidelines, messages_guidelines, offline_text, online_text), commit=True)
        community_id = await DATABASE.fetch_one("""SELECT community_id FROM Communities WHERE community_name=?""", (community_name,))
        if not community_id:
            return False
        community = await cls.get_community(community_id[0])
        await community.add_member(owner.user_id)
        return community

    async def delete_community(self):
        await DATABASE.execute("""
        UPDATE Communities SET active=0 WHERE community_id=?
        """, (self.community_id,))
        check = await DATABASE.fetch_one("SELECT active FROM Communities WHERE community_id=?", (self.community_id,))
        if check[0] == 0:
            return True
        return False

    async def update_community(self,
                               display_name: str=None,
                               owner: User=None,
                               description: str=None,
                               icon_url: str=None,
                               posts_guidelines: str=None,
                               messages_guidelines: str=None,
                               offline_text: str=None,
                               online_text: str=None
                               ):
        fields = []
        values = []
        if display_name:
            fields.append("display_name=?")
            values.append(display_name)
        if owner:
            fields.append("owner_id=?")
            values.append(owner.user_id)
        if description:
            fields.append("description=?")
            values.append(description)
        if icon_url:
            fields.append("icon_url=?")
            values.append(icon_url)
        if posts_guidelines:
            fields.append("posts_guidelines=?")
            values.append(posts_guidelines)
        if messages_guidelines:
            fields.append("messages_guidelines=?")
            values.append(messages_guidelines)
        if offline_text:
            fields.append("offline_text=?")
            values.append(offline_text)
        if online_text:
            fields.append("online_text=?")
            values.append(online_text)
        fields = ",".join(fields)
        await DATABASE.execute(f"""
        UPDATE Communities SET {fields} WHERE community_id=?
        """, tuple(values + [self.community_id]))
        return await Community.get_community(self.community_id)


    async def get_members(self):
        member_fetch = await DATABASE.fetch_all("""
        SELECT 
            member_id,
            role
        FROM Memberships
            WHERE community_id=?
            AND active=1
        """, (self.community_id,))
        if not member_fetch:
            return []
        member_ids = [row[0] for row in member_fetch]
        members = [CommunityMember.get_member(i, self.community_id) for i in member_ids]
        return await asyncio.gather(*members)

    async def add_member(self, user_id: int):
        await DATABASE.execute("""
        INSERT INTO Memberships (community_id, member_id)
            VALUES (?, ?)
        ON CONFLICT 
        DO UPDATE SET active=1
        """, (self.community_id, user_id))
        return await CommunityMember.get_member(user_id=user_id, community_id=self.community_id)

    async def delete_member(self, user_id: int):
        await DATABASE.execute("""
                               UPDATE Memberships 
                               SET active=0 
                               WHERE community_id=? AND member_id=?
                               """, (self.community_id, user_id))
        return await CommunityMember.get_member(user_id=user_id, community_id=self.community_id)

class CommunityMember(BaseClass):
    def __init__(self, created: datetime, community_id: int, user: User, role: str):
        self.created = created
        self.community_id = community_id
        self.user = user
        self.role = role

    @classmethod
    async def get_member(cls, user_id: int, community_id: int):
        role_fetch = DATABASE.fetch_one("""
        SELECT 
            role,
            created
        FROM Memberships
            WHERE member_id=? AND community_id=?
        """, (user_id, community_id))
        user_fetch = User.get_user(user_id)
        role_fetch, user_fetch = await asyncio.gather(role_fetch, user_fetch)
        if not role_fetch or not user_fetch:
            return None
        role, created = role_fetch
        return cls(
            community_id=community_id,
            user=user_fetch,
            role=role,
            created=created,
        )

    @property
    def public_json(self) -> dict[str, Any]:
        return {
            "user": self.user.public_json,
            "role": self.role,
            "joined": self.created
        }