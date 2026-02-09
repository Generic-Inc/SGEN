import random
import asyncio
from config.config import CONFIG
from global_src.db import DATABASE
from global_src.global_classes import User, Community
from modules.authentications import SaltHash, AuthenticationsUser
from modules.posts import Post, Comment


USER_DATA = [
    {"user": "cyber_ninja", "name": "Ninja Coder", "email": "ninja@example.com", "bio": "I code in my sleep 😴"},
    {"user": "artistic_soul", "name": "Bella Arts", "email": "bella@example.com", "bio": "Digital artist & cat mom 🐱"},
    {"user": "gym_rat_99", "name": "Brad Lifts", "email": "brad@example.com", "bio": "Gains only. 💪"},
    {"user": "travel_bug", "name": "Wanderlust", "email": "travel@example.com", "bio": "Catch me if you can ✈️"},
    {"user": "meme_lord", "name": "Doge Coin", "email": "doge@example.com", "bio": "Much wow. Very code."},
    {"user": "coffee_addict", "name": "Java Bean", "email": "coffee@example.com", "bio": " powered by caffeine ☕"},
    {"user": "music_vibes", "name": "DJ Py", "email": "dj@example.com", "bio": "Beats and bytes 🎵"},
    {"user": "gaming_god", "name": "Pro Gamer", "email": "gamer@example.com", "bio": "GG EZ"},
]

COMMUNITY_DATA = [
    {
        "name": "tech_talk", "display": "Tech Talk 💻",
        "desc": "Everything tech, from Python to silicon.",
        "guidelines": "No flame wars over tabs vs spaces."
    },
    {
        "name": "digital_art", "display": "Digital Artistry 🎨",
        "desc": "Share your creations! (AI art allowed but tag it)",
        "guidelines": "Be nice to beginners!"
    },
    {
        "name": "memes_only", "display": "Dank Memes 🐸",
        "desc": "If it's not funny, don't post it.",
        "guidelines": "No reposts!"
    }
]

SAMPLE_POSTS = [
    "Just deployed my first full-stack app! Feels good man.",
    "Anyone know how to center a div? asking for a friend...",
    "Check out this view from my hike today! [Image attached]",
    "Why is coffee literally the best invention ever?",
    "Python 3.14 is coming out soon, thoughts?",
    "My cat walked on my keyboard and fixed my bug. Senior Dev material.",
]

SAMPLE_COMMENTS = [
    "This is valid!", "Big mood.", "L + Ratio (jk)", "So aesthetic ✨",
    "Can you share the repo?", "Literally me.", "Underrated post.", "Real.",
    "Wait, explain this to me like I'm 5."
]

# Random generic images for "Actual Images"
IMAGE_URLS = [
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085",  # Tech
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713",  # Code
    "https://images.unsplash.com/photo-1517849845537-4d257902454a",  # Dog
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",  # Nature
]


async def create_user_helper(data):
    """Helper to create a user and auth entry cleanly."""
    password = "Password123!"
    salt_hash = SaltHash.create_salt_hash(password)
    try:
        new_user = await AuthenticationsUser.create_user(
            data["user"], data["name"], data["email"]
        )
        # Update bio and avatar manually via SQL since create_user might not take them
        await DATABASE.execute(
            "UPDATE Profiles SET bio = ?, avatar_url = ? WHERE user_id = ?",
            (data["bio"], f"https://api.dicebear.com/7.x/avataaars/svg?seed={data['user']}", new_user.user_id)
        )

        await DATABASE.execute(
            "INSERT INTO UserAuthentication (user_id, salt, password_hash) VALUES (?, ?, ?)",
            (new_user.user_id, salt_hash.salt, salt_hash.hash_value)
        )
        print(f"✅ Created user: {data['user']}")
        return new_user
    except Exception:
        print(f"⚠️ User {data['user']} already exists, fetching...")
        return await AuthenticationsUser.get_user_by_username(data["user"])


async def main():
    print("--- 🚀 STARTING SEED PROCESS ---")
    await DATABASE.initialize()
    await CONFIG.load_config()

    # 1. Create Users
    all_users = []
    for u_data in USER_DATA:
        user = await create_user_helper(u_data)
        all_users.append(user)

    # 2. Create Communities
    all_communities = []
    for c_data in COMMUNITY_DATA:
        owner = all_users[0]  # First user owns them for simplicity
        try:
            comm = await Community.create_community(
                community_name=c_data["name"],
                display_name=c_data["display"],
                owner=owner,
                description=c_data["desc"],
                icon_url=None,
                post_guidelines=c_data["guidelines"],
                messages_guidelines=None,
                offline_text="Offline",
                online_text="Online"
            )
            print(f"✅ Created Community: {c_data['display']}")
        except Exception:
            print(f"⚠️ Community {c_data['name']} exists, fetching...")
            comm = await Community.get_community_by_name(c_data["name"])

        all_communities.append(comm)

        # 3. Add random members to communities
        # Shuffle users so membership is random
        potential_members = all_users[1:]
        random.shuffle(potential_members)
        for member in potential_members[:4]:  # Add 4 random members
            try:
                await comm.add_member(member.user_id)
            except:
                pass  # Already a member

    # 4. Create Posts, Comments, Likes, and Events
    print("--- 📝 GENERATING CONTENT ---")

    for comm in all_communities:
        # Create 3-5 posts per community
        for _ in range(random.randint(3, 5)):
            author = random.choice(all_users)
            content = random.choice(SAMPLE_POSTS)
            img = random.choice(IMAGE_URLS) if random.random() > 0.6 else None  # 40% chance of image

            post = await Post.create(
                content=content,
                community_id=comm.community_id,
                author_id=author.user_id,
                image_url=img
            )

            # Create Likes for this post (using raw SQL as PostLike class wasn't imported)
            for liker in random.sample(all_users, k=random.randint(1, len(all_users))):
                try:
                    await DATABASE.execute(
                        "INSERT OR IGNORE INTO PostLikes (post_id, user_id) VALUES (?, ?)",
                        (post.post_id, liker.user_id)
                    )
                except Exception as e:
                    print(f"Like Error: {e}")

            # Create Comments
            for _ in range(random.randint(1, 4)):
                commentor = random.choice(all_users)
                c_text = random.choice(SAMPLE_COMMENTS)
                await Comment.create(c_text, post_id=post.post_id, author_id=commentor.user_id)

    # 5. Create Events (Raw SQL since Event class isn't in imports)
    print("--- 📅 SCHEDULING EVENTS ---")
    if all_communities:
        # Tech Meetup
        await DATABASE.execute("""
                               INSERT INTO Events (event_name, event_description, scheduled_date, event_location,
                                                   community_id, creator_id, image_url)
                               VALUES (?, ?, DATETIME('now', '+7 days'), ?, ?, ?, ?)
                               """, ("Python Workshop", "Learn async python!", "Discord Voice",
                                     all_communities[0].community_id, all_users[0].user_id,
                                     "https://images.unsplash.com/photo-1515879433151-3d85c4303e0b"))

        # Gaming Night
        if len(all_communities) > 2:
            await DATABASE.execute("""
                                   INSERT INTO Events (event_name, event_description, scheduled_date, event_location,
                                                       community_id, creator_id)
                                   VALUES (?, ?, DATETIME('now', '+2 days'), ?, ?, ?)
                                   """, ("Among Us Night", "Very sus behaviors allowed.", "Lobby 1",
                                         all_communities[2].community_id, all_users[-1].user_id))

    print("--- 🎉 SEEDING COMPLETE! ---")


if __name__ == "__main__":
    asyncio.run(main())