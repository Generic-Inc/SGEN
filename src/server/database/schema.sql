-- 1. TABLE DEFINITIONS

CREATE TABLE IF NOT EXISTS Profiles (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(32) NOT NULL,
    display_name VARCHAR(64) NOT NULL,
    _email VARCHAR(254) NOT NULL,
    language VARCHAR(32) DEFAULT 'en',
    avatar_url VARCHAR(2048),
    bio VARCHAR(1024),
    created DATETIME DEFAULT (DATETIME('now', 'localtime')),
    modified DATETIME DEFAULT (DATETIME('now', 'localtime')),
    active TINYINT DEFAULT 1 CHECK(active IN (0, 1))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON Profiles(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON Profiles(_email);

CREATE TRIGGER IF NOT EXISTS UpdateProfilesModified
AFTER UPDATE ON Profiles FOR EACH ROW
BEGIN
    UPDATE Profiles SET modified = (DATETIME('now', 'localtime')) WHERE user_id = OLD.user_id;
END;

CREATE TABLE IF NOT EXISTS Communities (
    community_id INTEGER PRIMARY KEY AUTOINCREMENT,
    community_name VARCHAR(128) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    owner_id INT NOT NULL,
    description VARCHAR(2048),
    icon_url VARCHAR(2048),

    member_count INTEGER DEFAULT 0,

    posts_guidelines VARCHAR(4096),
    messages_guidelines VARCHAR(4096),
    offline_text VARCHAR(16),
    online_text VARCHAR(16),
    created DATETIME DEFAULT (DATETIME('now', 'localtime')),
    modified DATETIME DEFAULT (DATETIME('now', 'localtime')),
    active TINYINT DEFAULT 1 CHECK(active IN (0, 1)),
    FOREIGN KEY (owner_id) REFERENCES Profiles(user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_communities_name ON Communities(community_name);

CREATE TRIGGER IF NOT EXISTS UpdateCommunitiesModified
AFTER UPDATE ON Communities FOR EACH ROW
BEGIN
    UPDATE Communities SET modified = (DATETIME('now', 'localtime')) WHERE community_id = OLD.community_id;
END;

CREATE TABLE IF NOT EXISTS Memberships (
    member_id INT NOT NULL,
    community_id INT NOT NULL,
    role VARCHAR(32) DEFAULT 'member',
    created DATETIME DEFAULT (DATETIME('now', 'localtime')),
    modified DATETIME DEFAULT (DATETIME('now', 'localtime')),
    active TINYINT DEFAULT 1 CHECK(active IN (0, 1)),
    PRIMARY KEY (member_id, community_id),
    FOREIGN KEY (member_id) REFERENCES Profiles(user_id),
    FOREIGN KEY (community_id) REFERENCES Communities(community_id)
);

CREATE TABLE IF NOT EXISTS Posts (
    post_id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    image_url VARCHAR(2048),
    community_id INT NOT NULL,
    author_id INT NOT NULL,
    created DATETIME DEFAULT (DATETIME('now', 'localtime')),
    modified DATETIME DEFAULT (DATETIME('now', 'localtime')),
    active TINYINT DEFAULT 1 CHECK(active IN (0, 1)),
    FOREIGN KEY (community_id) REFERENCES Communities(community_id),
    FOREIGN KEY (author_id) REFERENCES Profiles(user_id)
);

CREATE TABLE IF NOT EXISTS Comments (
    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    post_id INTEGER NOT NULL,
    author_id INT NOT NULL,
    created DATETIME DEFAULT (DATETIME('now', 'localtime')),
    modified DATETIME DEFAULT (DATETIME('now', 'localtime')),
    active TINYINT DEFAULT 1 CHECK(active IN (0, 1)),
    FOREIGN KEY (post_id) REFERENCES Posts(post_id),
    FOREIGN KEY (author_id) REFERENCES Profiles(user_id)
);

CREATE TABLE IF NOT EXISTS PostLikes (
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY(post_id) REFERENCES Posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES Profiles(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS CommentLikes (
    comment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id, user_id),
    FOREIGN KEY(comment_id) REFERENCES Comments(comment_id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES Profiles(user_id) ON DELETE CASCADE
);

-- 2. SEED DATA
-- A. USERS
-- User 1: You (The Admin)
INSERT INTO Profiles (user_id, username, display_name, _email, bio, avatar_url)
VALUES(1, "admin", "Admin", "ryankgithub@gmail.com", "Hi im Ryan", "https://ui-avatars.com/api/?name=Ryan&background=0D8ABC&color=fff")
ON CONFLICT(user_id) DO NOTHING;

-- User 2: Jerma (The Poster)
INSERT INTO Profiles (username, display_name, _email, bio, avatar_url)
VALUES("jerma985", "Jerma", "jerma@twitch.tv", "Streamer and MBS enthusiast", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Jerma985_2019.png/640px-Jerma985_2019.png")
ON CONFLICT(username) DO NOTHING;

-- User 3: Charlie (The Patriot)
INSERT INTO Profiles (username, display_name, _email, bio, avatar_url)
VALUES("charlie_usa", "CharlieLovesMerica", "charlie@usa.com", "Freedom fan", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Cr1TiKaL_2018.jpg/640px-Cr1TiKaL_2018.jpg")
ON CONFLICT(username) DO NOTHING;

-- User 4: Joe Biden (Commenter)
INSERT INTO Profiles (username, display_name, _email, bio, avatar_url)
VALUES("joebiden", "Joe Biden", "joe@whitehouse.gov", "I love ice cream", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Joe_Biden_presidential_portrait.jpg/640px-Joe_Biden_presidential_portrait.jpg")
ON CONFLICT(username) DO NOTHING;

-- User 5: John Singapore (Commenter)
INSERT INTO Profiles (username, display_name, _email, bio, avatar_url)
VALUES("john_sg", "John Singapore", "john@sg.com", "I love Singapore", "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=500&auto=format&fit=crop")
ON CONFLICT(username) DO NOTHING;

-- User 6: Zhong Xi Na (Commenter)
INSERT INTO Profiles (username, display_name, _email, bio, avatar_url)
VALUES("xina", "Zhong Xi Na", "john@cena.com", "You cant see me", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/John_Cena_July_2018.jpg/640px-John_Cena_July_2018.jpg")
ON CONFLICT(username) DO NOTHING;

-- B. COMMUNITIES ---------------------------

INSERT INTO Communities (community_id, community_name, display_name, owner_id, description, member_count)
VALUES(1, "sgen", "SGEN Community", 1, "The official community for SGEN users.", 1205)
ON CONFLICT(community_id) DO NOTHING;

INSERT INTO Communities (community_id, community_name, display_name, owner_id, description, member_count)
VALUES(2, "sg_explorers", "SG Explorers", 2, "Interested in exploring SG with fellow community members? SG Explorers is the place! Join us for MBSDay and more.", 1207)
ON CONFLICT(community_id) DO NOTHING;

INSERT INTO Communities (community_id, community_name, display_name, owner_id, description, member_count)
VALUES(3, "sg_foodies", "SG Foodies", 5, "The best place to discuss Chicken Rice and Laksa.", 850)
ON CONFLICT(community_id) DO NOTHING;

-- C. MEMBERSHIPS
INSERT INTO Memberships (member_id, community_id) VALUES (2, 2) ON CONFLICT DO NOTHING;
INSERT INTO Memberships (member_id, community_id) VALUES (3, 2) ON CONFLICT DO NOTHING;
INSERT INTO Memberships (member_id, community_id) VALUES (4, 2) ON CONFLICT DO NOTHING;
INSERT INTO Memberships (member_id, community_id) VALUES (5, 2) ON CONFLICT DO NOTHING;

-- D. POSTS

-- Post 1: Charlie's Rally (ID 1)
INSERT INTO Posts (post_id, content, community_id, author_id, image_url, created)
VALUES (
    1,
    "RALLY AT MBS!!! #MBSday #MBSevent 'China, china china china, china 👄' - Trump",
    2, -- SG Explorers
    3, -- Charlie
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Donald_Trump_rally_in_Green_Bay%2C_Wisconsin_%2853293673752%29.jpg/1024px-Donald_Trump_rally_in_Green_Bay%2C_Wisconsin_%2853293673752%29.jpg",
    DATETIME('now', '-2 hours')
) ON CONFLICT(post_id) DO NOTHING;

-- Post 2: Jerma's Amazing Event (ID 2)
INSERT INTO Posts (post_id, content, community_id, author_id, image_url, created)
VALUES (
    2,
    "Amazing event at Marina Bay Sands #MBSday #MBSevent Today was a great day, I met and bonded alot with...",
    2, -- SG Explorers
    2, -- Jerma
    "https://images.unsplash.com/photo-1565967511849-76a60a516170?q=80&w=1000&auto=format&fit=crop",
    DATETIME('now', '-1 hours')
) ON CONFLICT(post_id) DO NOTHING;

-- Post 3: SGEN Welcome (ID 3)
INSERT INTO Posts (post_id, content, community_id, author_id, image_url, created)
VALUES (
    3,
    "Welcome to the platform! We are just getting started.",
    1, -- SGEN
    1, -- Admin
    NULL,
    DATETIME('now', '-1 day')
) ON CONFLICT(post_id) DO NOTHING;


-- E. COMMENTS

-- Joe Biden
INSERT INTO Comments (content, post_id, author_id)
VALUES ("Was a great event, but NO ICE CREAM SHOP! I want my chocolate chocolate chip!", 2, 4);

-- John Singapore
INSERT INTO Comments (content, post_id, author_id)
VALUES ("I loved MBS Day like I loved Singapore. Was a great event with great people, I can't wait to meet all of them again", 2, 5);

-- Zhong Xi Na
INSERT INTO Comments (content, post_id, author_id)
VALUES ("GREAT PICTURE!!! JUST LIKE MY HOMETOWN IN CHINA (view original)", 2, 6);

-- F. LIKES
INSERT INTO PostLikes (post_id, user_id) VALUES (2, 1) ON CONFLICT DO NOTHING;
INSERT INTO CommentLikes (comment_id, user_id) VALUES (1, 4) ON CONFLICT DO NOTHING;
INSERT INTO CommentLikes (comment_id, user_id) VALUES (2, 5) ON CONFLICT DO NOTHING;