-- Advanced search functions for Shows For Us
-- These PostgreSQL functions provide fuzzy search capabilities with scoring

-- Function to search musicals with ranking and fuzzy matching
CREATE OR REPLACE FUNCTION search_musicals(search_term TEXT, result_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  name VARCHAR(255),
  description TEXT,
  genre VARCHAR(100),
  original_broadway_run JSONB,
  external_ids JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  search_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      m.*,
      -- Calculate search ranking based on multiple factors
      (
        -- Exact name match gets highest score
        CASE WHEN LOWER(m.name) = LOWER(search_term) THEN 1.0
        -- Name starts with search term gets high score
        WHEN LOWER(m.name) LIKE LOWER(search_term || '%') THEN 0.9
        -- Name contains search term gets medium score
        WHEN LOWER(m.name) LIKE LOWER('%' || search_term || '%') THEN 0.7
        ELSE 0.0 END +
        
        -- Genre matching
        CASE WHEN LOWER(m.genre) LIKE LOWER('%' || search_term || '%') THEN 0.3
        ELSE 0.0 END +
        
        -- Description matching (lower weight)
        CASE WHEN LOWER(m.description) LIKE LOWER('%' || search_term || '%') THEN 0.2
        ELSE 0.0 END +
        
        -- Full-text search ranking (if available)
        COALESCE(
          ts_rank(
            to_tsvector('english', COALESCE(m.name, '') || ' ' || COALESCE(m.description, '') || ' ' || COALESCE(m.genre, '')),
            plainto_tsquery('english', search_term)
          ), 0.0
        ) * 0.4
      ) AS search_rank
    FROM musicals m
    WHERE 
      -- Match across multiple fields
      (
        LOWER(m.name) LIKE LOWER('%' || search_term || '%') OR
        LOWER(m.description) LIKE LOWER('%' || search_term || '%') OR
        LOWER(m.genre) LIKE LOWER('%' || search_term || '%') OR
        to_tsvector('english', COALESCE(m.name, '') || ' ' || COALESCE(m.description, '') || ' ' || COALESCE(m.genre, '')) 
        @@ plainto_tsquery('english', search_term)
      )
  )
  SELECT 
    sr.id,
    sr.name,
    sr.description,
    sr.genre,
    sr.original_broadway_run,
    sr.external_ids,
    sr.created_at,
    sr.updated_at,
    sr.search_rank
  FROM search_results sr
  WHERE sr.search_rank > 0
  ORDER BY sr.search_rank DESC, sr.name ASC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get search suggestions (autocomplete)
CREATE OR REPLACE FUNCTION get_search_suggestions(search_term TEXT, suggestion_limit INTEGER DEFAULT 5)
RETURNS TABLE(
  suggestion TEXT,
  type TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH musical_suggestions AS (
    SELECT 
      m.name as suggestion,
      'musical' as type,
      CASE 
        WHEN LOWER(m.name) LIKE LOWER(search_term || '%') THEN 1.0
        WHEN LOWER(m.name) LIKE LOWER('%' || search_term || '%') THEN 0.7
        ELSE 0.5
      END as relevance
    FROM musicals m
    WHERE LOWER(m.name) LIKE LOWER('%' || search_term || '%')
  ),
  genre_suggestions AS (
    SELECT 
      DISTINCT m.genre as suggestion,
      'genre' as type,
      CASE 
        WHEN LOWER(m.genre) LIKE LOWER(search_term || '%') THEN 0.9
        WHEN LOWER(m.genre) LIKE LOWER('%' || search_term || '%') THEN 0.6
        ELSE 0.4
      END as relevance
    FROM musicals m
    WHERE LOWER(m.genre) LIKE LOWER('%' || search_term || '%')
  )
  SELECT * FROM (
    SELECT * FROM musical_suggestions
    UNION ALL
    SELECT * FROM genre_suggestions
  ) combined_suggestions
  WHERE relevance > 0.3
  ORDER BY relevance DESC, suggestion ASC
  LIMIT suggestion_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to search cast members with fuzzy matching
CREATE OR REPLACE FUNCTION search_cast_members(search_term TEXT, result_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  name VARCHAR(255),
  bio TEXT,
  profile_image VARCHAR(500),
  external_ids JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  search_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      cm.*,
      (
        -- Exact name match gets highest score
        CASE WHEN LOWER(cm.name) = LOWER(search_term) THEN 1.0
        -- Name starts with search term gets high score
        WHEN LOWER(cm.name) LIKE LOWER(search_term || '%') THEN 0.9
        -- Name contains search term gets medium score
        WHEN LOWER(cm.name) LIKE LOWER('%' || search_term || '%') THEN 0.7
        ELSE 0.0 END +
        
        -- Bio matching (lower weight)
        CASE WHEN LOWER(cm.bio) LIKE LOWER('%' || search_term || '%') THEN 0.3
        ELSE 0.0 END +
        
        -- Full-text search ranking
        COALESCE(
          ts_rank(
            to_tsvector('english', COALESCE(cm.name, '') || ' ' || COALESCE(cm.bio, '')),
            plainto_tsquery('english', search_term)
          ), 0.0
        ) * 0.4
      ) AS search_rank
    FROM cast_members cm
    WHERE 
      (
        LOWER(cm.name) LIKE LOWER('%' || search_term || '%') OR
        LOWER(cm.bio) LIKE LOWER('%' || search_term || '%') OR
        to_tsvector('english', COALESCE(cm.name, '') || ' ' || COALESCE(cm.bio, '')) 
        @@ plainto_tsquery('english', search_term)
      )
  )
  SELECT 
    sr.id,
    sr.name,
    sr.bio,
    sr.profile_image,
    sr.external_ids,
    sr.created_at,
    sr.updated_at,
    sr.search_rank
  FROM search_results sr
  WHERE sr.search_rank > 0
  ORDER BY sr.search_rank DESC, sr.name ASC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;