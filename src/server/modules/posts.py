from typing import Optional, Any
from global_src.db import DATABASE
from global_src.global_classes import BaseClass, User


class Post(BaseClass):
    def __init__(self,
                 post_id: int,
                 content: str,
                 community_id: int,
                 author: User,
                 created: str,
                 modified: str,
                 active: int,
                 image_url: Optional[str] = None,
                 like_count: int = 0):
        self.post_id = post_id
        self.content = content
        self.image_url = image_url
        self.community_id = community_id
        self.author = author
        self.created = created
        self.modified = modified
        self.active = active
        self.like_count = like_count
        self.is_liked_by_viewer = False

    @property
    def public_json(self) -> dict[str, Any]:
        return {
            "postId": self.post_id,
            "content": self.content,
            "imageUrl": self.image_url,
            "communityId": self.community_id,
            "author": self.author.public_json,
            "created": self.created,
            "modified": self.modified,
            "likeCount": self.like_count,
            "isLiked": self.is_liked_by_viewer
        }

    @classmethod
    async def get_user_feed(cls, viewer_id: int) -> list['Post']:
        """
        The Logic:
        1. Check what communities the user is in.
        2. If Empty -> Fetch GLOBAL posts (Scenario A).
        3. If Joined -> Fetch SUBSCRIBED posts (Scenario B).
        """
        membership_query = "SELECT community_id FROM Memberships WHERE member_id = ? AND active = 1"
        rows = await DATABASE.fetch_all(membership_query, (viewer_id,))
        community_ids = [r[0] for r in rows] if rows else []

        if not community_ids:
            where_clause = "p.active = 1"
            params = (viewer_id,)
        else:
            placeholders = ",".join(["?"] * len(community_ids))
            where_clause = f"p.community_id IN ({placeholders}) AND p.active = 1"
            params = (viewer_id, *community_ids)

        query = f"""
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
                       u.bio, \
                       u.created, \
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id) as like_count,
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) as is_liked
                FROM Posts p
                         JOIN Profiles u ON p.author_id = u.user_id
                WHERE {where_clause}
                ORDER BY p.created DESC
                LIMIT 50
                """

        rows = await DATABASE.fetch_all(query, params)
        return cls._parse_rows(rows)

    @classmethod
    async def get_by_community(cls, community_id: int, viewer_id: int = None) -> list['Post']:
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
                       u.bio, \
                       u.created, \
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id)                    as like_count,
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) as is_liked
                FROM Posts p
                         JOIN Profiles u ON p.author_id = u.user_id
                WHERE p.community_id = ? \
                  AND p.active = 1
                ORDER BY p.created DESC \
                """
        rows = await DATABASE.fetch_all(query, (viewer_id, community_id))
        return cls._parse_rows(rows)

    @classmethod
    async def get_by_id(cls, post_id: int, viewer_id: int = None) -> Optional['Post']:
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
                       u.bio, \
                       u.created, \
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id)                    as like_count,
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) as is_liked
                FROM Posts p
                         JOIN Profiles u ON p.author_id = u.user_id
                WHERE p.post_id = ? \
                """
        row = await DATABASE.fetch_one(query, (viewer_id, post_id))
        if not row: return None
        return cls._parse_rows([row])[0]

    @classmethod
    def _parse_rows(cls, rows):
        posts = []
        for row in rows:
            (p_id, p_content, p_img, p_comm_id, p_created, p_mod, p_active,
             u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio, u_created, like_cnt, is_liked) = row

            author_obj = User(
                user_id=u_id, username=u_username, display_name=u_display,
                email=u_email, language=u_lang, avatar_url=u_avatar,
                bio=u_bio, created=u_created
            )

            post = cls(
                post_id=p_id, content=p_content, community_id=p_comm_id,
                author=author_obj, created=p_created, modified=p_mod,
                active=p_active, image_url=p_img, like_count=like_cnt
            )
            post.is_liked_by_viewer = (is_liked > 0)
            posts.append(post)
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

        (p_id, p_content, p_img, p_comm, p_created, p_mod, p_active) = row
        author_obj = await User.get_user(author_id)

        return cls(p_id, p_content, p_comm, author_obj, p_created, p_mod, p_active, p_img, like_count=0)

    async def update(self, new_content: str) -> "Post":
        await DATABASE.execute("UPDATE Posts SET content = ? WHERE post_id = ?", (new_content, self.post_id))
        return await self.get_by_id(self.post_id)


