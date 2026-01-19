CREATE TABLE IF NOT EXISTS Profiles (
    user_id INT PRIMARY KEY,
    username VARCHAR(32) NOT NULL,
    display_name VARCHAR(64) NOT NULL,
    email VARCHAR(254) NOT NULL,
    language VARCHAR(32) DEFAULT "en",
    profile_picture_url VARCHAR(2048),
    bio VARCHAR(1024),

    created DATETIME DEFAULT DATETIME('now', 'localtime'),
    modified DATETIME DEFAULT DATETIME('now', 'localtime')
);

CREATE TRIGGER IF NOT EXISTS UpdateProfilesModified
AFTER UPDATE ON Profiles
FOR EACH ROW
BEGIN
    UPDATE Profiles SET modified = DATETIME('now', 'localtime') WHERE user_id = OLD.user_id;
END;

CREATE TABLE IF NOT EXISTS Communities (
    community_id VARCHAR(128) PRIMARY KEY,
    display_name VARCHAR(128) NOT NULL,
    owner_id INT NOT NULL,
    description VARCHAR(2048),
    icon_url VARCHAR(2048),
    posts_guidelines VARCHAR(4096),
    messages_guidelines VARCHAR(4096),
    offline_text VARCHAR(16),
    online_text VARCHAR(16),

    FOREIGN KEY (owner_id) REFERENCES Profiles(user_id),

    created DATETIME DEFAULT DATETIME('now', 'localtime'),
    modified DATETIME DEFAULT DATETIME('now', 'localtime')
);

CREATE TRIGGER IF NOT EXISTS UpdateCommunitiesModified
AFTER UPDATE ON Communities
FOR EACH ROW
BEGIN
    UPDATE Communities SET modified = DATETIME('now', 'localtime') WHERE community_id = OLD.community_id;
END;
