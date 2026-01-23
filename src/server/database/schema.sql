-- 1. PROFILES & COMMUNITIES (The Core)

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
AFTER UPDATE ON Profiles
FOR EACH ROW
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
AFTER UPDATE ON Communities
FOR EACH ROW
BEGIN
    UPDATE Communities SET modified = (DATETIME('now', 'localtime')) WHERE community_id = OLD.community_id;
END;

CREATE TRIGGER IF NOT EXISTS InsertCommunityNameLower
BEFORE INSERT ON Communities
FOR EACH ROW
BEGIN
    UPDATE Communities SET community_name = lower(NEW.community_name) WHERE community_id = NEW.community_id;
END;

CREATE TRIGGER IF NOT EXISTS UpdateCommunityNameLower
BEFORE UPDATE ON Communities
FOR EACH ROW
BEGIN
    UPDATE Communities SET community_name = lower(NEW.community_name) WHERE community_id = NEW.community_id;
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

CREATE TRIGGER IF NOT EXISTS UpdateMembershipsModified
AFTER UPDATE ON Memberships
FOR EACH ROW
BEGIN
    UPDATE Memberships SET modified = (DATETIME('now', 'localtime')) WHERE member_id = OLD.member_id AND community_id = OLD.community_id;
END;

-- 2. CONTENT (Posts & Comments)

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

CREATE TRIGGER IF NOT EXISTS UpdatePostsModified
AFTER UPDATE ON Posts FOR EACH ROW
BEGIN
    UPDATE Posts SET modified = (DATETIME('now', 'localtime')) WHERE post_id = OLD.post_id;
END;

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

CREATE TRIGGER IF NOT EXISTS UpdateCommentsModified
AFTER UPDATE ON Comments FOR EACH ROW
BEGIN
    UPDATE Comments SET modified = (DATETIME('now', 'localtime')) WHERE comment_id = OLD.comment_id;
END;

-- 3. INTERACTION (Likes & Membership)

CREATE TABLE IF NOT EXISTS PostLikes (
    like_id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INT NOT NULL,
    created DATETIME DEFAULT (DATETIME('now', 'localtime')),

    FOREIGN KEY (post_id) REFERENCES Posts(post_id),
    FOREIGN KEY (user_id) REFERENCES Profiles(user_id),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS CommentLikes (
    like_id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id INTEGER NOT NULL,
    user_id INT NOT NULL,
    created DATETIME DEFAULT (DATETIME('now', 'localtime')),

    FOREIGN KEY (comment_id) REFERENCES Comments(comment_id),
    FOREIGN KEY (user_id) REFERENCES Profiles(user_id),
    UNIQUE(comment_id, user_id)
);

-- 4. SEED DATA (Defaults)

INSERT INTO Profiles (username, display_name, _email, bio)
VALUES("admin", "Admin", "ryankgithub@gmail.com", "Hi im Ryan")
ON CONFLICT(username) DO NOTHING;

INSERT INTO Communities (community_name, display_name, owner_id, description)
VALUES("sgen", "SGEN Community", 1, "The official community for SGEN users.")
ON CONFLICT(community_name) DO NOTHING;