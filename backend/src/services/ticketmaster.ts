import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

if (!TICKETMASTER_API_KEY) {
  console.warn('⚠️  TICKETMASTER_API_KEY not found in environment variables');
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  type: string;
  url: string;
  locale: string;
  images: Array<{
    ratio: string;
    url: string;
    width: number;
    height: number;
    fallback: boolean;
  }>;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
      dateTime?: string;
    };
    timezone: string;
    status: {
      code: string;
    };
  };
  classifications: Array<{
    primary: boolean;
    segment: {
      id: string;
      name: string;
    };
    genre: {
      id: string;
      name: string;
    };
    subGenre: {
      id: string;
      name: string;
    };
  }>;
  _embedded?: {
    venues: Array<{
      id: string;
      name: string;
      type: string;
      url: string;
      locale: string;
      images: Array<{
        ratio: string;
        url: string;
        width: number;
        height: number;
        fallback: boolean;
      }>;
      postalCode: string;
      timezone: string;
      city: {
        name: string;
      };
      state: {
        name: string;
        stateCode: string;
      };
      country: {
        name: string;
        countryCode: string;
      };
      address: {
        line1: string;
        line2?: string;
      };
      location: {
        longitude: string;
        latitude: string;
      };
      markets: Array<{
        name: string;
        id: string;
      }>;
      dmas: Array<{
        id: number;
      }>;
      boxOfficeInfo?: {
        phoneNumberDetail: string;
        openHoursDetail: string;
        acceptedPaymentDetail: string;
        willCallDetail: string;
      };
      accessibleSeatingDetail?: string;
      generalInfo?: {
        generalRule: string;
        childRule: string;
      };
    }>;
  };
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  products?: Array<{
    id: string;
    url: string;
    type: string;
    name: string;
  }>;
  seatmap?: {
    staticUrl: string;
  };
}

export interface TicketmasterResponse {
  _embedded?: {
    events: TicketmasterEvent[];
  };
  _links: {
    self: {
      href: string;
    };
    next?: {
      href: string;
    };
    prev?: {
      href: string;
    };
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export class TicketmasterService {
  private static instance: TicketmasterService;
  private apiKey: string;
  private baseUrl: string;

  private constructor() {
    this.apiKey = TICKETMASTER_API_KEY || '';
    this.baseUrl = TICKETMASTER_BASE_URL;
  }

  static getInstance(): TicketmasterService {
    if (!TicketmasterService.instance) {
      TicketmasterService.instance = new TicketmasterService();
    }
    return TicketmasterService.instance;
  }

  /**
   * Search for events (musicals, concerts, etc.)
   */
  async searchEvents(params: {
    keyword?: string;
    city?: string;
    stateCode?: string;
    countryCode?: string;
    postalCode?: string;
    latlong?: string;
    radius?: number;
    unit?: 'miles' | 'km';
    segmentId?: string;
    genreId?: string;
    subGenreId?: string;
    startDateTime?: string;
    endDateTime?: string;
    size?: number;
    page?: number;
    sort?: string;
  }): Promise<TicketmasterResponse> {
    if (!this.apiKey) {
      throw new Error('Ticketmaster API key is required');
    }

    const queryParams = new URLSearchParams({
      apikey: this.apiKey,
      ...Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      ),
    });

    try {
      const response = await axios.get(`${this.baseUrl}/events.json?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Ticketmaster API error:', error);
      throw new Error('Failed to fetch events from Ticketmaster');
    }
  }

  /**
   * Search specifically for musical theater events
   */
  async searchMusicals(params: {
    keyword?: string;
    city?: string;
    stateCode?: string;
    countryCode?: string;
    postalCode?: string;
    latlong?: string;
    radius?: number;
    unit?: 'miles' | 'km';
    startDateTime?: string;
    endDateTime?: string;
    size?: number;
    page?: number;
  }): Promise<TicketmasterResponse> {
    // Musical theater is typically under Arts & Theatre segment
    return this.searchEvents({
      ...params,
      segmentId: 'KZFzniwnSyZfZ7v7nE', // Arts & Theatre segment ID
      subGenreId: 'KnvZfZ7vAd1', // Theatre sub-genre ID
    });
  }

  /**
   * Get event details by ID
   */
  async getEventById(eventId: string): Promise<TicketmasterEvent> {
    if (!this.apiKey) {
      throw new Error('Ticketmaster API key is required');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/events/${eventId}.json?apikey=${this.apiKey}`
      );
      return response.data;
    } catch (error) {
      console.error('Ticketmaster API error:', error);
      throw new Error('Failed to fetch event details from Ticketmaster');
    }
  }

  /**
   * Get venues by market
   */
  async getVenues(params: {
    city?: string;
    stateCode?: string;
    countryCode?: string;
    postalCode?: string;
    latlong?: string;
    radius?: number;
    unit?: 'miles' | 'km';
    keyword?: string;
    size?: number;
    page?: number;
  }): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Ticketmaster API key is required');
    }

    const queryParams = new URLSearchParams({
      apikey: this.apiKey,
      ...Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      ),
    });

    try {
      const response = await axios.get(`${this.baseUrl}/venues.json?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Ticketmaster API error:', error);
      throw new Error('Failed to fetch venues from Ticketmaster');
    }
  }

  /**
   * Get market information
   */
  async getMarkets(): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Ticketmaster API key is required');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/markets.json?apikey=${this.apiKey}`);
      return response.data;
    } catch (error) {
      console.error('Ticketmaster API error:', error);
      throw new Error('Failed to fetch markets from Ticketmaster');
    }
  }

  /**
   * Convert Ticketmaster event to our internal format
   */
  convertEventToPerformance(event: TicketmasterEvent): any {
    const venue = event._embedded?.venues?.[0];
    const classification = event.classifications?.[0];

    return {
      externalId: event.id,
      name: event.name,
      date: event.dates.start.localDate,
      time: event.dates.start.localTime || '19:30', // Default to 7:30 PM
      ticketUrl: event.url,
      availability: event.dates.status.code === 'onsale' ? 'available' : 'limited',
      venue: venue ? {
        name: venue.name,
        address: venue.address?.line1 || '',
        city: venue.city?.name || '',
        state: venue.state?.stateCode || '',
        zipCode: venue.postalCode || '',
        latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
        longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
        capacity: null, // Ticketmaster doesn't provide capacity
      } : null,
      classification: classification ? {
        segment: classification.segment?.name || '',
        genre: classification.genre?.name || '',
        subGenre: classification.subGenre?.name || '',
      } : null,
      images: event.images || [],
      priceRanges: event.priceRanges || [],
    };
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      await this.searchEvents({ size: 1 });
      return true;
    } catch (error) {
      console.error('Ticketmaster API test failed:', error);
      return false;
    }
  }
}

export default TicketmasterService.getInstance();