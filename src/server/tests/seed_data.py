import asyncio
import random
from datetime import datetime, timedelta

# Import your actual classes
from config.config import CONFIG
from global_src.db import DATABASE
from global_src.global_classes import User, Community
from modules.authentications.data_classes import AuthenticationsUser, SaltHash
from modules.posts import Post, Comment
from modules.events import Event, EventAttendance
from modules.onboarding.Onboarding import Onboarding
from modules.chat_model import ChatMessage

# --- 🛠️ CONFIGURATION ---
NUM_USERS = 30
NUM_POSTS = 120
NUM_EVENTS = 15
NUM_CHATS = 50
PROB_SENIOR = 0.3

# --- 🎭 DATA POOLS ---
USER_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Robin", "Drew", "Cameron", "Sam",
              "Quinn", "Avery", "Dakota", "Reese"]
SURNAMES = ["Lee", "Tan", "Wong", "Smith", "Chen", "Lim", "Raju", "Koh", "Teo", "Ng", "Yap", "Chua"]
REGIONS = ["North", "South", "East", "West", "Central"]
PRONOUNS = ["he/him", "she/her", "they/them", "she/they", "he/they"]
INTERESTS_LIST = ["Coding", "Knitting", "Gaming", "Hiking", "Cooking", "Tai Chi", "Photography", "K-Pop", "History",
                  "Tech", "Investing", "Gardening"]

# --- 🗣️ SLANG & CONTENT ---
SLANG_WORDS = [
    "no cap", "fr", "slay", "bet", "bop", "mood", "salty", "flex", "tea",
    "shook", "simp", "ghost", "vibe", "goat", "extra", "stan", "low-key",
    "high-key", "sus", "rizz", "delulu", "ate", "finna", "gyatt"
]

TOPICS = {
    "General": "Just hanging out.",
    "Tech": "Talking about the latest gadgets and code.",
    "Food": "Best hawker spots in SG.",
    "Wellness": "Mental health and physical fitness.",
    "Retro": "Remembering the good old days."
}

POST_TEMPLATES_YOUNG = [
    "Honestly, {topic} is a whole {slang}.",
    "The way I love {topic} is {slang} fr.",
    "{topic} just makes me feel so {slang}.",
    "Anyone else think {topic} is kinda {slang}?",
    "Just dropped a new project on {topic}. It {slang}.",
    "Current mood: {slang}.",
    "Can't believe {topic} exists. {slang} behavior.",
    "Woke up and chose {topic}. No regrets."
]

POST_TEMPLATES_SENIOR = [
    "I really enjoyed the {topic} session today.",
    "Does anyone know where to find good {topic} classes?",
    "Back in my day, {topic} was very different.",
    "Sharing a photo from my morning walk. Lovely weather.",
    "How do I use this feature? Still learning.",
    "Wonderful to see so many young people interested in {topic}.",
    "Looking for recommendations for {topic}. Thank you!",
    "Had a lovely tea time discussing {topic}."
]

# --- 📅 SLANG EVENT TEMPLATES (NEW!) ---
EVENT_NAMES_SLANG = [
    "{topic} Vibe Check Session",
    "The Ultimate {topic} Slay",
    "High-Key {topic} Workshop",
    "{topic} Rizz Party",
    "No Cap: Best {topic} Meetup",
    "{topic} & Chill",
    "The {topic} Flex-Off"
]

EVENT_DESC_SLANG = [
    "Come through if you're not basic. It's gonna be {slang}.",
    "We finna discuss everything about {topic}. Don't ghost us!",
    "If you miss this, you're honestly {slang}.",
    "Big vibes only. Join us for a {slang} time.",
    "Strictly for the {slang} ones. Haters stay home."
]


async def clean_db():
    print("🗑️  Cleaning Database...")
    tables = [
        "EventAttendance", "Events", "CommentLikes", "PostLikes", "Comments",
        "Posts", "ChatMessage", "Memberships", "Communities",
        "OnboardingInformation", "UserAuthentication", "Profiles", "AuthTokens"
    ]
    for table in tables:
        await DATABASE.execute(f"DELETE FROM {table}")
        await DATABASE.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}'")
    await DATABASE.commit()


