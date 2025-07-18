// Shared TypeScript types for the Shows For Us application

export interface Musical {
  id: string;
  name: string;
  description?: string;
  genre: string;
  originalBroadwayRun?: {
    startDate: string;
    endDate?: string;
    theater: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CastMember {
  id: string;
  name: string;
  bio?: string;
  profileImage?: string;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  characterName: string;
  roleType: 'lead' | 'supporting' | 'ensemble';
  productionId: string;
  castMemberId: string;
}

export interface Production {
  id: string;
  musicalId: string;
  name: string; // e.g., "Hamilton - Chicago 2024"
  type: 'broadway' | 'touring' | 'regional';
  status: 'active' | 'upcoming' | 'completed';
  cast: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface Performance {
  id: string;
  productionId: string;
  venueId: string;
  date: string;
  time: string;
  ticketUrl?: string;
  availability: 'available' | 'sold-out' | 'limited';
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  capacity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  location?: {
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
  };
  preferences: {
    maxDistance: number; // in miles
    genres: string[];
    notificationsEnabled: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserFavorite {
  id: string;
  userId: string;
  type: 'musical' | 'cast_member' | 'production';
  targetId: string;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  type: 'performance_announcement' | 'cast_change' | 'news';
  title: string;
  description: string;
  relatedMusicalId?: string;
  relatedCastMemberId?: string;
  relatedProductionId?: string;
  imageUrl?: string;
  sourceUrl?: string;
  publishedAt: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchResult {
  musicals: Musical[];
  castMembers: CastMember[];
  productions: Production[];
  totalResults: number;
}

export interface ProximityAlert {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'musical' | 'cast_member' | 'production';
  performance: Performance;
  venue: Venue;
  distance: number; // in miles
  createdAt: string;
}