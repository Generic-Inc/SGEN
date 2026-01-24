from enum import Enum


class Permissions(Enum):
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
    muted = []
    member = [
        Permissions.CREATE_MESSAGES,
        Permissions.CREATE_POSTS,
        Permissions.JOIN_EVENTS
    ]
    moderator = member.value + [
        Permissions.MANAGE_MESSAGES,
        Permissions.MANAGE_POSTS,
        Permissions.MANAGE_MEMBERS
    ]
    admin = moderator.value + [
        Permissions.MANAGE_COMMUNITY,
        Permissions.MANAGE_ROLES,
    ]
    owner = admin.value + [
        Permissions.DELETE_COMMUNITY,
        Permissions.TRANSFER_OWNERSHIP
    ]




