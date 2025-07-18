-- Shows For Us Database Schema
-- PostgreSQL/Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS extension for geographic queries (if needed)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types
CREATE TYPE production_type AS ENUM ('broadway', 'touring', 'regional');
CREATE TYPE production_status AS ENUM ('active', 'upcoming', 'completed');
CREATE TYPE role_type AS ENUM ('lead', 'supporting', 'ensemble');
CREATE TYPE availability_status AS ENUM ('available', 'sold-out', 'limited');
CREATE TYPE favorite_type AS ENUM ('musical', 'cast_member', 'production');
CREATE TYPE feed_item_type AS ENUM ('performance_announcement', 'cast_change', 'news');

-- Musicals table
CREATE TABLE musicals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100) NOT NULL,
    original_broadway_run JSONB, -- {startDate, endDate, theater}
    external_ids JSONB, -- Store IDs from external APIs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cast members table
CREATE TABLE cast_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_image VARCHAR(500),
    external_ids JSONB, -- Store IDs from external APIs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venues table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    capacity INTEGER,
    external_ids JSONB, -- Store IDs from external APIs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productions table
CREATE TABLE productions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    musical_id UUID NOT NULL REFERENCES musicals(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type production_type NOT NULL,
    status production_status NOT NULL,
    external_ids JSONB, -- Store IDs from external APIs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performances table
CREATE TABLE performances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    performance_date DATE NOT NULL,
    performance_time TIME NOT NULL,
    ticket_url VARCHAR(500),
    availability availability_status NOT NULL DEFAULT 'available',
    external_ids JSONB, -- Store IDs from external APIs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles table (cast members in productions)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cast_member_id UUID NOT NULL REFERENCES cast_members(id) ON DELETE CASCADE,
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
    character_name VARCHAR(255) NOT NULL,
    role_type role_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (will integrate with Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY, -- Will match Supabase auth.users.id
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    max_distance INTEGER DEFAULT 50, -- miles
    preferred_genres TEXT[], -- array of genre strings
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User favorites table
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    favorite_type favorite_type NOT NULL,
    target_id UUID NOT NULL, -- ID of musical, cast_member, or production
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feed items table
CREATE TABLE feed_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type feed_item_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    related_musical_id UUID REFERENCES musicals(id) ON DELETE CASCADE,
    related_cast_member_id UUID REFERENCES cast_members(id) ON DELETE CASCADE,
    related_production_id UUID REFERENCES productions(id) ON DELETE CASCADE,
    image_url VARCHAR(500),
    source_url VARCHAR(500),
    published_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_musicals_name ON musicals(name);
CREATE INDEX idx_musicals_genre ON musicals(genre);
CREATE INDEX idx_cast_members_name ON cast_members(name);
CREATE INDEX idx_venues_city_state ON venues(city, state);
CREATE INDEX idx_venues_location ON venues(latitude, longitude);
CREATE INDEX idx_productions_musical_id ON productions(musical_id);
CREATE INDEX idx_productions_status ON productions(status);
CREATE INDEX idx_performances_production_id ON performances(production_id);
CREATE INDEX idx_performances_venue_id ON performances(venue_id);
CREATE INDEX idx_performances_date ON performances(performance_date);
CREATE INDEX idx_roles_cast_member_id ON roles(cast_member_id);
CREATE INDEX idx_roles_production_id ON roles(production_id);
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_type_target ON user_favorites(favorite_type, target_id);
CREATE INDEX idx_feed_items_type ON feed_items(type);
CREATE INDEX idx_feed_items_published_at ON feed_items(published_at);

-- Full-text search indexes
CREATE INDEX idx_musicals_name_gin ON musicals USING gin(to_tsvector('english', name));
CREATE INDEX idx_cast_members_name_gin ON cast_members USING gin(to_tsvector('english', name));
CREATE INDEX idx_productions_name_gin ON productions USING gin(to_tsvector('english', name));

-- Create composite indexes for common queries
CREATE INDEX idx_performances_date_venue ON performances(performance_date, venue_id);
CREATE INDEX idx_performances_production_date ON performances(production_id, performance_date);

-- Create functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
CREATE TRIGGER update_musicals_updated_at BEFORE UPDATE ON musicals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cast_members_updated_at BEFORE UPDATE ON cast_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productions_updated_at BEFORE UPDATE ON productions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performances_updated_at BEFORE UPDATE ON performances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own favorites" ON user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON user_favorites FOR ALL USING (auth.uid() = user_id);

-- Public read access for core data
ALTER TABLE musicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cast_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access to core data
CREATE POLICY "Public read access to musicals" ON musicals FOR SELECT USING (true);
CREATE POLICY "Public read access to cast_members" ON cast_members FOR SELECT USING (true);
CREATE POLICY "Public read access to venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Public read access to productions" ON productions FOR SELECT USING (true);
CREATE POLICY "Public read access to performances" ON performances FOR SELECT USING (true);
CREATE POLICY "Public read access to roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Public read access to feed_items" ON feed_items FOR SELECT USING (true);