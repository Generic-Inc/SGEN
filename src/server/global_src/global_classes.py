from __future__ import annotations
import asyncio
import random
from datetime import datetime
from abc import ABC, abstractmethod
from typing import Any, Optional, Union, Literal
from hashlib import sha256
from typing import TYPE_CHECKING

from slugify import slugify

from config.config import CONFIG
from modules.onboarding.Onboarding import Onboarding
from modules.onboarding.utils import add_community_to_db, edit_community_in_db, search_communities
from .db import DATABASE
if TYPE_CHECKING:
    from modules.authentications import Permissions

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
            "bio": self.bio.replace('{display_name}', self.display_name) if self.bio else None,
            "created": self.created,
        }
        return base_json

    @classmethod
    async def create_user(cls,
                            username: str,
                            display_name: str,
                            email: str,
                            language: str="en",
                            avatar_url: str=None,
                            bio: str=None
                            ) -> Union["User"]:
        check = await DATABASE.execute("""SELECT * FROM Profiles WHERE username=? OR _email=?""", (username, email))
        if check:
            return False
        if not language:
            language = "en"
        avatar_url = random.choice(CONFIG.default_user["avatar_url"]) if not avatar_url else avatar_url
        bio = random.choice(CONFIG.default_user["bio"]) if not bio else bio
        await DATABASE.execute("""
        INSERT INTO Profiles (username, display_name, _email, language, avatar_url, bio)
                               VALUES(?,?,?,?,?,?)""",
                               (username, display_name, email, language, avatar_url, bio))
        return await cls.get_user_by_username(username)

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

    @classmethod
    async def get_user_by_token(cls, token: str) -> "User":
        """Form a user obj after fetching a user from the auth token"""
        token_hash = sha256(token.encode('utf-8')).hexdigest()
        token_fetch = await DATABASE.fetch_one("""
        SELECT 
            user_id
        FROM AuthTokens
            WHERE token_hash=?
        """, (token_hash,))
        if not token_fetch:
            return None
        await DATABASE.execute("UPDATE AuthTokens SET last_used=? WHERE token_hash=?", (datetime.now(), token_hash))
        user_id, = token_fetch
        return await cls.get_user(user_id)

    @classmethod
    async def get_user_by_username(cls, username: str) -> "User":
        """Form a user obj after fetching a user from the username"""
        profile = await DATABASE.fetch_one("""
SELECT 
      user_id, 
      display_name, 
      _email, 
      language, 
      avatar_url, 
      bio, 
    created
FROM Profiles
    WHERE username=?
""", (username,))
        if not profile: return None
        user_id, display_name, email, language, avatar_url, bio, created = profile
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

    @classmethod
    async def get_user_by_email(cls, email: str) -> "User":
        """Form a user obj after fetching a user from the email"""
        profile = await DATABASE.fetch_one("""
SELECT 
      user_id, 
      username, 
      display_name, 
      language, 
      avatar_url, 
      bio, 
    created
FROM Profiles
    WHERE _email=?
""", (email,))
        if not profile: return None
        user_id, username, display_name, language, avatar_url, bio, created = profile
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

    async def get_communities_owned(self):
        community_fetch = await DATABASE.fetch_all("""
        SELECT 
            community_id
        FROM Communities
            WHERE owner_id=?
        """, (self.user_id,))
        if not community_fetch:
            return []
        community_ids = [row[0] for row in community_fetch]
        communities = [Community.get_community(i) for i in community_ids]
        return await asyncio.gather(*communities)

    async def recommended_communities(self):
        onboarding = await Onboarding.get_onboarding(self.user_id)
        print(onboarding)
        interests = onboarding.interests
        results = search_communities(interests)
        community_ids = []
        print(results)
        for i in results["result"]["hits"]:
            community_ids.append(i["_id"])

        communities_get = [Community.get_community(i) for i in community_ids]
        communities = await asyncio.gather(*communities_get)
        return communities


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
    async def get_community_by_name(cls, community_name: str) -> "Community":
        """Form a community obj after fetching a community from the community name"""
        community_fetch = await DATABASE.fetch_one("""
SELECT 
    community_id
FROM Communities
    WHERE community_name=?
    AND active=1
        """, (community_name,))
        if not community_fetch: return None
        community_id, = community_fetch
        return await cls.get_community(community_id)


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

        description = random.choice(CONFIG.default_community["description"]) if not description else description
        icon_url = random.choice(CONFIG.default_community["icon_url"]) if not icon_url else icon_url
        offline_text = CONFIG.default_community["offline_text"] if not offline_text else offline_text
        online_text = CONFIG.default_community["online_text"] if not online_text else online_text

        await DATABASE.execute("""
        INSERT INTO Communities (community_name, display_name, owner_id, description, icon_url, posts_guidelines, messages_guidelines, offline_text, online_text)
            VALUES (?,?,?,?,?,?,?,?,?)
            ON CONFLICT DO NOTHING

        """, (community_name, display_name, owner.user_id, description, icon_url, post_guidelines, messages_guidelines, offline_text, online_text), commit=True)
        community_id = await DATABASE.fetch_one("""SELECT community_id FROM Communities WHERE community_name=?""", (community_name,))
        if not community_id:
            return False
        add_community_to_db(community_id, f"{community_name} {description}")
        community = await cls.get_community(community_id[0])
        await community.add_member(owner.user_id, role="owner")
        community.member_count += 1
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
        if description and self.description != description:
            edit_community_in_db(community_id=self.community_id, new_interest_text=description)
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

    async def add_member(self, user_id: int, role: str="member"):
        await DATABASE.execute("""
        INSERT INTO Memberships (community_id, member_id, role)
            VALUES (?,?,?)
        ON CONFLICT 
        DO UPDATE SET active=1
        """, (self.community_id, user_id, role))
        await DATABASE.commit()
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

    async def update_role(self, new_role: str):
        from modules.authentications import ROLE_HIERARCHY
        if not new_role.upper() in [i.name for i in ROLE_HIERARCHY]:
            return None
        await DATABASE.execute("""
        UPDATE Memberships SET role=? WHERE community_id=? AND member_id=?
        """, (new_role, self.community_id, self.user.user_id))
        return await CommunityMember.get_member(self.user.user_id, self.community_id)

    def requires_permissions(self, *permissions: Permissions):
        from modules.authentications import PresetRoles
        roles = PresetRoles.get_permissions(self.role)
        for permission in permissions:
            if permission not in roles.value:
                return False, f"Missing permission: {permission.value}"
        return True, "All permissions granted"