CREATE TABLE IF NOT EXISTS Profiles (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(32) NOT NULL,
    display_name VARCHAR(64) NOT NULL,
    _email VARCHAR(254) NOT NULL,
    language VARCHAR(32) NOT NULL DEFAULT 'en',
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
BEFORE INSERT ON Communities
FOR EACH ROW
BEGIN
    UPDATE Communities SET community_name = lower(NEW.community_name) WHERE community_id = NEW.community_id;
END;

CREATE TABLE IF NOT EXISTS ChatMessage(
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    community_id INT NOT NULL,
    author_id INT NOT NULL,
    content VARCHAR(2048) NOT NULL,

    created DATETIME DEFAULT (DATETIME('now', 'localtime')),
    modified DATETIME DEFAULT (DATETIME('now', 'localtime')),

    FOREIGN KEY (community_id) REFERENCES Communities(community_id),
    FOREIGN KEY (author_id) REFERENCES Profiles(user_id)
);


CREATE TRIGGER IF NOT EXISTS UpdateChatMessageModified
AFTER UPDATE ON ChatMessage
FOR EACH ROW
BEGIN
    UPDATE ChatMessage SET modified = DATETIME('now', 'localtime') WHERE message_id = OLD.message_id;
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

CREATE TABLE IF NOT EXISTS UserAuthentication (
    user_id INT PRIMARY KEY,
    password_hash VARCHAR(256) NOT NULL,
    salt VARCHAR(64) NOT NULL,

    created DATETIME DEFAULT (DATETIME('now', 'localtime')),
    modified DATETIME DEFAULT (DATETIME('now', 'localtime')),

    FOREIGN KEY (user_id) REFERENCES Profiles(user_id)
);

CREATE TRIGGER IF NOT EXISTS UpdateUserAuthenticationModified
AFTER UPDATE ON UserAuthentication
FOR EACH ROW
BEGIN
    UPDATE UserAuthentication SET modified = (DATETIME('now', 'localtime')) WHERE user_id = OLD.user_id;
END;

CREATE TABLE IF NOT EXISTS AuthTokens (
    token_hash VARCHAR(256) PRIMARY KEY,
    user_id INT NOT NULL,
    user_agent VARCHAR(512),

    created DATETIME DEFAULT (DATETIME('now', 'localtime')),
    last_used DATETIME DEFAULT (DATETIME('now', 'localtime')),

    FOREIGN KEY (user_id) REFERENCES Profiles(user_id)
);

CREATE TABLE IF NOT EXISTS EmailVerifications (
    email VARCHAR(254) PRIMARY KEY,
    verification_code VARCHAR(64) NOT NULL,
    username VARCHAR(32) NOT NULL,
    display_name VARCHAR(64) NOT NULL,
    language VARCHAR(32) DEFAULT 'en',
    avatar_url VARCHAR(2048),
    bio VARCHAR(1024),
    password_hash VARCHAR(256) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    created DATETIME DEFAULT (DATETIME('now', 'localtime')),
    is_verified TINYINT DEFAULT 0 CHECK(is_verified IN (0, 1))
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
CREATE TABLE IF NOT EXISTS Events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name VARCHAR(255) NOT NULL,
    event_description TEXT,
    scheduled_date DATETIME NOT NULL,
    event_location VARCHAR(255) NOT NULL,
    image_url VARCHAR(2048),
    community_id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL,
    created DATETIME DEFAULT (DATETIME('now', 'localtime')),
    modified DATETIME DEFAULT (DATETIME('now', 'localtime')),
    active TINYINT DEFAULT 1 CHECK(active IN (0, 1)),
    FOREIGN KEY (community_id) REFERENCES Communities(community_id),
    FOREIGN KEY (creator_id) REFERENCES Profiles(user_id)
);

CREATE TRIGGER IF NOT EXISTS UpdateEventsModified
AFTER UPDATE ON Events FOR EACH ROW
BEGIN
    UPDATE Events SET modified = (DATETIME('now', 'localtime')) WHERE event_id = OLD.event_id;
END;

CREATE TABLE IF NOT EXISTS EventAttendance (
    attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'interested' CHECK(status IN ('going', 'interested', 'not_going')),
    created DATETIME DEFAULT (DATETIME('now', 'localtime')),
    FOREIGN KEY (event_id) REFERENCES Events(event_id),
    FOREIGN KEY (user_id) REFERENCES Profiles(user_id),
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS Translations (
    translation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name VARCHAR(64) NOT NULL,
    column_name VARCHAR(64) NOT NULL,
    record_id INTEGER NOT NULL,
    record_column VARCHAR(64) NOT NULL,
    language VARCHAR(32) NOT NULL,
    translated_text TEXT NOT NULL,
    created DATETIME DEFAULT (DATETIME('now', 'localtime')),
    modified DATETIME DEFAULT (DATETIME('now', 'localtime'))
);

CREATE TRIGGER IF NOT EXISTS UpdateTranslationsModified
AFTER UPDATE ON Translations FOR EACH ROW
BEGIN
    UPDATE Translations SET modified = (DATETIME('now', 'localtime')) WHERE translation_id = OLD.translation_id;
end;

