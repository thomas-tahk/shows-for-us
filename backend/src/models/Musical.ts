import { supabase } from '../config/database';
import { Musical } from '../../../shared/types';

export class MusicalModel {
  /**
   * Get all musicals with optional search and pagination
   */
  static async getAll(options: {
    search?: string;
    genre?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Musical[]> {
    let query = supabase
      .from('musicals')
      .select('*');

    // Add search filter
    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    // Add genre filter
    if (options.genre) {
      query = query.eq('genre', options.genre);
    }

    // Add pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    // Order by name
    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching musicals: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single musical by ID
   */
  static async getById(id: string): Promise<Musical | null> {
    const { data, error } = await supabase
      .from('musicals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Error fetching musical: ${error.message}`);
    }

    return data;
  }

  /**
   * Get musicals by genre
   */
  static async getByGenre(genre: string): Promise<Musical[]> {
    const { data, error } = await supabase
      .from('musicals')
      .select('*')
      .eq('genre', genre)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error fetching musicals by genre: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Advanced fuzzy search across multiple fields with scoring
   */
  static async search(searchTerm: string, limit: number = 10): Promise<Musical[]> {
    // Clean and prepare search term
    const cleanTerm = searchTerm.trim().replace(/[^a-zA-Z0-9\s]/g, '');
    
    if (!cleanTerm) {
      return this.getAll({ limit });
    }

    // Use PostgreSQL's full-text search with ranking
    const { data, error } = await supabase.rpc('search_musicals', {
      search_term: cleanTerm,
      result_limit: limit
    });

    if (error) {
      console.warn('Advanced search failed, falling back to basic search:', error.message);
      return this.basicSearch(searchTerm, limit);
    }

    return data || [];
  }

  /**
   * Fallback basic search method
   */
  static async basicSearch(searchTerm: string, limit: number = 10): Promise<Musical[]> {
    const { data, error } = await supabase
      .from('musicals')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,genre.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Error in basic search: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all unique genres
   */
  static async getGenres(): Promise<string[]> {
    const { data, error } = await supabase
      .from('musicals')
      .select('genre')
      .order('genre', { ascending: true });

    if (error) {
      throw new Error(`Error fetching genres: ${error.message}`);
    }

    // Extract unique genres
    const genres = [...new Set(data?.map(row => row.genre) || [])];
    return genres;
  }

  /**
   * Get musicals with their productions
   */
  static async getWithProductions(id: string) {
    const { data, error } = await supabase
      .from('musicals')
      .select(`
        *,
        productions (
          id,
          name,
          type,
          status,
          created_at,
          updated_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Error fetching musical with productions: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new musical (for admin/API use)
   */
  static async create(musical: Omit<Musical, 'id' | 'createdAt' | 'updatedAt'>): Promise<Musical> {
    const { data, error } = await supabase
      .from('musicals')
      .insert([{
        name: musical.name,
        description: musical.description,
        genre: musical.genre,
        original_broadway_run: musical.originalBroadwayRun
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating musical: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a musical (for admin/API use)
   */
  static async update(id: string, updates: Partial<Musical>): Promise<Musical | null> {
    const { data, error } = await supabase
      .from('musicals')
      .update({
        name: updates.name,
        description: updates.description,
        genre: updates.genre,
        original_broadway_run: updates.originalBroadwayRun
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Error updating musical: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a musical (for admin use)
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('musicals')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting musical: ${error.message}`);
    }

    return true;
  }
}