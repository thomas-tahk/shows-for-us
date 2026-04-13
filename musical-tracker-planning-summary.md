# Musical Tracker Project - Planning Summary

## Project Overview
Full-stack web application for tracking traveling musical performances and cast members in the US. Focus on musicals initially, with potential expansion to other performing arts and global locations.

## Tech Stack (Confirmed)
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript  
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (email/password + social login)
- **Hosting**: Digital Ocean
- **External APIs**: Ticketmaster Discovery API + Broadway API (GitHub)

## Core MVP Features
### Must-Have
1. User authentication (email + social login)
2. Search & discovery (musicals and cast members)
3. Favorites/tracking system
4. Personalized performance feed
5. Proximity alerts (closest upcoming performance)
6. Profile pages (musicals and cast members)
7. US-only geolocation

### Nice-to-Have (Phase 2)
8. External ticketing links
9. Push notifications (opt-in)
10. Mobile responsive design

## Key Design Decisions

### Location Strategy
- Primary: Browser geolocation API (automatic)
- Fallback: Manual city/state selection
- Optional: Save location preference

### Data Model
- **Musical** (e.g., "Hamilton")
- **Production** (e.g., "Hamilton - Chicago 2024", "Hamilton - National Tour")
- **Performance** (specific date/venue/time)

### Data Refresh Strategy
- Critical data (upcoming performances): Every 6-12 hours
- Static data (cast info, show details): Daily
- News/updates: Every few hours during business hours
- Cost control: Aggressive caching, batch API calls

### Search Implementation
- Support both granular and vague searches
- Users can be as specific or general as they want
- Consider fuzzy search for "something I saw long ago" scenarios

### Feed Algorithm
Triggers for feed updates:
- New tour dates
- Cast changes
- Notable news (not reviews initially)
- Potential social media integration (future)

## Project Structure
```
musical-tracker/
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API calls to backend
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Helper functions
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Auth, validation, etc.
│   │   └── jobs/           # Background tasks (data sync)
├── shared/                  # Shared types between frontend/backend
└── docs/                   # Project documentation
```

## Data Sources Research
### Ticketmaster Discovery API
- 230K+ events available
- Supports arts & theater classification
- Event, attraction, venue, classification entities
- Free tier available
- Good for live performance data and tour schedules

### Broadway API (GitHub)
- REST API for Broadway musicals, actors, songs
- Focused on Broadway-specific data
- Good for show details and cast information

### Additional Sources
- IBDB (Internet Broadway Database) - Official Broadway info
- Playbill - Rich content (may need scraping)

## Authentication Research
- **Supabase Auth** chosen for:
  - Free up to 50k monthly active users
  - Includes PostgreSQL database
  - Built-in social login + email/password
  - Easy React integration
  - Open source (no vendor lock-in)

## Outstanding Questions for Next Session
1. Project name (affects folder names, package.json)
2. Start with authentication + basic search, or data modeling + API integration first?
3. Implement basic text search or fuzzy search from start?

## Next Steps
1. Initialize project repository and basic setup
2. Set up development environment
3. Create basic project structure
4. Begin with either auth setup or data modeling (to be decided)

## Development Notes
- Keep costs minimal (side project)
- User-friendly UI/UX priority
- Start simple, expand later
- Consider mobile-first responsive design