-- Notification Service Database Schema
-- Database: lava_auto_notifications

-- Create enum types
CREATE TYPE notification_type AS ENUM ('INFO', 'WASHER_ASSIGNED', 'WASHER_ON_WAY', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'PAYMENT_REMINDER', 'PROMOTION');

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table (for chat)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(30) PRIMARY KEY,
    sender_id VARCHAR(30) NOT NULL,
    sender_role VARCHAR(20),
    receiver_id VARCHAR(30) NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
