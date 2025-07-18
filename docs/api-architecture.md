# API Architecture Explanation

## Overview: What We Just Built

Think of our musical tracking app like a restaurant with multiple layers:

1. **Database** (Kitchen Storage) - Where all our data lives
2. **API Services** (Kitchen Staff) - Who prepare and serve the data
3. **External APIs** (Food Suppliers) - Where we get fresh ingredients (live event data)
4. **Data Import System** (Receiving Department) - How we bring external data into our system

## Database Design: The Foundation

### The Hierarchy Concept

Our database follows a logical hierarchy that mirrors real-world musical theater:

```
Musical (Hamilton) 
    ↓
Production (Hamilton - Broadway 2024, Hamilton - National Tour 2024)
    ↓
Performance (Hamilton - Broadway - Dec 15, 2024 at 8:00 PM)
```

**Why this structure?**
- **Musical**: The creative work itself (like "Hamilton" or "Wicked")
- **Production**: A specific run of that musical (Broadway vs touring company)
- **Performance**: Individual show times at specific venues

### Key Tables and Relationships

#### Core Entertainment Data
- **musicals**: The shows themselves (Hamilton, Wicked, etc.)
- **cast_members**: The performers
- **venues**: Theaters and performance spaces
- **productions**: Specific runs of musicals
- **performances**: Individual show dates/times
- **roles**: Which actors play which characters in which productions

#### User Data
- **users**: User profiles and preferences
- **user_favorites**: What shows/actors users follow
- **feed_items**: Personalized news and updates

### Database Features We Added

1. **Full-Text Search**: GIN indexes allow fuzzy searching (find "Hamiltn" when searching for "Hamilton")
2. **Geographic Queries**: PostGIS extension for location-based searches
3. **Row Level Security**: Users can only see their own data
4. **Automatic Timestamps**: Database automatically tracks when records are created/updated
5. **Foreign Key Constraints**: Ensures data integrity (can't have a performance without a venue)

## API Service Layer: The Business Logic

### What Are Services?

Services are like specialized departments in a company:

- **TicketmasterService**: Handles all communication with Ticketmaster's API
- **DataImportService**: Converts external data into our internal format
- **DatabaseService**: Manages all database operations

### The Ticketmaster Integration

**Why Ticketmaster?**
- They have the most comprehensive live event data
- Real-time ticket availability
- Venue information with geographic coordinates
- Standardized event classifications

**How It Works:**
1. **API Client**: We created a service that speaks Ticketmaster's language
2. **Data Transformation**: Convert their format to our database structure
3. **Intelligent Parsing**: Extract musical names from event titles
4. **Venue Matching**: Find or create venues in our database

### Data Import System: The Bridge

This is the most complex part - it's like having a translator who:

1. **Fetches** events from Ticketmaster
2. **Parses** the data to understand what's a musical vs concert
3. **Maps** venues to our database (creating new ones if needed)
4. **Creates** the hierarchy: Musical → Production → Performance
5. **Handles** duplicates intelligently (don't create "Hamilton" twice)

## API Routes: The Interface

### User-Facing Routes
- `GET /api/musicals` - Browse all musicals
- `GET /api/musicals/:id` - Get specific musical details
- `GET /api/musicals/search/:term` - Search for musicals
- `GET /api/cast-members` - Browse performers

### External Data Routes
- `GET /api/ticketmaster/musicals` - Search live Ticketmaster data
- `GET /api/ticketmaster/events/:id` - Get specific event details
- `GET /api/ticketmaster/status` - Check if API is working

### Admin/Import Routes
- `POST /api/import/musicals` - Import data from Ticketmaster
- `GET /api/import/stats` - See how much data we have

## Why This Architecture?

### Separation of Concerns
- **Database**: Stores data efficiently
- **Services**: Handle business logic
- **Routes**: Provide clean API interface
- **Models**: Define data structure

### Scalability
- Can swap out Ticketmaster for another provider
- Can add more external APIs easily
- Database can handle millions of records
- Services can be moved to separate servers later

### Data Integrity
- Foreign keys prevent orphaned records
- Transactions ensure all-or-nothing imports
- Validation at multiple layers

### User Experience
- Fast searches with proper indexing
- Real-time data from external sources
- Personalized feeds and recommendations
- Location-based discovery

## Next Steps

1. **Test the integration** - Make sure Ticketmaster API works
2. **Add fuzzy search** - Improve search experience
3. **Frontend development** - Build the user interface
4. **Authentication** - Add user accounts
5. **Real-time updates** - Push notifications for new shows

This architecture gives us a solid foundation that can grow with the app's needs while maintaining clean, maintainable code.