async def create_full_user(username, display_name, age, bio, interests, email=None):
    """Helper to create Profile + Auth + Onboarding using Class Methods."""
    if not email:
        email = f"{username}@example.com"

    password = "Password123!"

    try:
        # 1. Create Profile
        user_obj = await AuthenticationsUser.create_user(
            username=username,
            display_name=display_name,
            email=email,
            bio=bio,
            avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"
        )

        # 2. Create Auth (Manual insert required as per your sample code)
        salt_hash = SaltHash.create_salt_hash(password)
        await DATABASE.execute(
            "INSERT INTO UserAuthentication (user_id, salt, password_hash) VALUES (?, ?, ?)",
            (user_obj.user_id, salt_hash.salt, salt_hash.hash_value)
        )

        # 3. Register Onboarding
        region = random.choice(REGIONS)
        pronoun = random.choice(PRONOUNS)

        await Onboarding.register_onboarding(
            user_id=user_obj.user_id,
            age=age,
            interests=interests,
            pronouns=pronoun,
            region=region
        )

        return await AuthenticationsUser.get_user(user_obj.user_id)

    except Exception as e:
        print(f"❌ Error creating user {username}: {e}")
        return None


async def main():
    print("🚀 STARTING SEED PROCESS...")
    await DATABASE.initialize()
    await CONFIG.load_config()

    await clean_db()

    # --- 1. CREATE ADMINS ---
    print("\n👑 Creating Admins...")
    admin_young = await create_full_user(
        "cyber_ninja", "Ninja Coder", 22,
        "Full stack dev. I love caffeine and code.", "Coding, Gaming"
    )
    admin_senior = await create_full_user(
        "senior_sage", "Madam Mary", 72,
        "Retired teacher. Loving this new app!", "History, Knitting"
    )

    # --- 2. CREATE RANDOM USERS ---
    print(f"\n👥 Creating {NUM_USERS} Users...")
    all_users = [admin_young, admin_senior]

    for i in range(NUM_USERS):
        is_senior = random.random() < PROB_SENIOR
        age = random.randint(65, 85) if is_senior else random.randint(18, 28)
        fname = random.choice(USER_NAMES)
        lname = random.choice(SURNAMES)
        username = f"{fname}{lname}{random.randint(10, 99)}".lower()

        u = await create_full_user(
            username,
            f"{fname} {lname}",
            age,
            f"Just a {'retired' if is_senior else 'student'} living in {random.choice(REGIONS)}.",
            ", ".join(random.sample(INTERESTS_LIST, 2))
        )
        if u: all_users.append(u)

    # --- 3. CREATE COMMUNITIES ---
    print("\n🏘️ Creating Communities...")
    communities = []

    for name, desc in TOPICS.items():
        comm_name = name.lower().replace(" ", "") + "hub"
        comm = await Community.create_community(
            community_name=comm_name,
            display_name=f"{name} Lounge",
            owner=admin_young,
            description=desc,
            icon_url=f"https://api.dicebear.com/7.x/identicon/svg?seed={comm_name}",
            post_guidelines="1. Be nice.\n2. No spam.",
            messages_guidelines="Respect everyone.",
            offline_text="Offline",
            online_text="Online"
        )
        communities.append(comm)

        # Add members
        await comm.add_member(admin_young.user_id, role="admin")
        await comm.add_member(admin_senior.user_id, role="admin")
        for u in all_users[2:]:
            if random.random() > 0.3:
                await comm.add_member(u.user_id, role="member")

    # --- 4. CREATE POSTS ---
    print(f"\n📝 Generating {NUM_POSTS} Posts...")
    all_posts = []

    for i in range(NUM_POSTS):
        u = random.choice(all_users)
        c = random.choice(communities)

        # Check Age for Content Style
        onboarding = await Onboarding.get_onboarding(u.user_id)
        is_senior_user = onboarding.age >= 60 if onboarding else False
        topic = random.choice(list(TOPICS.keys()))

        if is_senior_user:
            content = random.choice(POST_TEMPLATES_SENIOR).format(topic=topic)
        else:
            slang = random.choice(SLANG_WORDS)
            content = random.choice(POST_TEMPLATES_YOUNG).format(topic=topic, slang=slang)

        img_url = f"https://picsum.photos/seed/{i}/500/300" if random.random() < 0.25 else None

        post = await Post.create(content=content, community_id=c.community_id, author_id=u.user_id, image_url=img_url)
        if post: all_posts.append(post)

        # --- 5. CREATE COMMENTS ---
        print("\n💬 Generating Comments...")
        all_comments = []  # <--- NEW: Store comments so we can like them later

        for post in all_posts:
            for _ in range(random.randint(0, 4)):
                u = random.choice(all_users)
                slang = random.choice(SLANG_WORDS)
                text = f"That's {slang}!" if random.random() > 0.5 else "Great post! Thanks for sharing."

                # Capture the comment object
                comment = await Comment.create(content=text, post_id=post.post_id, author_id=u.user_id)
                if comment:
                    all_comments.append(comment)

        # --- 5.5. GENERATE POST LIKES ---
        print("\n❤️ Spreading the Love (Post Likes)...")
        from modules.posts import Like

        for post in all_posts:
            if random.random() < 0.8:
                num_likes = random.randint(1, 10)
                likers = random.sample(all_users, min(num_likes, len(all_users)))
                for liker in likers:
                    await Like.toggle_post_like(post.post_id, liker.user_id)

        # --- 5.6. GENERATE COMMENT LIKES (NEW!) ---
        print("\n👍 Liking Comments...")
        for comment in all_comments:
            # 60% chance a comment gets liked
            if random.random() < 0.6:
                # 1 to 5 likes per comment
                num_likes = random.randint(1, 5)
                likers = random.sample(all_users, min(num_likes, len(all_users)))

                for liker in likers:
                    await Like.toggle_comment_like(comment.comment_id, liker.user_id)

        # ... (Continue to CREATE EVENTS) ...

    # --- 6. CREATE EVENTS (WITH SLANG!) ---
    print("\n📅 Creating Events...")
    for c in communities:
        for i in range(2):
            creator = random.choice(all_users)

            # Identify the topic string (e.g. "Tech" from "Tech Lounge")
            topic_key = c.display_name.split(" ")[0]
            slang = random.choice(SLANG_WORDS)

            # 60% chance of SLANG EVENT
            if random.random() > 0.4:
                evt_name = random.choice(EVENT_NAMES_SLANG).format(topic=topic_key, slang=slang)
                evt_desc = random.choice(EVENT_DESC_SLANG).format(topic=topic_key, slang=slang)
            else:
                evt_name = f"{c.display_name} Monthly Meetup"
                evt_desc = "Join us for a friendly gathering."

            event = await Event.create(
                event_name=evt_name,
                event_description=evt_desc,
                scheduled_date=(datetime.now() + timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d %H:%M:%S'),
                event_location="Community Hub Lvl 2",
                community_id=c.community_id,
                creator_id=creator.user_id,
                image_url=f"https://picsum.photos/seed/evt{c.community_id}{i}/600/400"
            )

            # Attendance
            attendees = random.sample(all_users, k=random.randint(3, 8))
            for attendee in attendees:
                await EventAttendance.toggle_interest(event.event_id, attendee.user_id)

    # --- 7. CREATE CHATS ---
    print("\n💭 Filling Chat Logs...")
    for _ in range(NUM_CHATS):
        c = random.choice(communities)
        u = random.choice(all_users)
        slang = random.choice(SLANG_WORDS)
        msg = f"Yo, this community is {slang}." if random.random() > 0.5 else "Good morning everyone!"

        await ChatMessage.create_message(community_id=c.community_id, author_id=u.user_id, content=msg)

    print("\n✅ SEED COMPLETE!")
    print(f"🔹 Young Admin: cyber_ninja / Password123!")
    print(f"🔹 Senior Admin: senior_sage / Password123!")


if __name__ == "__main__":
    asyncio.run(main())