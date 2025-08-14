import { Router, Request, Response } from 'express';
import { MusicalModel } from '../models/Musical';
import { CastMemberModel } from '../models/CastMember';
import { supabase } from '../config/database';
import { ApiResponse } from '../../../shared/types';

const router = Router();

/**
 * GET /api/search
 * Universal search across musicals and cast members
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, type, limit = 10 } = req.query;
    
    if (!q || typeof q !== 'string') {
      const response: ApiResponse<any> = {
        success: false,
        error: 'Search query parameter "q" is required'
      };
      return res.status(400).json(response);
    }

    const searchLimit = Math.min(parseInt(limit as string) || 10, 50);
    let results: any = {};

    // Search based on type parameter
    if (!type || type === 'all') {
      // Search everything
      const [musicals, castMembers] = await Promise.all([
        MusicalModel.search(q, Math.ceil(searchLimit / 2)),
        CastMemberModel.search(q, Math.ceil(searchLimit / 2))
      ]);

      results = {
        musicals,
        castMembers,
        totalResults: musicals.length + castMembers.length
      };
    } else if (type === 'musicals') {
      const musicals = await MusicalModel.search(q, searchLimit);
      results = {
        musicals,
        totalResults: musicals.length
      };
    } else if (type === 'cast') {
      const castMembers = await CastMemberModel.search(q, searchLimit);
      results = {
        castMembers,
        totalResults: castMembers.length
      };
    } else {
      const response: ApiResponse<any> = {
        success: false,
        error: 'Invalid search type. Use "all", "musicals", or "cast"'
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: results,
      message: `Search completed for "${q}"`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in universal search:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/search/suggestions
 * Get search suggestions/autocomplete
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q || typeof q !== 'string') {
      const response: ApiResponse<any> = {
        success: false,
        error: 'Search query parameter "q" is required'
      };
      return res.status(400).json(response);
    }

    const suggestionLimit = Math.min(parseInt(limit as string) || 5, 10);

    // Get suggestions using the PostgreSQL function
    const { data, error } = await supabase.rpc('get_search_suggestions', {
      search_term: q,
      suggestion_limit: suggestionLimit
    });

    if (error) {
      console.warn('Advanced suggestions failed:', error.message);
      
      // Fallback to basic suggestions
      const basicSuggestions = await getBasicSuggestions(q, suggestionLimit);
      
      const response: ApiResponse<any> = {
        success: true,
        data: { suggestions: basicSuggestions },
        message: 'Basic suggestions retrieved successfully'
      };
      return res.json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: { suggestions: data || [] },
      message: 'Search suggestions retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in search suggestions:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/search/popular
 * Get popular/trending searches
 */
router.get('/popular', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const searchLimit = Math.min(parseInt(limit as string) || 10, 20);

    // Get popular musicals (by number of productions)
    const { data: popularMusicals, error: musicalsError } = await supabase
      .from('musicals')
      .select(`
        id,
        name,
        genre,
        productions(count)
      `)
      .order('name', { ascending: true })
      .limit(searchLimit);

    if (musicalsError) {
      throw new Error(`Error fetching popular searches: ${musicalsError.message}`);
    }

    // Get all unique genres
    const { data: genres, error: genresError } = await supabase
      .from('musicals')
      .select('genre')
      .order('genre');

    if (genresError) {
      throw new Error(`Error fetching genres: ${genresError.message}`);
    }

    const uniqueGenres = [...new Set(genres?.map(g => g.genre) || [])];

    const response: ApiResponse<any> = {
      success: true,
      data: {
        popularMusicals: popularMusicals || [],
        genres: uniqueGenres,
        suggestions: [
          'Hamilton',
          'Wicked',
          'The Lion King',
          'Chicago',
          'Lin-Manuel Miranda',
          'Musical',
          'Broadway'
        ]
      },
      message: 'Popular searches retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in popular searches:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * Helper function for basic suggestions fallback
 */
async function getBasicSuggestions(searchTerm: string, limit: number) {
  try {
    const [musicals, castMembers] = await Promise.all([
      supabase
        .from('musicals')
        .select('name')
        .ilike('name', `${searchTerm}%`)
        .limit(Math.ceil(limit / 2)),
      supabase
        .from('cast_members')
        .select('name')
        .ilike('name', `${searchTerm}%`)
        .limit(Math.ceil(limit / 2))
    ]);

    const suggestions = [
      ...(musicals.data || []).map(m => ({ suggestion: m.name, type: 'musical', relevance: 0.8 })),
      ...(castMembers.data || []).map(c => ({ suggestion: c.name, type: 'cast_member', relevance: 0.7 }))
    ];

    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('Error in basic suggestions:', error);
    return [];
  }
}

export default router;