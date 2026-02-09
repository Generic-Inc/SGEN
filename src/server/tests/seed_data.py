import asyncio
from config.config import CONFIG
from global_src.db import DATABASE
from global_src.global_classes import User, Community
from modules.authentications import SaltHash, AuthenticationsUser
from modules.posts import Post, Comment

# --- 1. USERS (Hardcoded) ---
USERS = [
    {"user": "cyber_ninja", "name": "Ninja Coder", "email": "ninja@example.com",
     "bio": "Full Stack Dev | Python Enthusiast 🐍 | Coffee Lover ☕"},
    {"user": "artistic_soul", "name": "Bella Arts", "email": "bella@example.com",
     "bio": "Digital Illustrator & UI Designer 🎨"},
    {"user": "gym_rat_99", "name": "Brad Lifts", "email": "brad@example.com", "bio": "Gains > Bugs. Keep grinding. 💪"},
    {"user": "travel_bug", "name": "Wanderlust", "email": "travel@example.com",
     "bio": "Digital Nomad. Currently in: Bali 🌴"},
    {"user": "coffee_addict", "name": "Java Bean", "email": "coffee@example.com", "bio": "I turn coffee into code."},
    {"user": "gaming_god", "name": "Pro Gamer", "email": "gamer@example.com", "bio": "FPS & RPGs. Add me on Steam."},
]

# --- 2. COMMUNITIES (Hardcoded) ---
COMMUNITIES = [
    {
        "key": "tech", "name": "tech_talk", "display": "Tech Talk 💻",
        "desc": "Discussion for developers, engineers, and tech enthusiasts.",
        "guidelines": "Be respectful. No flame wars over tabs vs spaces.",
        "members": ["cyber_ninja", "coffee_addict", "gaming_god", "artistic_soul"]
    },
    {
        "key": "art", "name": "creative_corner", "display": "Creative Corner 🎨",
        "desc": "Share your art, UI designs, and creative projects.",
        "guidelines": "Constructive criticism only.",
        "members": ["cyber_ninja", "artistic_soul", "travel_bug"]
    },
    {
        "key": "gym", "name": "iron_paradise", "display": "Iron Paradise 🏋️",
        "desc": "Workouts, nutrition, and fitness goals.",
        "guidelines": "No steroids discussion.",
        "members": ["cyber_ninja", "gym_rat_99", "travel_bug"]
    }
]

# --- 3. POSTS & CONVERSATIONS ---
POSTS_DATA = [
    {
        "community": "tech",
        "author": "cyber_ninja",
        "content": "Just finished refactoring the backend for SGEN. Moved everything to a modular architecture and it runs 2x faster now! 🚀 #python #flask",
        "image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
        "likes": ["coffee_addict", "gaming_god", "artistic_soul"],
        "comments": [
            {"user": "coffee_addict", "text": "That modular structure is a lifesaver. Did you use Blueprints?"},
            {"user": "cyber_ninja", "text": "Yep! Blueprints for everything. Makes routing so much cleaner."},
            {"user": "gaming_god", "text": "Huge W. Now help me fix my spaghetti code lol."}
        ]
    },
    {
        "community": "tech",
        "author": "coffee_addict",
        "content": "Why does CSS Grid make so much sense but Flexbox still confuses me sometimes? Centering a div is the hardest problem in CS. Change my mind.",
        "image": None,
        "likes": ["cyber_ninja", "artistic_soul"],
        "comments": [
            {"user": "artistic_soul", "text": "Flexbox is for 1D, Grid is for 2D! Once it clicks, you can't go back."},
            {"user": "cyber_ninja",
             "text": "justify-content: center; align-items: center; -> memorized this purely out of trauma."}
        ]
    },
    {
        "community": "art",
        "author": "artistic_soul",
        "content": "Working on a new UI kit for mobile apps. Going for a 'Glassmorphism' look. Thoughts on this color palette?",
        "image": "https://images.unsplash.com/photo-1586717791821-3f44a5638d0f",
        "likes": ["cyber_ninja", "travel_bug"],
        "comments": [
            {"user": "travel_bug", "text": "Love those pastels! Gives me sunset vibes."},
            {"user": "cyber_ninja",
             "text": "Looks clean! Make sure the contrast is high enough for accessibility though."}
        ]
    },
    {
        "community": "gym",
        "author": "gym_rat_99",
        "content": "Hit a new PR on deadlifts today! 180kg moving smooth. Consistency is key fam. 😤",
        "image": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
        "likes": ["cyber_ninja", "travel_bug"],
        "comments": [
            {"user": "cyber_ninja", "text": "Beast mode! 💪 I'm still stuck at 140kg, need to fix my form."},
            {"user": "gym_rat_99", "text": "You got this bro. Just focus on the brace. Let's hit a session next week?"}
        ]
    },
    {
        "community": "gym",
        "author": "cyber_ninja",
        "content": "Coding all day = back pain. 🥲 Anyone got good stretching routines for desk workers?",
        "image": None,
        "likes": ["gym_rat_99", "travel_bug"],
        "comments": [
            {"user": "travel_bug", "text": "Yoga helps a ton! Look up 'Yoga for programmers' on YouTube."},
            {"user": "gym_rat_99", "text": "Face pulls and dead hangs. Saves your shoulders."}
        ]
    }
]

