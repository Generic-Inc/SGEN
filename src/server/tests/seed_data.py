import asyncio
import random
from config.config import CONFIG
from global_src.db import DATABASE
from modules.authentications import SaltHash

# --- CONFIGURATION ---
NUM_USERS = 50
NUM_COMMUNITIES = 5
POSTS_PER_USER = 5
COMMENTS_PER_POST = 3

# --- 👑 ADMIN CONFIG ---
ADMIN_USERNAME = "cyber_ninja"
ADMIN_EMAIL = "ninja@example.com"
ADMIN_NAME = "Ninja Coder"
ADMIN_PASSWORD = "Password123!"

# --- DATA POOLS ---
USER_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Robin", "Drew", "Cameron"]
ADJECTIVES = ["Happy", "Grumpy", "Sleepy", "Hyper", "Chill", "Crazy", "Silent", "Loud", "Mega", "Ultra"]
TOPICS = ["Tech", "Art", "Gym", "Food", "Travel", "Gaming", "Music", "Movie", "Book", "Code"]

# --- 🆕 GEN Z SLANG POOL ---
SLANG_WORDS = [
    "no cap", "fr", "slay", "bet", "bop", "mood", "salty", "flex", "tea",
    "shook", "simp", "ghost", "vibe", "goat", "extra", "stan", "low-key",
    "high-key", "sus", "rizz", "delulu", "ate", "finna"
]

POST_TEMPLATES = [
    "Just discovered {topic}! It's amazing.",
    "Why is {topic} so hard to master? 😭",
    "Unpopular opinion: {topic} is overrated.",
    "Anyone want to collab on a {topic} project?",
    "Finally hit my goals in {topic} today! 🚀",
    "Spending my whole weekend doing {topic}.",
    "What is the best resource for learning {topic}?",
    "I can't believe what happened in the {topic} world today.",
    "Honestly, {topic} is a whole {slang}.",
    "The way I love {topic} is {slang} fr.",
    "{topic} just makes me feel so {slang}.",
    "Anyone else think {topic} is kinda {slang}?",
]

COMMENT_TEMPLATES = [
    "Totally agree!", "No way, really?", "This is fire 🔥", "Can you explain more?",
    "Sent you a DM.", "LMAO 😂", "Big if true.", "Keep grinding!", "Nice work.", "Idk about that chief.",
    "That's {slang}!", "No cap, this is {slang}.", "You really {slang} with this one.",
    "Wait, are you being {slang}?", "Major {slang} vibes.", "Bro has {slang}."
]


async def reset_db():
    print("🗑️  Wiping Database...")
    await DATABASE.execute("DELETE FROM PostLikes")
    await DATABASE.execute("DELETE FROM Comments")
    await DATABASE.execute("DELETE FROM Posts")
    await DATABASE.execute("DELETE FROM Events")
    await DATABASE.execute("DELETE FROM Memberships")
    await DATABASE.execute("DELETE FROM Communities")
    await DATABASE.execute("DELETE FROM UserAuthentication")
    await DATABASE.execute("DELETE FROM Profiles")
    await DATABASE.commit()


async def create_user(username, email, name, password="Password123!", is_senior=0):
    salt_hash = SaltHash.create_salt_hash(password)
    avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"

    await DATABASE.execute(
        "INSERT INTO Profiles (username, _email, display_name, bio, avatar_url, is_senior) VALUES (?, ?, ?, ?, ?, ?)",
        (username, email, name, "Generated User", avatar_url, is_senior)
    )

    user_row = await DATABASE.fetch_one("SELECT user_id FROM Profiles WHERE username = ?", (username,))
    user_id = user_row[0]

    await DATABASE.execute(
        "INSERT INTO UserAuthentication (user_id, salt, password_hash) VALUES (?, ?, ?)",
        (user_id, salt_hash.salt, salt_hash.hash_value)
    )
    return user_id


