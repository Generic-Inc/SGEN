from global_src.global_classes import BaseClass, User
from global_src.db import DATABASE

class ChatMessage(BaseClass):
    #Initialize
    def __init__(self, message_id, community_id, author, content, created=None):
        self.message_id = message_id
        self.community_id = community_id
        self.author = author  # Note: This is a full User object (name, avatar), not just an ID number.
        self.content = content
        self.created = created

    #Return to web
    @property
    def public_json(self):
        return {
            "messageId": self.message_id,
            "communityId": self.community_id,
            # We call author.public_json to get the user's name and avatar url
            "author": self.author.public_json if self.author else None,
            "content": self.content,
            "created": self.created
        }

#================= C.R.U.D METHODS =====================================================

#CREATE
    @classmethod
    async def create_message(cls, community_id: int, author_id: int, content: str):
        await DATABASE.execute("""
            INSERT INTO ChatMessage (community_id, author_id, content)
            VALUES (?, ?, ?)
        """, (community_id, author_id, content))

        row = await DATABASE.fetch_one("""
            SELECT message_id, created
            FROM ChatMessage
            WHERE community_id = ? AND author_id = ?
            ORDER BY created DESC LIMIT 1
        """, (community_id, author_id))

        if not row: return None

        author = await User.get_user(author_id)
        return cls(row[0], community_id, author, content, row[1])

# READ
    @classmethod
    async def get_messages(cls, community_id: int):
        rows = await DATABASE.fetch_all("""
            SELECT message_id, author_id, content, created
            FROM ChatMessage
            WHERE community_id = ?
            ORDER BY created ASC
        """, (community_id,))

        if not rows: return []

        messages = []
        for row in rows:
            author = await User.get_user(row[1])
            messages.append(cls(row[0], community_id, author, row[2], row[3]))

        return messages

# UPDATE
    @classmethod
    async def update_message(cls, message_id: int, new_content: str):
        await DATABASE.execute("""
            UPDATE ChatMessage
            SET content=?
            WHERE message_id = ?
        """, (new_content, message_id))

        row = await DATABASE.fetch_one("""
           SELECT message_id, community_id, author_id, content, created
           FROM ChatMessage
           WHERE message_id = ?
        """, (message_id,))

        if not row: return None

        author = await User.get_user(row[2])
        return cls(row[0], row[1], author, row[3], row[4])

# Delete
    @classmethod
    async def delete_message(cls, message_id: int):
        await DATABASE.execute("""
            DELETE FROM ChatMessage
            WHERE message_id = ?
        """, (message_id,))

        check = await DATABASE.fetch_one("SELECT message_id FROM ChatMessage WHERE message_id=?", (message_id,))
        return check is None