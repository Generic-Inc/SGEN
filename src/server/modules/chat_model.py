# Database connection and core classes for chat models
from global_src.global_classes import BaseClass, User
from global_src.db import DATABASE


class ChatMessage(BaseClass):
    def __init__(self, message_id, community_id, author, content, created=None):
        self.message_id = message_id
        self.community_id = community_id
        self.author = author  # This is a User object
        self.content = content
        self.created = created

    @property
    def public_json(self):
        return {
            "messageId": self.message_id,
            "communityId": self.community_id,
            "author": self.author.public_json if self.author else None,
            "content": self.content,
            "created": self.created
        }

    # --- get a single message (for ownership checks) ---
    @classmethod
    async def get_message(cls, message_id: int):
        row = await DATABASE.fetch_one("""
                                       SELECT message_id, community_id, author_id, content, created
                                       FROM ChatMessage
                                       WHERE message_id = ?
                                       """, (message_id,))

        if not row: return None

        # We need the author object to fully reconstruct the message
        author = await User.get_user(row[2])
        return cls(row[0], row[1], author, row[3], row[4])

    # --- CREATE ---
    @classmethod
    async def create_message(cls, community_id: int, author_id: int, content: str):
        await DATABASE.execute("""
                               INSERT INTO ChatMessage (community_id, author_id, content)
                               VALUES (?, ?, ?)
                               """, (community_id, author_id, content))

        # Fetch the newly created message to get the ID and timestamp
        row = await DATABASE.fetch_one("""
                                       SELECT message_id, created
                                       FROM ChatMessage
                                       WHERE community_id = ?
                                         AND author_id = ?
                                       ORDER BY created DESC LIMIT 1
                                       """, (community_id, author_id))

        if not row: return None

        author = await User.get_user(author_id)
        return cls(row[0], community_id, author, content, row[1])

    # --- READ ---
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
            # Optimize: In a real production app, you might cache users to avoid N+1 queries
            author = await User.get_user(row[1])
            messages.append(cls(row[0], community_id, author, row[2], row[3]))

        return messages

    # --- UPDATE ---
    @classmethod
    async def update_message(cls, message_id: int, new_content: str):
        await DATABASE.execute("""
                               UPDATE ChatMessage
                               SET content=?
                               WHERE message_id = ?
                               """, (new_content, message_id))

        # Re-fetch to return the updated object
        return await cls.get_message(message_id)

    # --- DELETE ---
    @classmethod
    async def delete_message(cls, message_id: int):
        await DATABASE.execute("""
                               DELETE
                               FROM ChatMessage
                               WHERE message_id = ?
                               """, (message_id,))

        # Verify if text is deleted
        check = await DATABASE.fetch_one("SELECT message_id FROM ChatMessage WHERE message_id=?", (message_id,))
        return check is None