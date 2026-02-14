from typing import Optional, Any
from global_src.db import DATABASE
from global_src.global_classes import BaseClass, User


class Post(BaseClass):
    def __init__(self, post_id: int, content: str, community_id: int, community_name: str,
                 author: User, created: str, modified: str, active: int,
                 image_url: Optional[str] = None, like_count: int = 0, comment_count: int = 0):
        self.post_id = post_id
        self.content = content
        self.image_url = image_url
        self.community_id = community_id
        self.community_name = community_name
        self.author = author
        self.created = created
        self.modified = modified
        self.active = active
        self.like_count = like_count
        self.comment_count = comment_count
        self.is_liked_by_viewer = False

    @property
    def public_json(self) -> dict[str, Any]:
        return {
            "postId": self.post_id,
            "content": self.content,
            "imageUrl": self.image_url,
            "communityId": self.community_id,
            "communityName": self.community_name,
            "author": self.author.public_json,
            "created": self.created,
            "modified": self.modified,
            "likeCount": self.like_count,
            "commentCount": self.comment_count,
            "isLiked": self.is_liked_by_viewer
        }

    @classmethod
    async def get_user_feed(cls, viewer_id: int, limit: int = 10, offset: int = 0) -> list['Post']:
        membership_query = "SELECT community_id FROM Memberships WHERE member_id = ? AND active = 1"
        rows = await DATABASE.fetch_all(membership_query, (viewer_id,))
        community_ids = [r[0] for r in rows] if rows else []

        if not community_ids:
            where_clause = "p.active = 1"
            params = [viewer_id, limit, offset]
        else:
            placeholders = ",".join(["?"] * len(community_ids))
            where_clause = f"p.community_id IN ({placeholders}) AND p.active = 1"
            params = [viewer_id, *community_ids, limit, offset]

        query = f"""
            SELECT p.post_id, p.content, p.image_url, p.community_id, c.display_name,
                   p.created, p.modified, p.active,
                   u.user_id, u.username, u.display_name, u._email, u.language, u.avatar_url, u.bio, u.created,
                   (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id) as like_count,
                   (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) as is_liked,
                   (SELECT COUNT(*) FROM Comments cm WHERE cm.post_id = p.post_id AND cm.active = 1) as comment_count
            FROM Posts p
            JOIN Profiles u ON p.author_id = u.user_id
            JOIN Communities c ON p.community_id = c.community_id 
            WHERE {where_clause}
            ORDER BY p.created DESC
            LIMIT ? OFFSET ?
        """
        rows = await DATABASE.fetch_all(query, tuple(params))
        return cls._parse_rows(rows)

    @classmethod
    async def get_by_community(cls, community_id: int, viewer_id: int = None, community_name: str = "Unknown", limit: int = 10, offset: int = 0) -> list['Post']:
        query = """
                SELECT p.post_id, \
                       p.content, \
                       p.image_url, \
                       p.community_id,
                       p.created, \
                       p.modified, \
                       p.active,
                       u.user_id, \
                       u.username, \
                       u.display_name, \
                       u._email, \
                       u.language, \
                       u.avatar_url, \
                       u.bio, \
                       u.created,
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id) as like_count,
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) as is_liked,
                       (SELECT COUNT(*) FROM Comments cm WHERE cm.post_id = p.post_id AND cm.active = 1) as comment_count
                FROM Posts p
                         JOIN Profiles u ON p.author_id = u.user_id
                WHERE p.community_id = ? \
                  AND p.active = 1
                ORDER BY p.created DESC \
                LIMIT ? OFFSET ?
                """
        rows = await DATABASE.fetch_all(query, (viewer_id, community_id, limit, offset))
        return cls._parse_rows(rows, default_community_name=community_name)

    @classmethod
    async def get_by_id(cls, post_id: int, viewer_id: int = None) -> Optional['Post']:
        query = """
                SELECT p.post_id, \
                       p.content, \
                       p.image_url, \
                       p.community_id, \
                       c.display_name,
                       p.created, \
                       p.modified, \
                       p.active,
                       u.user_id, \
                       u.username, \
                       u.display_name, \
                       u._email, \
                       u.language, \
                       u.avatar_url, \
                       u.bio, \
                       u.created,
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id) as like_count,
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) as is_liked,
                       (SELECT COUNT(*) FROM Comments cm WHERE cm.post_id = p.post_id AND cm.active = 1) as comment_count
                FROM Posts p
                         JOIN Profiles u ON p.author_id = u.user_id
                         JOIN Communities c ON p.community_id = c.community_id
                WHERE p.post_id = ? \
                """
        row = await DATABASE.fetch_one(query, (viewer_id, post_id))
        if not row: return None
        return cls._parse_rows([row])[0]

    @classmethod
    async def get_by_author(cls, author_id: int, viewer_id: int = None, limit: int = 10, offset: int = 0) -> list['Post']:
        query = """
                SELECT p.post_id, \
                       p.content, \
                       p.image_url, \
                       p.community_id,
                       c.display_name,
                       p.created, \
                       p.modified, \
                       p.active,
                       u.user_id, \
                       u.username, \
                       u.display_name, \
                       u._email, \
                       u.language, \
                       u.avatar_url, \
                       u.bio, \
                       u.created,
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id)                    as like_count,
                       (SELECT COUNT(*) FROM PostLikes pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) as is_liked,
                       (SELECT COUNT(*) \
                        FROM Comments cm \
                        WHERE cm.post_id = p.post_id \
                          AND cm.active = 1)                                                               as comment_count
                FROM Posts p
                         JOIN Profiles u ON p.author_id = u.user_id
                         JOIN Communities c ON p.community_id = c.community_id
                WHERE p.author_id = ? \
                  AND p.active = 1
                ORDER BY p.created DESC \
                LIMIT ? OFFSET ?
                """
        rows = await DATABASE.fetch_all(query, (viewer_id, author_id, limit, offset))
        return cls._parse_rows(rows)

    @classmethod
    def _parse_rows(cls, rows, default_community_name=None):
        posts = []
        for row in rows:
            if len(row) == 19:
                (p_id, p_content, p_img, p_comm_id, p_comm_name, p_created, p_mod, p_active,
                 u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio, u_created, like_cnt, is_liked, comment_cnt) = row
            elif len(row) == 18:
                 (p_id, p_content, p_img, p_comm_id, p_created, p_mod, p_active,
                 u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio, u_created, like_cnt, is_liked, comment_cnt) = row
                 p_comm_name = default_community_name
            else:
                 continue

            author_obj = User(user_id=u_id, username=u_username, display_name=u_display, email=u_email,
                              language=u_lang, avatar_url=u_avatar, bio=u_bio, created=u_created)

            post = cls(post_id=p_id, content=p_content, community_id=p_comm_id, community_name=p_comm_name,
                       author=author_obj, created=p_created, modified=p_mod, active=p_active,
                       image_url=p_img, like_count=like_cnt, comment_count=comment_cnt)
            post.is_liked_by_viewer = (is_liked > 0)
            posts.append(post)
        return posts

    @classmethod
    async def create(cls, content: str, community_id: int, author_id: int, image_url: Optional[str] = None) -> Optional['Post']:
        query = """
                INSERT INTO Posts (content, community_id, author_id, image_url)
                VALUES (?, ?, ?, ?) RETURNING post_id, created, modified, active; \
                """
        row = await DATABASE.fetch_one(query, (content, community_id, author_id, image_url))
        if not row: return None
        (p_id, p_created, p_mod, p_active) = row

        await DATABASE.commit()
        author = await User.get_user(author_id)
        return cls(post_id=p_id, content=content, community_id=community_id, community_name="Unknown",
                   author=author, created=p_created, modified=p_mod, active=p_active,
                   image_url=image_url, like_count=0, comment_count=0)

    async def update(self, new_content: str) -> "Post":
        await DATABASE.execute(
            "UPDATE Posts SET content = ?, modified = CURRENT_TIMESTAMP WHERE post_id = ?",
            (new_content, self.post_id)
        )
        await DATABASE.commit()
        return await self.get_by_id(self.post_id)

    async def delete(self) -> bool:
        await DATABASE.execute("UPDATE Posts SET active = 0 WHERE post_id = ?", (self.post_id,))
        await DATABASE.commit()
        return True

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
                FROM Comments c
                         JOIN Profiles u ON c.author_id = u.user_id
                WHERE c.post_id = ? \
                  AND c.active = 1
                ORDER BY c.created ASC
                """
        rows = await DATABASE.fetch_all(query, (viewer_id, post_id))
        comments = []
        for row in rows:
            (c_id, c_content, c_post_id, c_created, c_mod, c_active,
             u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio, u_created, like_cnt, is_liked) = row
            author = User(user_id=u_id, username=u_username, display_name=u_display, email=u_email,
                          language=u_lang, avatar_url=u_avatar, bio=u_bio, created=u_created)
            comment = cls(c_id, c_content, c_post_id, author, c_created, c_mod, c_active, like_count=like_cnt)
            comment.is_liked_by_viewer = (is_liked > 0)
            comments.append(comment)
        return comments

    @classmethod
    async def create(cls, content: str, post_id: int, author_id: int) -> Optional['Comment']:
        query = """
                INSERT INTO Comments (content, post_id, author_id)
                VALUES (?, ?, ?) RETURNING comment_id, content, post_id, author_id, created, modified, active;
                """
        row = await DATABASE.fetch_one(query, (content, post_id, author_id))
        if not row: return None
        (c_id, c_content, c_post, c_auth, c_created, c_mod, c_active) = row

        await DATABASE.commit()

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
                FROM Comments c
                         JOIN Profiles u ON c.author_id = u.user_id
                WHERE c.comment_id = ?
                """
        row = await DATABASE.fetch_one(query, (comment_id,))
        if not row: return None
        (c_id, c_content, c_post_id, c_created, c_mod, c_active,
         u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio, u_created, like_cnt) = row
        author = User(user_id=u_id, username=u_username, display_name=u_display, email=u_email,
                      language=u_lang, avatar_url=u_avatar, bio=u_bio, created=u_created)
        return cls(c_id, c_content, c_post_id, author, c_created, c_mod, c_active, like_count=like_cnt)

    async def update(self, new_content: str) -> "Comment":
        await DATABASE.execute(
            "UPDATE Comments SET content = ?, modified = CURRENT_TIMESTAMP WHERE comment_id = ?",
            (new_content, self.comment_id)
        )
        await DATABASE.commit()
        return await self.get_by_id(self.comment_id)

    async def delete(self) -> bool:
        await DATABASE.execute("UPDATE Comments SET active = 0 WHERE comment_id = ?", (self.comment_id,))
        await DATABASE.commit()
        return True


class Like:
    @staticmethod
    async def toggle_post_like(post_id: int, user_id: int) -> bool:
        check_query = "SELECT 1 FROM PostLikes WHERE post_id = ? AND user_id = ?"
        existing = await DATABASE.fetch_one(check_query, (post_id, user_id))
        if existing:
            await DATABASE.execute("DELETE FROM PostLikes WHERE post_id = ? AND user_id = ?", (post_id, user_id))
            await DATABASE.commit()
            return False
        else:
            await DATABASE.execute("INSERT INTO PostLikes (post_id, user_id) VALUES (?, ?)", (post_id, user_id))
            await DATABASE.commit()
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
            await DATABASE.commit()
            return False
        else:
            await DATABASE.execute("INSERT INTO CommentLikes (comment_id, user_id) VALUES (?, ?)",
                                   (comment_id, user_id))
            await DATABASE.commit()
            return True

    @staticmethod
    async def get_comment_like_count(comment_id: int) -> int:
        result = await DATABASE.fetch_one("SELECT COUNT(*) FROM CommentLikes WHERE comment_id = ?", (comment_id,))
        return result[0] if result else 0