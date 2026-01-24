from typing import Optional, Any
from global_src.db import DATABASE
from global_src.global_classes import BaseClass, User


class Event(BaseClass):
    def __init__(self,
                 event_id: int,
                 event_name: str,
                 event_description: Optional[str],
                 scheduled_date: str,
                 event_location: str,
                 community_id: int,
                 creator: User,
                 created: str,
                 modified: str,
                 active: int,
                 image_url: Optional[str] = None,
                 user_attendance_status: Optional[str] = None):
        self.event_id = event_id
        self.event_name = event_name
        self.event_description = event_description
        self.scheduled_date = scheduled_date
        self.event_location = event_location
        self.community_id = community_id
        self.creator = creator
        self.created = created
        self.modified = modified
        self.active = active
        self.image_url = image_url
        self.user_attendance_status = user_attendance_status

    @property
    def public_json(self) -> dict[str, Any]:
        return {
            "eventId": self.event_id,
            "eventName": self.event_name,
            "eventDescription": self.event_description,
            "scheduledDate": self.scheduled_date,
            "eventLocation": self.event_location,
            "imageUrl": self.image_url,
            "communityId": self.community_id,
            "creator": self.creator.public_json,
            "created": self.created,
            "modified": self.modified,
            "userAttendanceStatus": self.user_attendance_status
        }

    @classmethod
    async def get_by_community(cls, community_id: int, user_id: Optional[int] = None) -> list['Event']:
        """Get all events for a community, optionally including user attendance status"""
        query = """
                SELECT e.event_id, \
                       e.event_name, \
                       e.event_description, \
                       e.scheduled_date, \
                       e.event_location, \
                       e.image_url, \
                       e.community_id, \
                       e.created, \
                       e.modified, \
                       e.active, \
                       u.user_id, \
                       u.username, \
                       u.display_name, \
                       u._email, \
                       u.language, \
                       u.avatar_url, \
                       u.bio, \
                       ea.status
                FROM Events e
                         JOIN Profiles u ON e.creator_id = u.user_id
                         LEFT JOIN EventAttendance ea ON e.event_id = ea.event_id AND ea.user_id = ?
                WHERE e.community_id = ? \
                  AND e.active = 1
                ORDER BY e.scheduled_date ASC
                """
        rows = await DATABASE.fetch_all(query, (user_id, community_id))

        events = []
        for row in rows:
            (e_id, e_name, e_desc, e_date, e_loc, e_img, e_comm_id, e_created, e_mod, e_active,
             u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio, attendance_status) = row

            creator_obj = User(u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio)

            events.append(cls(e_id, e_name, e_desc, e_date, e_loc, e_comm_id, creator_obj,
                            e_created, e_mod, e_active, e_img, attendance_status))

        return events

    @classmethod
    async def create(cls, 
                    event_name: str,
                    scheduled_date: str,
                    event_location: str,
                    community_id: int,
                    creator_id: int,
                    event_description: Optional[str] = None,
                    image_url: Optional[str] = None) -> Optional['Event']:
        """Create a new event"""
        query = """
                INSERT INTO Events (event_name, event_description, scheduled_date, event_location, 
                                   image_url, community_id, creator_id)
                VALUES (?, ?, ?, ?, ?, ?, ?) 
                RETURNING event_id, event_name, event_description, scheduled_date, event_location, 
                         image_url, community_id, created, modified, active;
                """
        row = await DATABASE.fetch_one(query, (event_name, event_description, scheduled_date, 
                                              event_location, image_url, community_id, creator_id))
        if not row: 
            return None
            
        creator_obj = await User.get_user(creator_id)

        return cls(row[0], row[1], row[2], row[3], row[4], row[6], creator_obj, 
                  row[7], row[8], row[9], row[5])

    @classmethod
    async def get_by_id(cls, event_id: int, user_id: Optional[int] = None) -> Optional['Event']:
        """Get a single event by ID, optionally including user's attendance status"""
        query = """
                SELECT e.event_id, \
                       e.event_name, \
                       e.event_description, \
                       e.scheduled_date, \
                       e.event_location, \
                       e.image_url, \
                       e.community_id, \
                       e.created, \
                       e.modified, \
                       e.active, \
                       u.user_id, \
                       u.username, \
                       u.display_name, \
                       u._email, \
                       u.language, \
                       u.avatar_url, \
                       u.bio, \
                       ea.status
                FROM Events e
                         JOIN Profiles u ON e.creator_id = u.user_id
                         LEFT JOIN EventAttendance ea ON e.event_id = ea.event_id AND ea.user_id = ?
                WHERE e.event_id = ?
                """
        row = await DATABASE.fetch_one(query, (user_id, event_id))
        if not row: 
            return None

        (e_id, e_name, e_desc, e_date, e_loc, e_img, e_comm_id, e_created, e_mod, e_active,
         u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio, attendance_status) = row

        creator_obj = User(u_id, u_username, u_display, u_email, u_lang, u_avatar, u_bio)

        return cls(e_id, e_name, e_desc, e_date, e_loc, e_comm_id, creator_obj,
                  e_created, e_mod, e_active, e_img, attendance_status)

    async def update(self, 
                    event_name: Optional[str] = None,
                    event_description: Optional[str] = None,
                    scheduled_date: Optional[str] = None,
                    event_location: Optional[str] = None,
                    image_url: Optional[str] = None):
        """Update event details"""
        updates = []
        params = []
        
        if event_name is not None:
            updates.append("event_name = ?")
            params.append(event_name)
            self.event_name = event_name
            
        if event_description is not None:
            updates.append("event_description = ?")
            params.append(event_description)
            self.event_description = event_description
            
        if scheduled_date is not None:
            updates.append("scheduled_date = ?")
            params.append(scheduled_date)
            self.scheduled_date = scheduled_date
            
        if event_location is not None:
            updates.append("event_location = ?")
            params.append(event_location)
            self.event_location = event_location
            
        if image_url is not None:
            updates.append("image_url = ?")
            params.append(image_url)
            self.image_url = image_url
        
        if updates:
            params.append(self.event_id)
            query = f"UPDATE Events SET {', '.join(updates)} WHERE event_id = ?"
            await DATABASE.execute(query, tuple(params))


