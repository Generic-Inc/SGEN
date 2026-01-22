CREATE TABLE IF NOT EXISTS Profiles (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(32) NOT NULL,
    display_name VARCHAR(64) NOT NULL,
    _email VARCHAR(254) NOT NULL,
    language VARCHAR(32) DEFAULT 'en',
    avatar_url VARCHAR(2048),
    bio VARCHAR(1024),

    created DATETIME DEFAULT (DATETIME('now', 'localtime')),
    modified DATETIME DEFAULT (DATETIME('now', 'localtime'))
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

    FOREIGN KEY (owner_id) REFERENCES Profiles(user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_communities_name ON Communities(community_name);

CREATE TRIGGER IF NOT EXISTS UpdateCommunitiesModified
AFTER UPDATE ON Communities
FOR EACH ROW
BEGIN
    UPDATE Communities SET modified = (DATETIME('now', 'localtime')) WHERE community_id = OLD.community_id;
END;

CREATE TRIGGER InsertCommunityNameLower
BEFORE INSERT ON Communities
FOR EACH ROW
BEGIN
    UPDATE Communities SET community_name = lower(NEW.community_name) WHERE community_id = NEW.community_id;
END;

CREATE TRIGGER UpdateCommunityNameLower
BEFORE INSERT ON Communities
FOR EACH ROW
BEGIN
    UPDATE Communities SET community_name = lower(NEW.community_name) WHERE community_id = NEW.community_id;
END;

INSERT INTO Profiles (username, display_name, _email, bio)
VALUES("admin", "Admin", "ryankgithub@gmail.com", "Hi im Ryan")
ON CONFLICT(username) DO NOTHING;
INSERT INTO Communities (community_name, display_name, owner_id, description)
VALUES("sgen", "SGEN Community", 1, "The official community for SGEN users.")
ON CONFLICT(community_name) DO NOTHING;
