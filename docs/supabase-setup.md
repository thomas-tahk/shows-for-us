# Supabase Database Setup Guide

## Prerequisites
- Supabase account (free tier available)
- Database schema files created in `backend/src/database/`

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose organization and project name: `shows-for-us`
5. Generate a secure database password
6. Select a region (preferably close to your users)
7. Click "Create new project"

## Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Project API Key** (anon, public)
   - **Project API Key** (service_role, secret)

## Step 3: Set Up Environment Variables

1. In your backend directory, create a `.env` file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit the `.env` file with your Supabase credentials:
   ```env
   # Server Configuration
   PORT=3001
   
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_KEY=your_service_key_here
   
   # Database
   DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres
   
   # External APIs (to be added later)
   TICKETMASTER_API_KEY=your_ticketmaster_api_key
   BROADWAY_API_BASE_URL=https://api.broadway.com
   ```

## Step 4: Create Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `backend/src/database/schema.sql`
3. Paste into the SQL Editor
4. Click "Run" to execute the schema creation

This will create:
- All tables (musicals, cast_members, venues, productions, performances, etc.)
- Indexes for performance optimization
- Row Level Security (RLS) policies
- Triggers for automatic timestamp updates

## Step 5: Add Sample Data (Optional)

1. In the SQL Editor, copy the contents of `backend/src/database/sample-data.sql`
2. Paste and run to populate with sample data
3. This includes sample musicals like Hamilton, Wicked, Lion King, etc.

## Step 6: Verify Setup

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Test the health endpoint:
   ```bash
   curl http://localhost:3001/health
   ```

3. You should see:
   ```json
   {
     "status": "OK",
     "timestamp": "2024-07-18T...",
     "database": "Connected"
   }
   ```

## Step 7: Test API Endpoints

Test the musicals endpoint:
```bash
curl http://localhost:3001/api/musicals
```

Test the cast members endpoint:
```bash
curl http://localhost:3001/api/cast-members
```

## Database Schema Overview

### Core Tables
- **musicals**: Show information (Hamilton, Wicked, etc.)
- **cast_members**: Performer information
- **venues**: Theater/venue information with geographic data
- **productions**: Specific runs of musicals (Broadway, touring)
- **performances**: Individual show dates and times
- **roles**: Cast member roles in productions

### User Tables
- **users**: User profiles and preferences
- **user_favorites**: User's tracked musicals/performers
- **feed_items**: Personalized feed content

### Features Included
- **Full-text search**: GIN indexes for fuzzy search
- **Geographic queries**: PostGIS for location-based features
- **Row Level Security**: User data protection
- **Automatic timestamps**: Created/updated timestamps
- **Foreign key constraints**: Data integrity

## Security Notes

- **API Keys**: Never commit API keys to version control
- **RLS Policies**: Only users can access their own data
- **Public Data**: Core show/venue data is publicly readable
- **Service Role**: Use service role key only for admin operations

## Next Steps

1. Test all API endpoints
2. Set up Ticketmaster API integration
3. Implement fuzzy search functionality
4. Add authentication routes
5. Create frontend integration

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check your SUPABASE_URL and SUPABASE_ANON_KEY
   - Verify your project is active in Supabase dashboard

2. **Permission errors**
   - Check Row Level Security policies
   - Ensure you're using the correct API key

3. **Schema errors**
   - Verify all extensions are enabled (uuid-ossp, postgis)
   - Check for any SQL syntax errors in schema.sql

### Getting Help

- Check Supabase documentation: https://supabase.com/docs
- Review our project documentation in `docs/`
- Check the development log for session notes