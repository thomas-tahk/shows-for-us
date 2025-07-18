# Project Planning

## Vision
A user-friendly web application that helps musical theater enthusiasts discover and track traveling performances of musicals and cast members across the US.

## Core Features (MVP)

### Must-Have Features
1. **User Authentication** - Email/password + social login
2. **Search & Discovery** - Find musicals and cast members with fuzzy search
3. **Favorites/Tracking** - Save musicals and performers to follow
4. **Personalized Feed** - Updates for tracked content
5. **Proximity Alerts** - Show closest upcoming performance for tracked items
6. **Profile Pages** - Detailed views for musicals and cast members
7. **US-Only Geolocation** - Focus on US performances initially

### Nice-to-Have (Phase 2)
8. **External Ticketing Links** - Direct links to purchase tickets
9. **Push Notifications** - Optional alerts for upcoming shows
10. **Mobile Responsive** - Works well on all devices

## User Experience Goals
- Simple, intuitive interface
- Social media-like feed experience
- Support both expert and casual users
- Minimal friction for finding shows
- Automated location detection when possible

## Technical Approach

### Data Model Hierarchy
```
Musical (e.g., "Hamilton")
├── Production (e.g., "Hamilton - Chicago 2024")
│   ├── Performance (specific show date/time)
│   └── Cast Members (roles in this production)
└── Production (e.g., "Hamilton - National Tour")
    ├── Performance (different venues/dates)
    └── Cast Members (touring cast)
```

### Location Strategy
- **Primary**: Browser geolocation API (automatic)
- **Fallback**: Manual city/state selection
- **Storage**: Save user preference for return visits

### Search Strategy
- **Fuzzy Search**: Handle typos, partial matches, approximate spellings
- **Flexible Granularity**: Support both specific and vague searches
- **Examples**: "hamiton" → "Hamilton", "that lion musical" → "The Lion King"

### Feed Algorithm
Feed updates triggered by:
- New tour dates announced
- Cast changes in tracked productions
- Notable news about tracked musicals/performers
- Proximity alerts for upcoming shows

## Data Sources Research

### Ticketmaster Discovery API
- **Coverage**: 230K+ events, arts & theater classification
- **Data**: Events, venues, attractions, showtimes
- **Cost**: Free tier available
- **Best For**: Live performance data, tour schedules

### Broadway API (GitHub)
- **Coverage**: Broadway shows, cast, songs
- **Data**: Historical and current Broadway information
- **Cost**: Open source
- **Best For**: Musical details, cast information

### Data Refresh Strategy
- **Critical data** (upcoming performances): Every 6-12 hours
- **Static data** (show details, cast info): Daily
- **News/updates**: Every few hours during business hours
- **Cost Control**: Aggressive caching, batch API calls

## Constraints & Considerations
- **Geographic**: US-only initially
- **Budget**: Minimal costs (side project)
- **Scope**: Musicals only initially
- **Timeline**: MVP first, iterate based on usage
- **Performance**: Optimize for mobile and desktop web