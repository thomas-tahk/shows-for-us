import { supabase } from '../config/database';
import TicketmasterService from './ticketmaster';
import { TicketmasterEvent } from './ticketmaster';

export class DataImportService {
  private static instance: DataImportService;

  private constructor() {}

  static getInstance(): DataImportService {
    if (!DataImportService.instance) {
      DataImportService.instance = new DataImportService();
    }
    return DataImportService.instance;
  }

  /**
   * Import musical events from Ticketmaster into our database
   */
  async importMusicalEvents(params: {
    city?: string;
    stateCode?: string;
    radius?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    };

    try {
      // Search for musical events
      const response = await TicketmasterService.searchMusicals({
        city: params.city,
        stateCode: params.stateCode,
        radius: params.radius,
        startDateTime: params.startDate,
        endDateTime: params.endDate,
        size: params.limit || 50
      });

      const events = response._embedded?.events || [];
      
      console.log(`Found ${events.length} musical events from Ticketmaster`);

      for (const event of events) {
        try {
          await this.importSingleEvent(event);
          results.imported++;
        } catch (error) {
          results.skipped++;
          results.errors.push(`Failed to import event ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return results;
    } catch (error) {
      results.errors.push(`Failed to fetch events: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return results;
    }
  }

  /**
   * Import a single event into our database
   */
  private async importSingleEvent(event: TicketmasterEvent): Promise<void> {
    const venue = event._embedded?.venues?.[0];
    const classification = event.classifications?.[0];

    if (!venue) {
      throw new Error('Event has no venue information');
    }

    // 1. Create or get venue
    const venueData = {
      name: venue.name,
      address: venue.address?.line1 || '',
      city: venue.city?.name || '',
      state: venue.state?.stateCode || '',
      zip_code: venue.postalCode || '',
      latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
      longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
      capacity: null,
      external_ids: { ticketmaster: venue.id }
    };

    let dbVenue = await this.findOrCreateVenue(venueData);

    // 2. Create or get musical
    const musicalName = this.extractMusicalName(event.name);
    const genre = classification?.genre?.name || 'Musical';
    
    const musicalData = {
      name: musicalName,
      description: `${event.name} - ${genre}`,
      genre: genre,
      external_ids: { ticketmaster: event.id }
    };

    let dbMusical = await this.findOrCreateMusical(musicalData);

    // 3. Create or get production
    const productionData = {
      musical_id: dbMusical.id,
      name: event.name,
      type: this.determineProductionType(event.name),
      status: this.determineProductionStatus(event.dates),
      external_ids: { ticketmaster: event.id }
    };

    let dbProduction = await this.findOrCreateProduction(productionData);

    // 4. Create performance
    const performanceData = {
      production_id: dbProduction.id,
      venue_id: dbVenue.id,
      performance_date: event.dates.start.localDate,
      performance_time: event.dates.start.localTime || '19:30',
      ticket_url: event.url,
      availability: this.determineAvailability(event.dates.status.code),
      external_ids: { ticketmaster: event.id }
    };

    await this.createPerformance(performanceData);
  }

  /**
   * Find or create venue in database
   */
  private async findOrCreateVenue(venueData: any): Promise<any> {
    // Check if venue already exists
    const { data: existingVenue } = await supabase
      .from('venues')
      .select('*')
      .eq('name', venueData.name)
      .eq('city', venueData.city)
      .eq('state', venueData.state)
      .single();

    if (existingVenue) {
      return existingVenue;
    }

    // Create new venue
    const { data: newVenue, error } = await supabase
      .from('venues')
      .insert(venueData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create venue: ${error.message}`);
    }

    return newVenue;
  }

  /**
   * Find or create musical in database
   */
  private async findOrCreateMusical(musicalData: any): Promise<any> {
    // Check if musical already exists
    const { data: existingMusical } = await supabase
      .from('musicals')
      .select('*')
      .eq('name', musicalData.name)
      .single();

    if (existingMusical) {
      return existingMusical;
    }

    // Create new musical
    const { data: newMusical, error } = await supabase
      .from('musicals')
      .insert(musicalData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create musical: ${error.message}`);
    }

    return newMusical;
  }

  /**
   * Find or create production in database
   */
  private async findOrCreateProduction(productionData: any): Promise<any> {
    // Check if production already exists
    const { data: existingProduction } = await supabase
      .from('productions')
      .select('*')
      .eq('musical_id', productionData.musical_id)
      .eq('name', productionData.name)
      .single();

    if (existingProduction) {
      return existingProduction;
    }

    // Create new production
    const { data: newProduction, error } = await supabase
      .from('productions')
      .insert(productionData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create production: ${error.message}`);
    }

    return newProduction;
  }

  /**
   * Create performance in database
   */
  private async createPerformance(performanceData: any): Promise<any> {
    // Check if performance already exists
    const { data: existingPerformance } = await supabase
      .from('performances')
      .select('*')
      .eq('production_id', performanceData.production_id)
      .eq('venue_id', performanceData.venue_id)
      .eq('performance_date', performanceData.performance_date)
      .eq('performance_time', performanceData.performance_time)
      .single();

    if (existingPerformance) {
      return existingPerformance;
    }

    // Create new performance
    const { data: newPerformance, error } = await supabase
      .from('performances')
      .insert(performanceData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create performance: ${error.message}`);
    }

    return newPerformance;
  }

  /**
   * Extract musical name from event name
   */
  private extractMusicalName(eventName: string): string {
    // Remove common suffixes like "- The Musical", "National Tour", etc.
    const cleanName = eventName
      .replace(/\s*-\s*The Musical.*$/i, '')
      .replace(/\s*-\s*National Tour.*$/i, '')
      .replace(/\s*-\s*Broadway.*$/i, '')
      .replace(/\s*-\s*Tour.*$/i, '')
      .replace(/\s*\(.*\)$/i, '')
      .trim();

    return cleanName || eventName;
  }

  /**
   * Determine production type based on event name
   */
  private determineProductionType(eventName: string): 'broadway' | 'touring' | 'regional' {
    const lowerName = eventName.toLowerCase();
    
    if (lowerName.includes('broadway')) {
      return 'broadway';
    } else if (lowerName.includes('tour') || lowerName.includes('touring')) {
      return 'touring';
    } else {
      return 'regional';
    }
  }

  /**
   * Determine production status based on event dates
   */
  private determineProductionStatus(dates: any): 'active' | 'upcoming' | 'completed' {
    const now = new Date();
    const eventDate = new Date(dates.start.localDate);
    
    if (eventDate < now) {
      return 'completed';
    } else if (eventDate > now) {
      return 'upcoming';
    } else {
      return 'active';
    }
  }

  /**
   * Determine availability based on Ticketmaster status
   */
  private determineAvailability(statusCode: string): 'available' | 'sold-out' | 'limited' {
    switch (statusCode.toLowerCase()) {
      case 'onsale':
        return 'available';
      case 'soldout':
        return 'sold-out';
      case 'limited':
        return 'limited';
      default:
        return 'available';
    }
  }

  /**
   * Get import statistics
   */
  async getImportStats(): Promise<{
    musicals: number;
    productions: number;
    performances: number;
    venues: number;
  }> {
    const [musicals, productions, performances, venues] = await Promise.all([
      supabase.from('musicals').select('count(*)', { count: 'exact' }),
      supabase.from('productions').select('count(*)', { count: 'exact' }),
      supabase.from('performances').select('count(*)', { count: 'exact' }),
      supabase.from('venues').select('count(*)', { count: 'exact' })
    ]);

    return {
      musicals: musicals.count || 0,
      productions: productions.count || 0,
      performances: performances.count || 0,
      venues: venues.count || 0
    };
  }

  /**
   * Clear all imported data (for testing)
   */
  async clearAllData(): Promise<void> {
    await supabase.from('performances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('productions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('musicals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('venues').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
}

export default DataImportService.getInstance();