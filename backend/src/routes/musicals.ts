import { Router, Request, Response } from 'express';
import { MusicalModel } from '../models/Musical';
import { ApiResponse } from '../../../shared/types';

const router = Router();

/**
 * GET /api/musicals
 * Get all musicals with optional search and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, genre, limit, offset } = req.query;
    
    const options = {
      search: search as string,
      genre: genre as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const musicals = await MusicalModel.getAll(options);
    
    const response: ApiResponse<any> = {
      success: true,
      data: musicals,
      message: 'Musicals retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/musicals:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/musicals/:id
 * Get a single musical by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const musical = await MusicalModel.getById(id);

    if (!musical) {
      const response: ApiResponse<any> = {
        success: false,
        error: 'Musical not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: musical,
      message: 'Musical retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/musicals/:id:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/musicals/:id/productions
 * Get a musical with its productions
 */
router.get('/:id/productions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const musicalWithProductions = await MusicalModel.getWithProductions(id);

    if (!musicalWithProductions) {
      const response: ApiResponse<any> = {
        success: false,
        error: 'Musical not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: musicalWithProductions,
      message: 'Musical with productions retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/musicals/:id/productions:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/musicals/genre/:genre
 * Get musicals by genre
 */
router.get('/genre/:genre', async (req: Request, res: Response) => {
  try {
    const { genre } = req.params;
    const musicals = await MusicalModel.getByGenre(genre);

    const response: ApiResponse<any> = {
      success: true,
      data: musicals,
      message: `Musicals in genre '${genre}' retrieved successfully`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/musicals/genre/:genre:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/musicals/search/:term
 * Search musicals using full-text search
 */
router.get('/search/:term', async (req: Request, res: Response) => {
  try {
    const { term } = req.params;
    const { limit } = req.query;
    
    const searchLimit = limit ? parseInt(limit as string) : 10;
    const musicals = await MusicalModel.search(term, searchLimit);

    const response: ApiResponse<any> = {
      success: true,
      data: musicals,
      message: `Search results for '${term}' retrieved successfully`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/musicals/search/:term:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/musicals/genres
 * Get all available genres
 */
router.get('/genres', async (req: Request, res: Response) => {
  try {
    const genres = await MusicalModel.getGenres();

    const response: ApiResponse<any> = {
      success: true,
      data: genres,
      message: 'Genres retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/musicals/genres:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

export default router;