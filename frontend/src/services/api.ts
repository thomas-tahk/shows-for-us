import type {
  Musical,
  CastMember,
  SearchResults,
  PopularResults,
  MusicalWithProductions,
  CastMemberWithRoles,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json() as { success: boolean; data?: T; error?: string };
  if (!json.success) throw new Error(json.error ?? 'Unknown error');
  return json.data as T;
}

export const api = {
  search: (q: string, type = 'all') =>
    apiFetch<SearchResults>(`/api/search?q=${encodeURIComponent(q)}&type=${type}`),

  getPopular: () =>
    apiFetch<PopularResults>('/api/search/popular'),

  getMusicals: (genre?: string) => {
    const params = genre ? `?genre=${encodeURIComponent(genre)}` : '';
    return apiFetch<Musical[]>(`/api/musicals${params}`);
  },

  getMusicalWithProductions: (id: string) =>
    apiFetch<MusicalWithProductions>(`/api/musicals/${id}/productions`),

  getCastMemberWithRoles: (id: string) =>
    apiFetch<CastMemberWithRoles>(`/api/cast-members/${id}/roles`),
};
