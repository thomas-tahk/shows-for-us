import { supabase } from '../config/database';
import { CastMember } from '../../../shared/types';

export class CastMemberModel {
  /**
   * Get all cast members with optional search and pagination
   */
  static async getAll(options: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<CastMember[]> {
    let query = supabase
      .from('cast_members')
      .select('*');

    // Add search filter
    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,bio.ilike.%${options.search}%`);
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
      throw new Error(`Error fetching cast members: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single cast member by ID
   */
  static async getById(id: string): Promise<CastMember | null> {
    const { data, error } = await supabase
      .from('cast_members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Error fetching cast member: ${error.message}`);
    }

    return data;
  }

  /**
   * Advanced fuzzy search for cast members with scoring
   */
  static async search(searchTerm: string, limit: number = 10): Promise<CastMember[]> {
    // Clean and prepare search term
    const cleanTerm = searchTerm.trim().replace(/[^a-zA-Z0-9\s]/g, '');
    
    if (!cleanTerm) {
      return this.getAll({ limit });
    }

    // Use PostgreSQL's advanced search function
    const { data, error } = await supabase.rpc('search_cast_members', {
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
  static async basicSearch(searchTerm: string, limit: number = 10): Promise<CastMember[]> {
    const { data, error } = await supabase
      .from('cast_members')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Error in basic search: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get cast member with their roles
   */
  static async getWithRoles(id: string) {
    const { data, error } = await supabase
      .from('cast_members')
      .select(`
        *,
        roles (
          id,
          character_name,
          role_type,
          production_id,
          productions (
            id,
            name,
            type,
            status,
            musical_id,
            musicals (
              id,
              name,
              genre
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Error fetching cast member with roles: ${error.message}`);
    }

    return data;
  }

  /**
   * Get cast members by production
   */
  static async getByProduction(productionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('cast_members')
      .select(`
        *,
        roles!inner (
          id,
          character_name,
          role_type,
          production_id
        )
      `)
      .eq('roles.production_id', productionId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error fetching cast members by production: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get cast members by musical
   */
  static async getByMusical(musicalId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('cast_members')
      .select(`
        *,
        roles!inner (
          id,
          character_name,
          role_type,
          production_id,
          productions!inner (
            id,
            name,
            musical_id
          )
        )
      `)
      .eq('roles.productions.musical_id', musicalId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error fetching cast members by musical: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new cast member (for admin/API use)
   */
  static async create(castMember: Omit<CastMember, 'id' | 'createdAt' | 'updatedAt' | 'roles'>): Promise<CastMember> {
    const { data, error } = await supabase
      .from('cast_members')
      .insert([{
        name: castMember.name,
        bio: castMember.bio,
        profile_image: castMember.profileImage
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating cast member: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a cast member (for admin/API use)
   */
  static async update(id: string, updates: Partial<CastMember>): Promise<CastMember | null> {
    const { data, error } = await supabase
      .from('cast_members')
      .update({
        name: updates.name,
        bio: updates.bio,
        profile_image: updates.profileImage
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Error updating cast member: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a cast member (for admin use)
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('cast_members')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting cast member: ${error.message}`);
    }

    return true;
  }
}