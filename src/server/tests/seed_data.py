from config.config import CONFIG
from global_src.db import DATABASE
from global_src.global_classes import User, Community
from modules.authentications import SaltHash, AuthenticationsUser
from modules.posts import Post, Comment
from modules.events import Event, EventAttendance
from datetime import datetime, timedelta

async def main():
    await DATABASE.initialize()
    await CONFIG.load_config()
    user_1_password = "TestPassword1!"
    user_1_salt_hash = SaltHash.create_salt_hash(user_1_password)
    try:
        user_1 = await AuthenticationsUser.create_user("testuser1",
                                        "Test User 1",
                                        "ryankgithub@gmail.com",
                                        )

        await DATABASE.execute("INSERT INTO UserAuthentication (user_id, salt, password_hash) VALUES (?, ?, ?)",
                               (user_1.user_id,
                                user_1_salt_hash.salt,
                                user_1_salt_hash.hash_value))
        print(f"Created user 'testuser1' with password '{user_1_password}'")
    except Exception as e:
        print(e)
        user_1 = await AuthenticationsUser.get_user_by_username("testuser1")
    auth_token = await user_1.login(user_1_password, user_agent="SeedDataScript/1.0", bypass=True)
    print(f"Auth token for 'testuser1': {auth_token}")

    user_2_password = "TestPassword2!"
    user_2_salt_hash = SaltHash.create_salt_hash(user_2_password)
    try:
        user_2 = await AuthenticationsUser.create_user("testuser2",
                                        "Test User 2",
                                        "SGENverifications@outlook.com")

        await DATABASE.execute("INSERT INTO UserAuthentication (user_id, salt, password_hash) VALUES (?, ?, ?)",
                               (user_2.user_id,
                                user_2_salt_hash.salt,
                                user_2_salt_hash.hash_value))
        print(f"Created user 'testuser2' with password '{user_2_password}'")
    except Exception as e:
        print(e)
        user_2 = await AuthenticationsUser.get_user_by_username("testuser2")
    auth_token = await user_2.login(user_2_password, user_agent="SeedDataScript/1.0", bypass=True)
    print(f"Auth token for 'testuser2': {auth_token}")

    try:
        test_community = await Community.create_community(
            community_name="testcommunity",
            display_name="Test Community",
            owner=user_1,
            description="This is a test community created for seeding data.",
            icon_url=None,
            post_guidelines="Be respectful and follow the rules.",
            messages_guidelines=None,
            offline_text=None,
            online_text=None
        )
        await test_community.add_member(user_2.user_id)
    except Exception as e:
        print(e)
        test_community = await Community.get_community_by_name("testcommunity")
    post_1 = await Post.create(
        content="Welcome to the Test Community! This is the first post.",
        community_id=test_community.community_id,
        author_id=user_1.user_id,
        image_url=None
    )
    comment = await Comment.create(
        "This is a comment on the first post.",
        post_id=post_1.post_id,
        author_id=user_2.user_id
    )

    events_to_create = [
        {
            'event_name': 'Marina Bay Sands Day',
            'event_description': 'Explore the iconic Marina Bay Sands and enjoy breathtaking views!',
            'scheduled_date': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d 18:00:00'),
            'event_location': 'Marina Bay Sands Convention Center',
            'image_url': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd',
        },
        {
            'event_name': 'Rizzler day',
            'event_description': 'A meeting of great rizzlers young and old',
            'scheduled_date': (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d 19:00:00'),
            'event_location': 'Orchard Road',
            'image_url': None,
        },
        {
            'event_name': 'Hidden Hawker Tour',
            'event_description': 'Discover hidden hawker gems in the East!',
            'scheduled_date': (datetime.now() + timedelta(days=21)).strftime('%Y-%m-%d 12:00:00'),
            'event_location': 'Bedok Food Centre',
            'image_url': 'https://images.unsplash.com/photo-1551218808-94e220e084d2',
        },
    ]

    for event_data in events_to_create:
        try:
            event = await Event.create(
                event_name=event_data['event_name'],
                event_description=event_data['event_description'],
                scheduled_date=event_data['scheduled_date'],
                event_location=event_data['event_location'],
                community_id=test_community.community_id,
                creator_id=user_1.user_id,
                image_url=event_data['image_url']
            )

            # Add some interested users
            await EventAttendance.toggle_interest(event.event_id, user_1.user_id)
            await EventAttendance.toggle_interest(event.event_id, user_2.user_id)

            print(f"Created event: {event_data['event_name']}")
        except Exception as e:
            print(f"Error creating event {event_data['event_name']}: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

