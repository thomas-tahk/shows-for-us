# Claude Development Context

This file contains the context and decisions made during Claude-assisted development of the Shows For Us project.

## Project Overview
Full-stack web application for tracking traveling musical performances and cast members in the US. Focus on musicals initially, with potential expansion to other performing arts and global locations.

## Key Decisions Made

### Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript  
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (email/password + social login)
- **Hosting**: Digital Ocean
- **External APIs**: Ticketmaster Discovery API + Broadway API (GitHub)

### Development Approach
- **Start with**: Data modeling + API integration first
- **Authentication**: Add after core functionality is working
- **Search**: Implement fuzzy search from the start
- **Location**: Browser geolocation API with manual fallback

### Data Architecture
- **Musical** → **Production** → **Performance** hierarchy
- Productions represent specific tours/runs of a musical
- Performances are individual shows at venues
- Users can track both musicals generally and specific productions

## Claude Instructions
- Update documentation as project progresses
- Focus on user-friendly UI/UX
- Keep costs minimal (side project)
- Prioritize core features over nice-to-haves
- Always run linting/typechecking before considering tasks complete
- Ticketmaster returns the same performance under several events and keyword hits on other acts ("Ryan Hamilton"). De-dupe, require the title to lead the name, and test with real-shape fixtures that include near-miss names (#10)

## Development Commands
- Frontend: `npm run dev` (from frontend/)
- Backend: `npm run dev` (from backend/)
- Backend build: `npm run build` (from backend/)

## Current Session Progress
- ✅ Project initialized with proper structure
- ✅ TypeScript types defined for all data models
- ✅ Basic Express server setup
- ✅ Environment variable security configured
- ✅ Documentation structure created
- ✅ Supabase database setup with comprehensive schema
- ✅ API routes for musicals and cast members
- ✅ Ticketmaster API integration with full service layer
- ✅ Data import system for populating database from external APIs
- 🔄 Next: Test the API integration and add fuzzy search

## Notes for Future Claude Sessions
- Project name: "shows-for-us"
- User prefers explanations when trying new technologies
- Focus on MVP features first, expand later
- User has Digital Ocean hosting available
- Fuzzy search is important for user experience