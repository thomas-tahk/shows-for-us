import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import MusicalCard from '../components/MusicalCard';
import type { Musical, PopularResults } from '../types';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [popular, setPopular] = useState<PopularResults | null>(null);
  const [musicals, setMusicals] = useState<Musical[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadHome() {
      try {
        const [popularData, musicalsData] = await Promise.all([
          api.getPopular(),
          api.getMusicals(),
        ]);
        setPopular(popularData);
        setMusicals(musicalsData);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    void loadHome();
  }, []);

  useEffect(() => {
    async function filterByGenre() {
      try {
        const data = await api.getMusicals(selectedGenre ?? undefined);
        setMusicals(data);
      } catch (err) {
        console.error('Failed to filter musicals:', err);
      }
    }
    void filterByGenre();
  }, [selectedGenre]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const genres = popular?.genres ?? [];
  const displayMusicals = musicals.length > 0 ? musicals : (popular?.popularMusicals ?? []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Hero */}
      <section className="px-6 py-20 text-center bg-gradient-to-b from-neutral-900 to-neutral-950">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
          Discover Musical Theater
          <span className="block text-amber-400">Near You</span>
        </h1>
        <p className="text-neutral-400 text-lg mb-10 max-w-md mx-auto">
          Track your favorite shows and cast members on tour across the US.
        </p>
        <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search shows, cast members..."
            className="flex-1 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-xl px-5 py-3 text-base focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="submit"
            className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold rounded-xl px-6 py-3 transition-colors"
          >
            Search
          </button>
        </form>
        {popular?.suggestions && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {popular.suggestions.map(s => (
              <button
                key={s}
                onClick={() => navigate(`/search?q=${encodeURIComponent(s)}`)}
                className="text-sm text-neutral-500 hover:text-amber-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Browse */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Browse Shows</h2>
        </div>

        {/* Genre filter */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedGenre === null
                  ? 'bg-amber-400 text-neutral-950 border-amber-400'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'
              }`}
            >
              All
            </button>
            {genres.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedGenre === g
                    ? 'bg-amber-400 text-neutral-950 border-amber-400'
                    : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 rounded-xl h-32 animate-pulse" />
            ))}
          </div>
        ) : displayMusicals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayMusicals.map(m => (
              <MusicalCard key={m.id} musical={m} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-neutral-500">
            <p className="text-lg mb-2">No shows in the database yet.</p>
            <p className="text-sm">Check back after data has been imported from Ticketmaster.</p>
          </div>
        )}
      </section>
    </div>
  );
}
