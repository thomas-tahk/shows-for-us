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
}

export interface CastMember {
  id: string;
  name: string;
  bio?: string;
  profileImage?: string;
}

export interface Role {
  id: string;
  characterName: string;
  roleType: 'lead' | 'supporting' | 'ensemble';
  productionId: string;
}

export interface Production {
  id: string;
  musicalId: string;
  name: string;
  type: 'broadway' | 'touring' | 'regional';
  status: 'active' | 'upcoming' | 'completed';
}

export interface SearchResults {
  musicals: Musical[];
  castMembers: CastMember[];
  totalResults: number;
}

export interface PopularResults {
  popularMusicals: Musical[];
  genres: string[];
  suggestions: string[];
}

export interface MusicalWithProductions extends Musical {
  productions: Production[];
}

export interface CastMemberWithRoles extends CastMember {
  roles: (Role & { musicalName?: string; productionName?: string })[];
}