class Comment(BaseClass):
    def __init__(self, comment_id: int, content: str, post_id: int, author: User, created: str, modified: str,
                 active: int, like_count: int = 0):
        self.comment_id = comment_id
        self.content = content
        self.post_id = post_id
        self.author = author
        self.created = created
        self.modified = modified
        self.active = active
        self.like_count = like_count
        # Default to False
        self.is_liked_by_viewer = False

    @property
    def public_json(self) -> dict[str, Any]:
        return {
            "commentId": self.comment_id,
            "content": self.content,
            "postId": self.post_id,
            "author": self.author.public_json,
            "created": self.created,
            "modified": self.modified,
            "likeCount": self.like_count,
            "isLiked": self.is_liked_by_viewer
        }

    @classmethod
    async def get_by_post(cls, post_id: int, viewer_id: int = None) -> list['Comment']:
        query = """
                SELECT c.comment_id, \
                       c.content, \
                       c.post_id, \
                       c.created, \
                       c.modified, \
                       c.active,
                       u.user_id, \
                       u.username, \
                       u.display_name, \
                       u._email, \
                       u.language, \
                       u.avatar_url, \
                       u.bio, \
                       u.created,
                       (SELECT COUNT(*) FROM CommentLikes cl WHERE cl.comment_id = c.comment_id)                    as like_count,
                       (SELECT COUNT(*) \
                        FROM CommentLikes cl \
                        WHERE cl.comment_id = c.comment_id \
                          AND cl.user_id = ?)                                                                       as is_liked
                FROM Comments c \
                         JOIN Profiles u ON c.author_id = u.user_id
                WHERE c.post_id = ? \
                  AND c.active = 1 \
                ORDER BY c.created ASC
                """
        rows = await DATABASE.fetch_all(query, (viewer_id, post_id))

        comments = []
        for row in rows:
            (c_id, c_content, c_post_id, c_created, c_mod, c_active,
             u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio, u_created, like_cnt, is_liked) = row

            author = User(
                user_id=u_id, username=u_username, display_name=u_display,
                email=u_email, language=u_lang, avatar_url=u_avatar,
                bio=u_bio, created=u_created
            )

            comment = cls(c_id, c_content, c_post_id, author, c_created, c_mod, c_active, like_count=like_cnt)
            comment.is_liked_by_viewer = (is_liked > 0)
            comments.append(comment)

        return comments

    @classmethod
    async def create(cls, content: str, post_id: int, author_id: int) -> Optional['Comment']:
        query = """
                INSERT INTO Comments (content, post_id, author_id)
                VALUES (?, ?, ?, ?) RETURNING comment_id, content, post_id, author_id, created, modified, active;
                """
        row = await DATABASE.fetch_one(query, (content, post_id, author_id))
        if not row: return None
        (c_id, c_content, c_post, c_auth, c_created, c_mod, c_active) = row
        author = await User.get_user(author_id)
        return cls(c_id, c_content, c_post, author, c_created, c_mod, c_active, like_count=0)

    @classmethod
    async def get_by_id(cls, comment_id: int) -> Optional['Comment']:
        query = """
                SELECT c.comment_id, \
                       c.content, \
                       c.post_id, \
                       c.created, \
                       c.modified, \
                       c.active,
                       u.user_id, \
                       u.username, \
                       u.display_name, \
                       u._email, \
                       u.language, \
                       u.avatar_url, \
                       u.bio, \
                       u.created,
                       (SELECT COUNT(*) FROM CommentLikes cl WHERE cl.comment_id = c.comment_id) as like_count
                FROM Comments c \
                         JOIN Profiles u ON c.author_id = u.user_id
                WHERE c.comment_id = ?
                """
        row = await DATABASE.fetch_one(query, (comment_id,))
        if not row: return None
        (c_id, c_content, c_post_id, c_created, c_mod, c_active,
         u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio, u_created, like_cnt) = row

        author = User(
            user_id=u_id, username=u_username, display_name=u_display,
            email=u_email, language=u_lang, avatar_url=u_avatar,
            bio=u_bio, created=u_created
        )
        return cls(c_id, c_content, c_post_id, author, c_created, c_mod, c_active, like_count=like_cnt)

    async def update(self, new_content: str) -> "Comment":
        await DATABASE.execute("UPDATE Comments SET content = ? WHERE comment_id = ?", (new_content, self.comment_id))
        return await self.get_by_id(self.comment_id)

class Like:
    @staticmethod
    async def toggle_post_like(post_id: int, user_id: int) -> bool:
        check_query = "SELECT 1 FROM PostLikes WHERE post_id = ? AND user_id = ?"
        existing = await DATABASE.fetch_one(check_query, (post_id, user_id))
        if existing:
            await DATABASE.execute("DELETE FROM PostLikes WHERE post_id = ? AND user_id = ?", (post_id, user_id))
            return False
        else:
            await DATABASE.execute("INSERT INTO PostLikes (post_id, user_id) VALUES (?, ?)", (post_id, user_id))
            return True

    @staticmethod
    async def get_post_like_count(post_id: int) -> int:
        result = await DATABASE.fetch_one("SELECT COUNT(*) FROM PostLikes WHERE post_id = ?", (post_id,))
        return result[0] if result else 0

    @staticmethod
    async def toggle_comment_like(comment_id: int, user_id: int) -> bool:
        check_query = "SELECT 1 FROM CommentLikes WHERE comment_id = ? AND user_id = ?"
        existing = await DATABASE.fetch_one(check_query, (comment_id, user_id))
        if existing:
            await DATABASE.execute("DELETE FROM CommentLikes WHERE comment_id = ? AND user_id = ?",
                                   (comment_id, user_id))
            return False
        else:
            await DATABASE.execute("INSERT INTO CommentLikes (comment_id, user_id) VALUES (?, ?)",
                                   (comment_id, user_id))
            return True

    @staticmethod
    async def get_comment_like_count(comment_id: int) -> int:
        result = await DATABASE.fetch_one("SELECT COUNT(*) FROM CommentLikes WHERE comment_id = ?", (comment_id,))
        return result[0] if result else 0