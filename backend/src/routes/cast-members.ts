import { Router, Request, Response } from 'express';
import { CastMemberModel } from '../models/CastMember';
import { ApiResponse } from '../../../shared/types';

const router = Router();

/**
 * GET /api/cast-members
 * Get all cast members with optional search and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, limit, offset } = req.query;
    
    const options = {
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const castMembers = await CastMemberModel.getAll(options);
    
    const response: ApiResponse<any> = {
      success: true,
      data: castMembers,
      message: 'Cast members retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/cast-members:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/cast-members/:id
 * Get a single cast member by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const castMember = await CastMemberModel.getById(id);

    if (!castMember) {
      const response: ApiResponse<any> = {
        success: false,
        error: 'Cast member not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: castMember,
      message: 'Cast member retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/cast-members/:id:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/cast-members/:id/roles
 * Get a cast member with their roles
 */
router.get('/:id/roles', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const castMemberWithRoles = await CastMemberModel.getWithRoles(id);

    if (!castMemberWithRoles) {
      const response: ApiResponse<any> = {
        success: false,
        error: 'Cast member not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: castMemberWithRoles,
      message: 'Cast member with roles retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/cast-members/:id/roles:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/cast-members/production/:productionId
 * Get cast members by production
 */
router.get('/production/:productionId', async (req: Request, res: Response) => {
  try {
    const { productionId } = req.params;
    const castMembers = await CastMemberModel.getByProduction(productionId);

    const response: ApiResponse<any> = {
      success: true,
      data: castMembers,
      message: 'Cast members for production retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/cast-members/production/:productionId:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/cast-members/musical/:musicalId
 * Get cast members by musical
 */
router.get('/musical/:musicalId', async (req: Request, res: Response) => {
  try {
    const { musicalId } = req.params;
    const castMembers = await CastMemberModel.getByMusical(musicalId);

    const response: ApiResponse<any> = {
      success: true,
      data: castMembers,
      message: 'Cast members for musical retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/cast-members/musical/:musicalId:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/cast-members/search/:term
 * Search cast members using full-text search
 */
router.get('/search/:term', async (req: Request, res: Response) => {
  try {
    const { term } = req.params;
    const { limit } = req.query;
    
    const searchLimit = limit ? parseInt(limit as string) : 10;
    const castMembers = await CastMemberModel.search(term, searchLimit);

    const response: ApiResponse<any> = {
      success: true,
      data: castMembers,
      message: `Search results for '${term}' retrieved successfully`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/cast-members/search/:term:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

export default router;