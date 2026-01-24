# Import the parent class (BaseClass) and User class so we can link messages to authors
from global_src.global_classes import BaseClass, User
# Import the database connection tool
from global_src.db import DATABASE

class ChatMessage(BaseClass):
    """
    This class represents a single row in the 'ChatMessage' database table.
    It handles creating, finding, updating, and deleting messages.
    """

    def __init__(self, message_id, community_id, author, content, created=None):
        """
        Initialize the object. This holds the data in Python memory
        before sending it to the user or saving it.
        """
        self.message_id = message_id
        self.community_id = community_id
        self.author = author  # Note: This is a full User object (name, avatar), not just an ID number.
        self.content = content
        self.created = created

    @property
    def public_json(self):
        """
        Converts the Python object into a Dictionary.
        Flask will later turn this Dictionary into JSON text to send to the website.
        """
        return {
            "messageId": self.message_id,
            "communityId": self.community_id,
            # We call author.public_json to get the user's name and avatar url
            "author": self.author.public_json if self.author else None,
            "content": self.content,
            "created": self.created
        }

    # =========================================================
    # C.R.U.D METHODS (Create, Read, Update, Delete)
    # =========================================================

    @classmethod
    async def create_message(cls, community_id: int, author_id: int, content: str):
        """
        CREATE: Inserts a new row into the database.
        """
        # 1. Run the SQL INSERT command
        await DATABASE.execute("""
            INSERT INTO ChatMessage (community_id, author_id, content)
            VALUES (?, ?, ?)
        """, (community_id, author_id, content))

        # 2. Immediately fetch the message we just created.
        # Why? Because the Database generates the 'message_id' and 'created' time.
        # We need those back to show them to the user immediately.
        row = await DATABASE.fetch_one("""
            SELECT message_id, created
            FROM ChatMessage
            WHERE community_id = ? AND author_id = ?
            ORDER BY created DESC LIMIT 1
        """, (community_id, author_id))

        if not row: return None

        # 3. Fetch the full User details (Name, Avatar) using the author_id
        author = await User.get_user(author_id)

        # 4. Return the new ChatMessage object
        return cls(row[0], community_id, author, content, row[1])

    @classmethod
    async def get_messages(cls, community_id: int):
        """
        READ: Gets a list of all messages for a specific community.
        """
        # 1. Select all raw data (IDs and Text) from the table
        rows = await DATABASE.fetch_all("""
            SELECT message_id, author_id, content, created
            FROM ChatMessage
            WHERE community_id = ?
            ORDER BY created ASC
        """, (community_id,))

        if not rows: return []

        # 2. Convert raw database rows into Python Objects
        messages = []
        for row in rows:
            # For every message, we need to find who wrote it.
            # This allows the frontend to display "John: Hello" instead of "User 42: Hello"
            author = await User.get_user(row[1])
            messages.append(cls(row[0], community_id, author, row[2], row[3]))

        return messages

    @classmethod
    async def update_message(cls, message_id: int, new_content: str):
        """
        UPDATE: Changes the text content of a specific message.
        """
        # 1. Run the SQL UPDATE command
        await DATABASE.execute("""
            UPDATE ChatMessage
            SET content=?
            WHERE message_id = ?
        """, (new_content, message_id))

        # 2. Fetch the message again to verify the change and return the fresh data
        row = await DATABASE.fetch_one("""
                                       SELECT message_id, community_id, author_id, content, created
                                       FROM ChatMessage
                                       WHERE message_id = ?
        """, (message_id,))

        if not row: return None

        author = await User.get_user(row[2])
        return cls(row[0], row[1], author, row[3], row[4])

    @classmethod
    async def delete_message(cls, message_id: int):
        """
        DELETE: Removes a row from the database.
        """
        # 1. Run the SQL DELETE command
        await DATABASE.execute("""
            DELETE FROM ChatMessage
            WHERE message_id = ?
        """, (message_id,))

        # 2. Double check if it is really gone
        check = await DATABASE.fetch_one("SELECT message_id FROM ChatMessage WHERE message_id=?", (message_id,))

        # If check is None, the message is successfully gone.
        return check is None