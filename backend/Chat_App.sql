SELECT current_database();

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile_picture TEXT,
    bio TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);


CREATE TABLE rooms (
    room_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_name VARCHAR(100),
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('PRIVATE', 'PUBLIC')),
    created_by UUID REFERENCES users(user_id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_rooms_type ON rooms(room_type);

CREATE TABLE room_members (
    room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
    status VARCHAR(20) DEFAULT 'APPROVED' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id)
);


CREATE INDEX idx_room_members_user ON room_members(user_id);
CREATE INDEX idx_room_members_room ON room_members(room_id);



CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    encrypted_content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL 
        CHECK (message_type IN ('TEXT','IMAGE','FILE','VOICE')),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_messages_room ON messages(room_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);



CREATE TABLE message_status (
    message_id UUID REFERENCES messages(message_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL 
        CHECK (status IN ('SENT','DELIVERED','SEEN')),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, user_id)
);


CREATE INDEX idx_message_status_user ON message_status(user_id);

CREATE TABLE media (
    media_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(message_id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_message ON media(message_id);


CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    jwt_token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);

ALTER TABLE messages
ADD COLUMN search_vector tsvector;

CREATE INDEX idx_messages_search
ON messages USING GIN(search_vector);


CREATE OR REPLACE FUNCTION check_private_room_limit()
RETURNS TRIGGER AS $$
DECLARE
    member_count INT;
    room_type_value VARCHAR(20);
BEGIN
    SELECT room_type INTO room_type_value
    FROM rooms
    WHERE room_id = NEW.room_id;

    IF room_type_value = 'PRIVATE' THEN
        SELECT COUNT(*) INTO member_count
        FROM room_members
        WHERE room_id = NEW.room_id;

        IF member_count >= 2 THEN
            RAISE EXCEPTION 'Private room can only have 2 members';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



CREATE TRIGGER private_room_limit
BEFORE INSERT ON room_members
FOR EACH ROW
EXECUTE FUNCTION check_private_room_limit();





