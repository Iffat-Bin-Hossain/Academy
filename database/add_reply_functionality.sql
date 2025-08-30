-- Add reply functionality to messages table
ALTER TABLE messages ADD COLUMN reply_to_message_id BIGINT;
ALTER TABLE messages ADD COLUMN reply_to_content TEXT;
ALTER TABLE messages ADD COLUMN reply_to_sender_name VARCHAR(255);

-- Add foreign key constraint for reply_to_message_id
ALTER TABLE messages ADD CONSTRAINT fk_messages_reply_to_message 
    FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Add index for better performance on reply queries
CREATE INDEX idx_messages_reply_to_message_id ON messages(reply_to_message_id);
