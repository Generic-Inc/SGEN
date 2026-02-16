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

# --- 👑 ADMIN 1: THE SPEEDY NINJA (Young) ---
ADMIN1_USERNAME = "cyber_ninja"
ADMIN1_EMAIL = "ninja@example.com"
ADMIN1_NAME = "Ninja Coder"
ADMIN1_AGE = 25

# --- 👴 ADMIN 2: THE SENIOR NINJA (Senior) ---
ADMIN2_USERNAME = "senior_ninja"
ADMIN2_EMAIL = "senior@example.com"
ADMIN2_NAME = "Elder Sage"
ADMIN2_AGE = 72

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
    await DATABASE.execute("DELETE FROM OnboardingInformation")  # Clear onboarding
    await DATABASE.execute("DELETE FROM Profiles")
    await DATABASE.commit()


async def create_user(username, email, name, age, password="Password123!"):
    salt_hash = SaltHash.create_salt_hash(password)
    avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"

    # 1. Create Profile
    await DATABASE.execute(
        "INSERT INTO Profiles (username, _email, display_name, bio, avatar_url) VALUES (?, ?, ?, ?, ?)",
        (username, email, name, "Generated User", avatar_url)
    )

    user_row = await DATABASE.fetch_one("SELECT user_id FROM Profiles WHERE username = ?", (username,))
    user_id = user_row[0]

    # 2. Create Auth
    await DATABASE.execute(
        "INSERT INTO UserAuthentication (user_id, salt, password_hash) VALUES (?, ?, ?)",
        (user_id, salt_hash.salt, salt_hash.hash_value)
    )

    # 3. Create Onboarding Entry (This is what your frontend checks!)
    await DATABASE.execute(
        "INSERT INTO OnboardingInformation (user_id, age) VALUES (?, ?)",
        (user_id, age)
    )

    return user_id


async def main():
    print("--- 🚀 STARTING MASSIVE SEED ---")
    await DATABASE.initialize()
    await CONFIG.load_config()

    await reset_db()

    user_ids = []

    # 0. CREATE ADMIN USERS
    print(f"\n--- 👑 Creating Admins ---")
    try:
        ninja_id = await create_user(ADMIN1_USERNAME, ADMIN1_EMAIL, ADMIN1_NAME, ADMIN1_AGE, ADMIN_PASSWORD)
        senior_id = await create_user(ADMIN2_USERNAME, ADMIN2_EMAIL, ADMIN2_NAME, ADMIN2_AGE, ADMIN_PASSWORD)
        user_ids.extend([ninja_id, senior_id])
        print(f"  ✅ Ninja Admin Created: {ADMIN1_USERNAME} (Age: {ADMIN1_AGE})")
        print(f"  ✅ Senior Admin Created: {ADMIN2_USERNAME} (Age: {ADMIN2_AGE})")
    except Exception as e:
        print(f"  ❌ Failed to create admins: {e}")
        return

    # 1. GENERATE RANDOM USERS
    print(f"\n--- 👤 Generating {NUM_USERS} Random Users ---")
    for i in range(NUM_USERS):
        adj = random.choice(ADJECTIVES)
        name = random.choice(USER_NAMES)
        username = f"{adj}_{name}_{random.randint(10, 999)}".lower()
        email = f"{username}@example.com"
        age = random.randint(18, 85)  # Random ages for the crowd

        try:
            uid = await create_user(username, email, f"{adj} {name}", age)
            user_ids.append(uid)
            if i % 10 == 0: print(f"  Created {i} users...")
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
            (c_name.lower(), f"{topic} Lounge", c_desc, ninja_id)
        )
        row = await DATABASE.fetch_one("SELECT community_id FROM Communities WHERE community_name = ?",
                                       (c_name.lower(),))
        cid = row[0]
        community_ids.append(cid)
        print(f"  Created Community: {topic} Lounge")

    # 3. JOIN USERS TO COMMUNITIES
    print("\n--- 🤝 Joining Users to Communities ---")
    # Join BOTH Admins to ALL communities
    for cid in community_ids:
        await DATABASE.execute(
            "INSERT OR IGNORE INTO Memberships (community_id, member_id, role) VALUES (?, ?, 'admin')", (cid, ninja_id))
        await DATABASE.execute(
            "INSERT OR IGNORE INTO Memberships (community_id, member_id, role) VALUES (?, ?, 'admin')",
            (cid, senior_id))

    # Join random users to random communities
    for uid in user_ids:
        if uid in [ninja_id, senior_id]: continue
        joined = random.sample(community_ids, k=2)
        for cid in joined:
            await DATABASE.execute("INSERT OR IGNORE INTO Memberships (community_id, member_id) VALUES (?, ?)",
                                   (cid, uid))

    # 4. GENERATE POSTS
    print(f"\n--- 📝 Generating Posts ---")
    total_posts = 0
    post_ids = []

    for uid in user_ids:
        for _ in range(random.randint(1, POSTS_PER_USER)):
            cid = random.choice(community_ids)
            topic = random.choice(TOPICS)
            slang = random.choice(SLANG_WORDS)

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

    # 5. GENERATE COMMENTS
    print(f"\n--- 💬 Generating Interactions ---")
    for pid in post_ids:
        num_comments = random.randint(0, COMMENTS_PER_POST)
        for _ in range(num_comments):
            commentor = random.choice(user_ids)
            slang = random.choice(SLANG_WORDS)
            template = random.choice(COMMENT_TEMPLATES)
            text = template.format(slang=slang)

            await DATABASE.execute("INSERT INTO Comments (content, post_id, author_id) VALUES (?, ?, ?)",
                                   (text, pid, commentor))

    await DATABASE.commit()
    print("\n--- 🎉 MASSIVE SEED COMPLETE! ---")
    print(f"Option 1 (Young): {ADMIN1_USERNAME} / {ADMIN_PASSWORD}")
    print(f"Option 2 (Senior): {ADMIN2_USERNAME} / {ADMIN_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())