async def main():
    print("--- 🚀 STARTING MASSIVE SEED ---")
    await DATABASE.initialize()
    await CONFIG.load_config()

    await reset_db()

    user_ids = []

    # 0. CREATE ADMIN USER
    print(f"\n--- 👑 Creating Admin User ({ADMIN_USERNAME}) ---")
    try:
        admin_id = await create_user(ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, is_senior=0)
        user_ids.append(admin_id)
        print(f"  ✅ Admin Created: {ADMIN_USERNAME} (ID: {admin_id})")
    except Exception as e:
        print(f"  ❌ Failed to create admin: {e}")
        return

    # 1. GENERATE RANDOM USERS
    print(f"\n--- 👤 Generating {NUM_USERS} Random Users ---")
    for i in range(NUM_USERS):
        adj = random.choice(ADJECTIVES)
        name = random.choice(USER_NAMES)
        username = f"{adj}_{name}_{random.randint(10, 999)}".lower()
        email = f"{username}@example.com"

        is_senior = 1 if random.random() < 0.3 else 0
        senior_badge = "👴" if is_senior else "dev"

        try:
            uid = await create_user(username, email, f"{adj} {name}", is_senior=is_senior)
            user_ids.append(uid)
            if i % 10 == 0: print(f"  Created {i} users... (Latest was {senior_badge})")
        except:
            pass

    # 2. GENERATE COMMUNITIES
    print(f"\n--- 🏘️ Generating {NUM_COMMUNITIES} Communities ---")
    community_ids = []
    for i in range(NUM_COMMUNITIES):
        topic = TOPICS[i]
        c_name = f"{topic}_Lounge_{random.randint(100, 999)}"
        c_desc = f"The place to discuss all things {topic}."

        await DATABASE.execute(
            "INSERT INTO Communities (community_name, display_name, description, owner_id) VALUES (?, ?, ?, ?)",
            (c_name.lower(), f"{topic} Lounge", c_desc, admin_id)
        )
        row = await DATABASE.fetch_one("SELECT community_id FROM Communities WHERE community_name = ?",
                                       (c_name.lower(),))
        cid = row[0]
        community_ids.append(cid)
        print(f"  Created Community: {topic} Lounge")

    # 3. JOIN USERS TO COMMUNITIES
    print("\n--- 🤝 Joining Users to Communities ---")
    for cid in community_ids:
        await DATABASE.execute("INSERT OR IGNORE INTO Memberships (community_id, member_id) VALUES (?, ?)",
                               (cid, admin_id))

    for uid in user_ids:
        if uid == admin_id: continue
        joined = random.sample(community_ids, k=2)
        for cid in joined:
            await DATABASE.execute("INSERT OR IGNORE INTO Memberships (community_id, member_id) VALUES (?, ?)",
                                   (cid, uid))

    # 4. GENERATE POSTS
    print(f"\n--- 📝 Generating ~{len(user_ids) * POSTS_PER_USER} Posts ---")
    total_posts = 0
    post_ids = []

    for uid in user_ids:
        for _ in range(random.randint(1, POSTS_PER_USER)):
            cid = random.choice(community_ids)
            topic = random.choice(TOPICS)
            slang = random.choice(SLANG_WORDS)  # Pick a random slang word

            # Format content with topic and potentially a slang word
            template = random.choice(POST_TEMPLATES)
            content = template.format(topic=topic, slang=slang)

            image_url = f"https://picsum.photos/seed/{random.randint(1, 1000)}/400/300" if random.random() > 0.7 else None

            await DATABASE.execute(
                "INSERT INTO Posts (content, community_id, author_id, image_url) VALUES (?, ?, ?, ?)",
                (content, cid, uid, image_url)
            )
            total_posts += 1
            row = await DATABASE.fetch_one("SELECT last_insert_rowid()")
            post_ids.append(row[0])

    await DATABASE.commit()
    print(f"  ✅ Created {total_posts} total posts.")

    # 5. GENERATE COMMENTS & LIKES
    print(f"\n--- 💬 Generating Interactions ---")
    for pid in post_ids:
        num_likes = random.randint(0, 10)
        likers = random.sample(user_ids, k=min(num_likes, len(user_ids)))
        for liker in likers:
            await DATABASE.execute("INSERT OR IGNORE INTO PostLikes (post_id, user_id) VALUES (?, ?)", (pid, liker))

        num_comments = random.randint(0, COMMENTS_PER_POST)
        for _ in range(num_comments):
            commentor = random.choice(user_ids)
            slang = random.choice(SLANG_WORDS)
            template = random.choice(COMMENT_TEMPLATES)
            text = template.format(slang=slang)  # Inject slang into comments too

            await DATABASE.execute("INSERT INTO Comments (content, post_id, author_id) VALUES (?, ?, ?)",
                                   (text, pid, commentor))

    await DATABASE.commit()
    print("\n--- 🎉 MASSIVE SEED COMPLETE! ---")
    print(f"Login with: {ADMIN_USERNAME} / {ADMIN_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())