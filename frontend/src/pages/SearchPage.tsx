import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import MusicalCard from '../components/MusicalCard';
import CastMemberCard from '../components/CastMemberCard';
import type { SearchResults } from '../types';

type Tab = 'all' | 'musicals' | 'cast';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setQuery(q);
    if (!q) return;

    async function doSearch() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.search(q, activeTab === 'cast' ? 'cast' : activeTab);
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }
    void doSearch();
  }, [searchParams, activeTab]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const musicals = results?.musicals ?? [];
  const castMembers = results?.castMembers ?? [];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Search bar */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4">
        <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search shows, cast members..."
            className="flex-1 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-xl px-5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="submit"
            className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title */}
        {initialQuery && (
          <h2 className="text-neutral-400 text-sm mb-6">
            Results for <span className="text-white font-medium">"{initialQuery}"</span>
            {results && (
              <span className="ml-2 text-neutral-500">· {results.totalResults} found</span>
            )}
          </h2>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-neutral-900 rounded-xl p-1 w-fit">
          {(['all', 'musicals', 'cast'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-amber-400 text-neutral-950'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab === 'cast' ? 'Cast Members' : tab === 'all' ? 'All' : 'Musicals'}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-red-400 bg-red-950/30 border border-red-900 rounded-xl px-5 py-4">
            {error}
          </div>
        )}

        {!loading && !error && results && (
          <>
            {(activeTab === 'all' || activeTab === 'musicals') && musicals.length > 0 && (
              <div className="mb-10">
                <h3 className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-4">
                  Musicals
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {musicals.map(m => <MusicalCard key={m.id} musical={m} />)}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'cast') && castMembers.length > 0 && (
              <div>
                <h3 className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-4">
                  Cast Members
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {castMembers.map(c => <CastMemberCard key={c.id} castMember={c} />)}
                </div>
              </div>
            )}

            {results.totalResults === 0 && (
              <div className="text-center py-20 text-neutral-500">
                <p className="text-lg mb-2">No results found.</p>
                <p className="text-sm">Try a different search term.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
