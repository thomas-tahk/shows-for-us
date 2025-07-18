import { Router, Request, Response } from 'express';
import DataImportService from '../services/dataImport';
import { ApiResponse } from '../../../shared/types';

const router = Router();

/**
 * POST /api/import/musicals
 * Import musical events from Ticketmaster
 */
router.post('/musicals', async (req: Request, res: Response) => {
  try {
    const {
      city,
      stateCode,
      radius,
      startDate,
      endDate,
      limit
    } = req.body;

    const importParams = {
      city,
      stateCode,
      radius: radius ? parseInt(radius) : undefined,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined
    };

    const results = await DataImportService.importMusicalEvents(importParams);
    
    const response: ApiResponse<any> = {
      success: true,
      data: results,
      message: `Import completed: ${results.imported} imported, ${results.skipped} skipped`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in POST /api/import/musicals:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/import/stats
 * Get import statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await DataImportService.getImportStats();
    
    const response: ApiResponse<any> = {
      success: true,
      data: stats,
      message: 'Import statistics retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/import/stats:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * DELETE /api/import/clear
 * Clear all imported data (for testing)
 */
router.delete('/clear', async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      const response: ApiResponse<any> = {
        success: false,
        error: 'Clear operation not allowed in production'
      };
      return res.status(403).json(response);
    }

    await DataImportService.clearAllData();
    
    const response: ApiResponse<any> = {
      success: true,
      message: 'All imported data cleared successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in DELETE /api/import/clear:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

export default router;