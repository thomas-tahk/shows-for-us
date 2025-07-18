# Testing Setup Guide

## Prerequisites for Testing

### 1. Environment Setup
Before testing, you need to configure your environment:

```bash
# Navigate to backend directory
cd backend

# Copy environment template
cp .env.example .env

# Edit .env file with your credentials:
# - SUPABASE_URL: Your Supabase project URL
# - SUPABASE_ANON_KEY: Your Supabase anon key
# - TICKETMASTER_API_KEY: Your Ticketmaster API key (optional for basic testing)
```

### 2. Database Setup
Make sure your Supabase database is running:

1. Create Supabase project (if not done)
2. Run the SQL schema from `backend/src/database/schema.sql`
3. Optionally run sample data from `backend/src/database/sample-data.sql`

### 3. Install Dependencies
```bash
# In backend directory
npm install

# Start the development server
npm run dev
```

## Testing Endpoints

### Basic Health Check
```bash
# Test if server is running
curl http://localhost:3001/health

# Expected response:
# {
#   "status": "OK",
#   "timestamp": "2024-07-18T...",
#   "database": "Connected"
# }
```

### Test Database Connection
```bash
# Test musicals endpoint (should work even without Ticketmaster)
curl http://localhost:3001/api/musicals

# Expected response:
# {
#   "success": true,
#   "data": [...],
#   "message": "Musicals retrieved successfully"
# }
```

### Test Ticketmaster Integration
```bash
# Check Ticketmaster API status
curl http://localhost:3001/api/ticketmaster/status

# If configured correctly:
# {
#   "success": true,
#   "data": {
#     "configured": true,
#     "connected": true,
#     "status": "operational"
#   }
# }

# If not configured:
# {
#   "success": true,
#   "data": {
#     "configured": false,
#     "connected": false,
#     "status": "not_configured"
#   }
# }
```

### Test Data Import (Requires Ticketmaster API Key)
```bash
# Import musical events from New York
curl -X POST http://localhost:3001/api/import/musicals \
  -H "Content-Type: application/json" \
  -d '{"city": "New York", "stateCode": "NY", "limit": 10}'

# Check import statistics
curl http://localhost:3001/api/import/stats
```

## Testing Without Ticketmaster API Key

If you don't have a Ticketmaster API key, you can still test:

1. **Database operations**: All musical and cast member endpoints
2. **Search functionality**: Once we implement fuzzy search
3. **Sample data**: Use the sample data SQL file to populate test data

## Testing With Ticketmaster API Key

To get a Ticketmaster API key:

1. Go to https://developer.ticketmaster.com/
2. Create an account
3. Create a new app
4. Copy the Consumer Key (this is your API key)
5. Add it to your `.env` file as `TICKETMASTER_API_KEY`

## Common Test Scenarios

### 1. Search for Musicals
```bash
# Search by name
curl "http://localhost:3001/api/musicals?search=hamilton"

# Search by genre
curl "http://localhost:3001/api/musicals?genre=Musical"

# With pagination
curl "http://localhost:3001/api/musicals?limit=5&offset=0"
```

### 2. Get Musical Details
```bash
# Get specific musical (replace with actual ID)
curl "http://localhost:3001/api/musicals/[MUSICAL_ID]"

# Get musical with productions
curl "http://localhost:3001/api/musicals/[MUSICAL_ID]/productions"
```

### 3. Search Live Events
```bash
# Search for musicals in your area
curl "http://localhost:3001/api/ticketmaster/musicals?city=Chicago&stateCode=IL"

# Search all events
curl "http://localhost:3001/api/ticketmaster/events?keyword=hamilton"
```

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials in `.env`
- Check if Supabase project is active
- Ensure schema has been applied

### Ticketmaster API Issues
- Verify API key is correct
- Check API quota/rate limits
- Ensure proper query parameters

### Server Won't Start
- Check if port 3001 is available
- Verify all dependencies are installed
- Check for TypeScript compilation errors

## What to Look For

### Successful Responses
- Status codes: 200 (GET), 201 (POST)
- `success: true` in response body
- Proper data structure matching our types

### Error Responses
- Status codes: 400 (bad request), 500 (server error)
- `success: false` in response body
- Meaningful error messages

### Performance
- Response times under 1 second for basic queries
- Proper handling of large result sets
- No memory leaks during extended testing

## Testing Notes

- **No automated tests yet** - All testing is manual for now
- **Rate limiting** - Be mindful of Ticketmaster API limits
- **Data persistence** - Imported data stays in database
- **Clear data** - Use `DELETE /api/import/clear` to reset (development only)