# --- 4. EVENTS ---
EVENTS_DATA = [
    {
        "community": "tech",
        "creator": "cyber_ninja",
        "name": "Hackathon 2026 Kickoff",
        "desc": "Join us for a 24-hour coding sprint! Pizza provided. 🍕",
        "image": "https://images.unsplash.com/photo-1504384308090-c54be3855833"
    },
    {
        "community": "gym",
        "creator": "gym_rat_99",
        "name": "Group HIIT Session",
        "desc": "Burn those weekend calories. Open to all fitness levels.",
        "image": "https://images.unsplash.com/photo-1571902943202-507ec2618e8f"
    }
]


async def create_user_helper(data):
    """Helper to create or fetch a user."""
    password = "Password123!"
    salt_hash = SaltHash.create_salt_hash(password)
    try:
        new_user = await AuthenticationsUser.create_user(
            data["user"], data["name"], data["email"]
        )
        # Dicebear avatar
        avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={data['user']}"

        await DATABASE.execute(
            "UPDATE Profiles SET bio = ?, avatar_url = ? WHERE user_id = ?",
            (data["bio"], avatar_url, new_user.user_id)
        )
        await DATABASE.execute(
            "INSERT INTO UserAuthentication (user_id, salt, password_hash) VALUES (?, ?, ?)",
            (new_user.user_id, salt_hash.salt, salt_hash.hash_value)
        )
        print(f"✅ Created user: {data['user']}")
        return new_user
    except Exception:
        print(f"⚠️ User {data['user']} exists, fetching...")
        return await AuthenticationsUser.get_user_by_username(data["user"])


async def main():
    print("--- 🚀 STARTING CONTROLLED SEED PROCESS ---")
    await DATABASE.initialize()
    await CONFIG.load_config()

    user_map = {}
    community_map = {}

    # 1. Create Users
    print("\n--- 👤 Creating Users ---")
    for u_data in USERS:
        user = await create_user_helper(u_data)
        if user:
            user_map[u_data["user"]] = user
        else:
            # Fallback in case create_user returns False on duplicate and create_user_helper fails
            user_map[u_data["user"]] = await AuthenticationsUser.get_user_by_username(u_data["user"])

    # 2. Create Communities & Memberships
    print("\n--- 🏘️ Creating Communities ---")
    for c_data in COMMUNITIES:
        owner = user_map["cyber_ninja"]

        # --- FIXED LOGIC HERE ---
        # The .create_community method returns False (boolean) if it exists, NOT an error.
        # So we check "if not comm" instead of try/except.
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

        if not comm:
            print(f"⚠️ Community {c_data['name']} exists, fetching...")
            comm = await Community.get_community_by_name(c_data["name"])
        else:
            print(f"✅ Created Community: {c_data['display']}")

        community_map[c_data["key"]] = comm

        # Add Members
        for username in c_data["members"]:
            member = user_map[username]
            try:
                await comm.add_member(member.user_id)
            except:
                pass

                # 3. Create Posts & Conversations
    print("\n--- 📝 Creating Content ---")
    for p_data in POSTS_DATA:
        comm = community_map[p_data["community"]]
        author = user_map[p_data["author"]]

        post = await Post.create(
            content=p_data["content"],
            community_id=comm.community_id,
            author_id=author.user_id,
            image_url=p_data["image"]
        )
        print(f"  📝 Post by {p_data['author']} in {p_data['community']}")

        for liker_name in p_data["likes"]:
            liker = user_map[liker_name]
            try:
                await DATABASE.execute(
                    "INSERT OR IGNORE INTO PostLikes (post_id, user_id) VALUES (?, ?)",
                    (post.post_id, liker.user_id)
                )
            except Exception:
                pass

        for c_data in p_data["comments"]:
            commentor = user_map[c_data["user"]]
            await Comment.create(
                content=c_data["text"],
                post_id=post.post_id,
                author_id=commentor.user_id
            )
            print(f"    💬 Comment by {c_data['user']}")

    # 4. Create Events
    print("\n--- 📅 Scheduling Events ---")
    for e_data in EVENTS_DATA:
        comm = community_map[e_data["community"]]
        creator = user_map[e_data["creator"]]

        # Check if event already exists to prevent duplicates on re-run
        check = await DATABASE.fetch_one("SELECT event_id FROM Events WHERE event_name=?", (e_data["name"],))
        if not check:
            await DATABASE.execute("""
                                   INSERT INTO Events (event_name, event_description, scheduled_date, event_location,
                                                       community_id, creator_id, image_url)
                                   VALUES (?, ?, DATETIME('now', '+5 days'), ?, ?, ?, ?)
                                   """,
                                   (e_data["name"], e_data["desc"], "Discord / Gym", comm.community_id, creator.user_id,
                                    e_data["image"]))
            print(f"  📅 Event Created: {e_data['name']}")
        else:
            print(f"  ⚠️ Event Exists: {e_data['name']}")

    print("\n--- 🎉 SEEDING COMPLETE! ---")
    print("Login with: cyber_ninja / Password123!")


if __name__ == "__main__":
    asyncio.run(main())