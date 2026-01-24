from enum import Enum


class Permissions(Enum):
    JOIN_COMMUNITY = "join_community"
    CREATE_MESSAGES = "send_messages"
    CREATE_POSTS = "create_posts"
    JOIN_EVENTS = "join_events"
    MANAGE_MESSAGES = "manage_messages"
    MANAGE_POSTS = "manage_posts"
    MANAGE_MEMBERS = "manage_members"
    MANAGE_COMMUNITY = "manage_community"
    MANAGE_ROLES = "manage_roles"
    DELETE_COMMUNITY = "delete_community"
    TRANSFER_OWNERSHIP = "transfer_ownership"

class PresetRoles(Enum):
    BANNED = []
    MUTED = [Permissions.JOIN_COMMUNITY]
    MEMBER = MUTED + [
        Permissions.CREATE_MESSAGES,
        Permissions.CREATE_POSTS,
        Permissions.JOIN_EVENTS
    ]
    MODERATOR = MEMBER + [
        Permissions.MANAGE_MESSAGES,
        Permissions.MANAGE_POSTS,
        Permissions.MANAGE_MEMBERS
    ]
    ADMIN = MODERATOR + [
        Permissions.MANAGE_COMMUNITY,
        Permissions.MANAGE_ROLES,
    ]
    OWNER = ADMIN + [
        Permissions.DELETE_COMMUNITY,
        Permissions.TRANSFER_OWNERSHIP
    ]

    @classmethod
    def get_permissions(cls, role_name: str):
        role = cls[role_name.upper()]
        return role

ROLE_HIERARCHY = [PresetRoles.BANNED, PresetRoles.MUTED, PresetRoles.MEMBER, PresetRoles.MODERATOR, PresetRoles.ADMIN, PresetRoles.OWNER]

if __name__ == "__main__":
    print(PresetRoles.get_permissions("moderator").value)


