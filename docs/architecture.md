# Technical Architecture

## System Overview

Shows For Us is a full-stack web application built with modern technologies to provide a scalable, maintainable platform for tracking musical performances.

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (fast development and optimized builds)
- **Styling**: TBD (CSS Modules, Tailwind, or styled-components)
- **State Management**: TBD (Context API, Zustand, or Redux Toolkit)
- **Routing**: React Router
- **HTTP Client**: Axios or Fetch API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **API Design**: RESTful APIs with JSON responses
- **Validation**: TBD (Zod, Joi, or express-validator)

### Database
- **Primary**: PostgreSQL (via Supabase)
- **Features**: ACID transactions, JSON support, full-text search
- **Hosting**: Supabase (managed PostgreSQL)
- **Migrations**: Supabase migrations or custom scripts

### External APIs
- **Ticketmaster Discovery API**: Event and venue data
- **Broadway API**: Musical and cast information
- **Browser Geolocation API**: User location services

## Data Architecture

### Core Entities

```
Musical
├── id: string (UUID)
├── name: string
├── description: string?
├── genre: string
├── originalBroadwayRun: object?
├── createdAt: timestamp
└── updatedAt: timestamp

Production
├── id: string (UUID)
├── musicalId: string (FK)
├── name: string
├── type: 'broadway' | 'touring' | 'regional'
├── status: 'active' | 'upcoming' | 'completed'
├── createdAt: timestamp
└── updatedAt: timestamp

Performance
├── id: string (UUID)
├── productionId: string (FK)
├── venueId: string (FK)
├── date: date
├── time: time
├── ticketUrl: string?
├── availability: enum
├── createdAt: timestamp
└── updatedAt: timestamp

Venue
├── id: string (UUID)
├── name: string
├── address: string
├── city: string
├── state: string
├── zipCode: string
├── latitude: number
├── longitude: number
├── capacity: number?
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Relationships
- **Musical** → **Production** (1:many)
- **Production** → **Performance** (1:many)
- **Venue** → **Performance** (1:many)
- **User** → **UserFavorite** (1:many)
- **CastMember** → **Role** (1:many)
- **Production** → **Role** (1:many)

## API Design

### RESTful Endpoints

```
GET    /api/musicals              # List musicals with search/filter
GET    /api/musicals/:id          # Get specific musical
GET    /api/musicals/:id/productions  # Get productions for musical

GET    /api/productions           # List productions with search/filter
GET    /api/productions/:id       # Get specific production
GET    /api/productions/:id/performances  # Get performances for production

GET    /api/performances          # List performances with search/filter
GET    /api/performances/:id      # Get specific performance

GET    /api/venues                # List venues with search/filter
GET    /api/venues/:id            # Get specific venue
GET    /api/venues/:id/performances  # Get performances at venue

GET    /api/cast-members          # List cast members with search/filter
GET    /api/cast-members/:id      # Get specific cast member

POST   /api/search               # Fuzzy search across all entities
GET    /api/search/suggestions   # Search suggestions/autocomplete

GET    /api/user/favorites       # Get user's favorites
POST   /api/user/favorites       # Add favorite
DELETE /api/user/favorites/:id   # Remove favorite

GET    /api/user/feed            # Get personalized feed
GET    /api/user/alerts          # Get proximity alerts
```

### Response Format
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful",
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

## Search Architecture

### Fuzzy Search Implementation
- **Primary**: PostgreSQL full-text search with similarity scoring
- **Fallback**: Levenshtein distance for typo tolerance
- **Indexing**: GIN indexes on searchable text fields
- **Ranking**: Relevance scoring based on popularity and recency

### Search Features
- **Typo Tolerance**: "hamiton" → "Hamilton"
- **Partial Matching**: "wicked chic" → "Wicked Chicago"
- **Semantic Search**: "that lion musical" → "The Lion King"
- **Autocomplete**: Real-time suggestions as user types

## Caching Strategy

### Application-Level Caching
- **Memory Cache**: Frequently accessed data (Redis or in-memory)
- **API Response Cache**: Cache external API responses
- **Database Query Cache**: Cache expensive database operations

### Browser Caching
- **Static Assets**: Long-term caching for CSS, JS, images
- **API Responses**: Short-term caching for search results
- **User Data**: Local storage for user preferences

## Security Considerations

### Data Protection
- **Environment Variables**: All sensitive data in .env files
- **API Keys**: Stored securely, never in client-side code
- **Database Access**: Connection pooling with secure credentials
- **CORS**: Configured for frontend domain only

### Authentication & Authorization
- **Supabase Auth**: Handle user authentication
- **JWT Tokens**: Secure session management
- **Role-based Access**: Different permissions for different user types
- **Rate Limiting**: Prevent API abuse

## Performance Optimization

### Backend Performance
- **Database Indexing**: Proper indexes on frequently queried fields
- **Connection Pooling**: Efficient database connections
- **Compression**: Gzip compression for API responses
- **Pagination**: Limit large result sets

### Frontend Performance
- **Code Splitting**: Lazy loading of routes and components
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: Responsive images and lazy loading
- **Caching**: Aggressive caching of static assets

## Deployment Architecture

### Development Environment
- **Local Development**: Docker Compose for consistent environment
- **Hot Reloading**: Vite for frontend, nodemon for backend
- **Database**: Local Supabase instance or cloud development database

### Production Environment
- **Hosting**: Digital Ocean droplets or App Platform
- **Database**: Supabase managed PostgreSQL
- **CDN**: CloudFlare or similar for static assets
- **SSL**: Let's Encrypt or managed SSL certificates

## Monitoring & Logging

### Application Monitoring
- **Error Tracking**: Sentry or similar service
- **Performance Monitoring**: Application metrics and response times
- **Database Monitoring**: Query performance and connection health
- **API Monitoring**: External API response times and failures

### Logging Strategy
- **Structured Logging**: JSON format for easy parsing
- **Log Levels**: Error, warn, info, debug
- **Log Rotation**: Prevent log files from growing too large
- **Centralized Logging**: Collect logs from all services

## Future Considerations

### Scalability
- **Microservices**: Split into smaller services as needed
- **Load Balancing**: Distribute traffic across multiple instances
- **Database Sharding**: Horizontal scaling for large datasets
- **Message Queues**: Asynchronous processing for heavy operations

### Feature Expansion
- **Mobile Apps**: React Native or native iOS/Android
- **Real-time Updates**: WebSocket connections for live data
- **Machine Learning**: Recommendation engine for shows
- **Social Features**: User reviews and ratings