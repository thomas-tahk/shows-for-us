import { Router, Request, Response } from 'express';
import TicketmasterService from '../services/ticketmaster';
import { ApiResponse } from '../../../shared/types';

const router = Router();

/**
 * GET /api/ticketmaster/events
 * Search for events through Ticketmaster API
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const {
      keyword,
      city,
      stateCode,
      countryCode = 'US',
      postalCode,
      latlong,
      radius,
      unit,
      startDateTime,
      endDateTime,
      size,
      page,
      sort
    } = req.query;

    const searchParams = {
      keyword: keyword as string,
      city: city as string,
      stateCode: stateCode as string,
      countryCode: countryCode as string,
      postalCode: postalCode as string,
      latlong: latlong as string,
      radius: radius ? parseInt(radius as string) : undefined,
      unit: unit as 'miles' | 'km',
      startDateTime: startDateTime as string,
      endDateTime: endDateTime as string,
      size: size ? parseInt(size as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      sort: sort as string
    };

    const events = await TicketmasterService.searchEvents(searchParams);
    
    const response: ApiResponse<any> = {
      success: true,
      data: events,
      message: 'Events retrieved successfully from Ticketmaster'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/ticketmaster/events:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/ticketmaster/musicals
 * Search specifically for musical theater events
 */
router.get('/musicals', async (req: Request, res: Response) => {
  try {
    const {
      keyword,
      city,
      stateCode,
      countryCode = 'US',
      postalCode,
      latlong,
      radius,
      unit,
      startDateTime,
      endDateTime,
      size,
      page
    } = req.query;

    const searchParams = {
      keyword: keyword as string,
      city: city as string,
      stateCode: stateCode as string,
      countryCode: countryCode as string,
      postalCode: postalCode as string,
      latlong: latlong as string,
      radius: radius ? parseInt(radius as string) : undefined,
      unit: unit as 'miles' | 'km',
      startDateTime: startDateTime as string,
      endDateTime: endDateTime as string,
      size: size ? parseInt(size as string) : undefined,
      page: page ? parseInt(page as string) : undefined
    };

    const musicals = await TicketmasterService.searchMusicals(searchParams);
    
    const response: ApiResponse<any> = {
      success: true,
      data: musicals,
      message: 'Musical events retrieved successfully from Ticketmaster'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/ticketmaster/musicals:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/ticketmaster/events/:id
 * Get specific event details by ID
 */
router.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await TicketmasterService.getEventById(id);
    
    const response: ApiResponse<any> = {
      success: true,
      data: event,
      message: 'Event details retrieved successfully from Ticketmaster'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/ticketmaster/events/:id:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/ticketmaster/venues
 * Search for venues
 */
router.get('/venues', async (req: Request, res: Response) => {
  try {
    const {
      city,
      stateCode,
      countryCode = 'US',
      postalCode,
      latlong,
      radius,
      unit,
      keyword,
      size,
      page
    } = req.query;

    const searchParams = {
      city: city as string,
      stateCode: stateCode as string,
      countryCode: countryCode as string,
      postalCode: postalCode as string,
      latlong: latlong as string,
      radius: radius ? parseInt(radius as string) : undefined,
      unit: unit as 'miles' | 'km',
      keyword: keyword as string,
      size: size ? parseInt(size as string) : undefined,
      page: page ? parseInt(page as string) : undefined
    };

    const venues = await TicketmasterService.getVenues(searchParams);
    
    const response: ApiResponse<any> = {
      success: true,
      data: venues,
      message: 'Venues retrieved successfully from Ticketmaster'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/ticketmaster/venues:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/ticketmaster/markets
 * Get available markets
 */
router.get('/markets', async (req: Request, res: Response) => {
  try {
    const markets = await TicketmasterService.getMarkets();
    
    const response: ApiResponse<any> = {
      success: true,
      data: markets,
      message: 'Markets retrieved successfully from Ticketmaster'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/ticketmaster/markets:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/ticketmaster/status
 * Check Ticketmaster API status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const isConfigured = TicketmasterService.isConfigured();
    const isConnected = isConfigured ? await TicketmasterService.testConnection() : false;
    
    const response: ApiResponse<any> = {
      success: true,
      data: {
        configured: isConfigured,
        connected: isConnected,
        status: isConnected ? 'operational' : isConfigured ? 'api_error' : 'not_configured'
      },
      message: 'Ticketmaster API status checked successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/ticketmaster/status:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    res.status(500).json(response);
  }
});

export default router;