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
            "likeCount": self.like_count
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
                       u.bio, \
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id) as like_count
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
             u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio, like_cnt) = row

            author_obj = User(u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio)

            posts.append(cls(p_id, p_content, p_comm_id, author_obj, p_created, p_mod, p_active, p_img, like_cnt))

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

        return cls(row[0], row[1], row[3], author_obj, row[4], row[5], row[6], row[2], 0)

    @classmethod
    async def get_by_id(cls, post_id: int) -> Optional['Post']:
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
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id) as like_count
                FROM Posts p
                         JOIN Profiles u ON p.author_id = u.user_id
                WHERE p.post_id = ? \
                """
        row = await DATABASE.fetch_one(query, (post_id,))
        if not row: return None

        (p_id, p_content, p_img, p_comm_id, p_created, p_mod, p_active,
         u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio, like_cnt) = row

        author_obj = User(u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio)

        return cls(p_id, p_content, p_comm_id, author_obj, p_created, p_mod, p_active, p_img, like_cnt)

    async def update(self, new_content: str) -> "Post":
        await DATABASE.execute(
            "UPDATE Posts SET content = ? WHERE post_id = ?",
            (new_content, self.post_id)
        )
        return await self.get_by_id(self.post_id)

class Comment(BaseClass):
    def __init__(self,
                 comment_id: int,
                 content: str,
                 post_id: int,
                 author: User,
                 created: str,
                 modified: str,
                 active: int,
                 like_count: int = 0):
        self.comment_id = comment_id
        self.content = content
        self.post_id = post_id
        self.author = author
        self.created = created
        self.modified = modified
        self.active = active
        self.like_count = like_count

    @property
    def public_json(self) -> dict[str, Any]:
        return {
            "commentId": self.comment_id,
            "content": self.content,
            "postId": self.post_id,
            "author": self.author.public_json,
            "created": self.created,
            "modified": self.modified,
            "likeCount": self.like_count
        }

    @classmethod
    async def get_by_post(cls, post_id: int) -> list['Comment']:
        query = """
                SELECT c.comment_id, \
                       c.content, \
                       c.post_id, \
                       c.created, \
                       c.modified, \
                       c.active, \
                       u.user_id, \
                       u.username, \
                       u.display_name, \
                       u._email, \
                       u.language, \
                       u.avatar_url, \
                       u.bio, \
                       (SELECT COUNT(*) FROM CommentLikes cl WHERE cl.comment_id = c.comment_id) as like_count
                FROM Comments c
                         JOIN Profiles u ON c.author_id = u.user_id
                WHERE c.post_id = ? \
                  AND c.active = 1
                ORDER BY c.created ASC
                """
        rows = await DATABASE.fetch_all(query, (post_id,))

        comments = []
        for row in rows:
            (c_id, c_content, c_post_id, c_created, c_mod, c_active,
             u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio, like_cnt) = row

            author = User(u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio)
            comments.append(cls(c_id, c_content, c_post_id, author, c_created, c_mod, c_active, like_cnt))

        return comments

    @classmethod
    async def create(cls, content: str, post_id: int, author_id: int) -> Optional['Comment']:
        query = """
                INSERT INTO Comments (content, post_id, author_id)
                VALUES (?, ?, ?) RETURNING comment_id, content, post_id, author_id, created, modified, active;
                """
        row = await DATABASE.fetch_one(query, (content, post_id, author_id))
        if not row: return None

        author = await User.get_user(author_id)

        return cls(row[0], row[1], row[2], author, row[4], row[5], row[6], 0)

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
                       (SELECT COUNT(*) FROM CommentLikes cl WHERE cl.comment_id = c.comment_id) as like_count
                FROM Comments c
                         JOIN Profiles u ON c.author_id = u.user_id
                WHERE c.comment_id = ?
                """
        row = await DATABASE.fetch_one(query, (comment_id,))
        if not row: return None

        (c_id, c_content, c_post_id, c_created, c_mod, c_active,
         u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio, like_cnt) = row

        author = User(u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio)
        return cls(c_id, c_content, c_post_id, author, c_created, c_mod, c_active, like_cnt)

    async def update(self, new_content: str) -> "Comment":
        await DATABASE.execute(
            "UPDATE Comments SET content = ? WHERE comment_id = ?",
            (new_content, self.comment_id)
        )
        return await self.get_by_id(self.comment_id)

class Like:
    @staticmethod
    async def toggle_post_like(post_id: int, user_id: int) -> bool:
        check_query = "SELECT 1 FROM PostLikes WHERE post_id = ? AND user_id = ?"
        existing = await DATABASE.fetch_one(check_query, (post_id, user_id))

        if existing:
            await DATABASE.execute(
                "DELETE FROM PostLikes WHERE post_id = ? AND user_id = ?",
                (post_id, user_id)
            )
            return False
        else:
            await DATABASE.execute(
                "INSERT INTO PostLikes (post_id, user_id) VALUES (?, ?)",
                (post_id, user_id)
            )
            return True

    @staticmethod
    async def get_post_like_count(post_id: int) -> int:
        query = "SELECT COUNT(*) FROM PostLikes WHERE post_id = ?"
        result = await DATABASE.fetch_one(query, (post_id,))
        return result[0] if result else 0

    @staticmethod
    async def toggle_comment_like(comment_id: int, user_id: int) -> bool:
        check_query = "SELECT 1 FROM CommentLikes WHERE comment_id = ? AND user_id = ?"
        existing = await DATABASE.fetch_one(check_query, (comment_id, user_id))

        if existing:
            # UNLIKE
            await DATABASE.execute(
                "DELETE FROM CommentLikes WHERE comment_id = ? AND user_id = ?",
                (comment_id, user_id)
            )
            return False
        else:
            # LIKE
            await DATABASE.execute(
                "INSERT INTO CommentLikes (comment_id, user_id) VALUES (?, ?)",
                (comment_id, user_id)
            )
            return True

    @staticmethod
    async def get_comment_like_count(comment_id: int) -> int:
        query = "SELECT COUNT(*) FROM CommentLikes WHERE comment_id = ?"
        result = await DATABASE.fetch_one(query, (comment_id,))
        return result[0] if result else 0