class EventAttendance:
    @staticmethod
    async def set_attendance(event_id: int, user_id: int, status: str) -> bool:
        """Set or update user attendance status (going, interested, not_going)"""
        check_query = "SELECT attendance_id FROM EventAttendance WHERE event_id = ? AND user_id = ?"
        existing = await DATABASE.fetch_one(check_query, (event_id, user_id))

        if existing:
            await DATABASE.execute(
                "UPDATE EventAttendance SET status = ? WHERE attendance_id = ?",
                (status, existing[0])
            )
        else:
            await DATABASE.execute(
                "INSERT INTO EventAttendance (event_id, user_id, status) VALUES (?, ?, ?)",
                (event_id, user_id, status)
            )
        return True

    @staticmethod
    async def remove_attendance(event_id: int, user_id: int) -> bool:
        """Remove user's attendance record"""
        result = await DATABASE.execute(
            "DELETE FROM EventAttendance WHERE event_id = ? AND user_id = ?",
            (event_id, user_id)
        )
        return result > 0

    @staticmethod
    async def get_attendees(event_id: int, status: Optional[str] = None) -> list[User]:
        """Get all attendees for an event"""
        if status:
            query = """
                    SELECT u.user_id, u.username, u.display_name, u._email, 
                           u.language, u.avatar_url, u.bio
                    FROM EventAttendance ea
                    JOIN Profiles u ON ea.user_id = u.user_id
                    WHERE ea.event_id = ? AND ea.status = ?
                    """
            rows = await DATABASE.fetch_all(query, (event_id, status))
        else:
            query = """
                    SELECT u.user_id, u.username, u.display_name, u._email, 
                           u.language, u.avatar_url, u.bio
                    FROM EventAttendance ea
                    JOIN Profiles u ON ea.user_id = u.user_id
                    WHERE ea.event_id = ?
                    """
            rows = await DATABASE.fetch_all(query, (event_id,))

        return [User(row[0], row[1], row[2], row[3], row[4], row[5], row[6]) for row in rows]

    @staticmethod
    async def get_attendance_counts(event_id: int) -> dict[str, int]:
        """Get count of attendees by status"""
        query = """
                SELECT status, COUNT(*) 
                FROM EventAttendance 
                WHERE event_id = ? 
                GROUP BY status
                """
        rows = await DATABASE.fetch_all(query, (event_id,))
        
        counts = {"going": 0, "interested": 0, "not_going": 0}
        for row in rows:
            counts[row[0]] = row[1]
        
        return counts