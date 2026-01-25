from config.config import CONFIG
from global_src.db import DATABASE
from global_src.global_classes import User, Community
from modules.authentications import SaltHash, AuthenticationsUser
from modules.posts import Post, Comment

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

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

