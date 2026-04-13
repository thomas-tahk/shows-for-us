import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { MusicalWithProductions } from '../types';

const STATUS_COLORS = {
  active: 'bg-green-900/50 text-green-400 border-green-800',
  upcoming: 'bg-blue-900/50 text-blue-400 border-blue-800',
  completed: 'bg-neutral-800 text-neutral-500 border-neutral-700',
};

const TYPE_LABELS = {
  broadway: 'Broadway',
  touring: 'National Tour',
  regional: 'Regional',
};

export default function MusicalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [musical, setMusical] = useState<MusicalWithProductions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const data = await api.getMusicalWithProductions(id!);
        setMusical(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-10 bg-neutral-900 rounded-xl animate-pulse w-64" />
          <div className="h-4 bg-neutral-900 rounded animate-pulse w-32" />
          <div className="h-24 bg-neutral-900 rounded-xl animate-pulse mt-6" />
        </div>
      </div>
    );
  }

  if (error || !musical) {
    return (
      <div className="min-h-screen bg-neutral-950 px-6 py-12 text-center">
        <p className="text-red-400 mb-4">{error ?? 'Musical not found'}</p>
        <Link to="/" className="text-amber-400 hover:underline text-sm">← Back to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="text-neutral-500 hover:text-amber-400 text-sm transition-colors mb-6 inline-block">
            ← Back to home
          </Link>
          <div className="flex items-start gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{musical.name}</h1>
              <span className="text-sm bg-neutral-800 text-neutral-400 px-3 py-1 rounded-full border border-neutral-700">
                {musical.genre}
              </span>
            </div>
          </div>
          {musical.description && (
            <p className="text-neutral-400 mt-6 leading-relaxed max-w-2xl">{musical.description}</p>
          )}
          {musical.originalBroadwayRun && (
            <div className="mt-6 p-4 bg-neutral-900 rounded-xl border border-neutral-800 inline-block">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Original Broadway Run</p>
              <p className="text-white font-medium">{musical.originalBroadwayRun.theater}</p>
              <p className="text-neutral-400 text-sm mt-1">
                {new Date(musical.originalBroadwayRun.startDate).getFullYear()}
                {musical.originalBroadwayRun.endDate &&
                  ` – ${new Date(musical.originalBroadwayRun.endDate).getFullYear()}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Productions */}
      <div className="px-6 py-10 max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold text-white mb-6">Productions</h2>
        {musical.productions?.length > 0 ? (
          <div className="space-y-4">
            {musical.productions.map(p => (
              <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-white font-medium">{p.name}</h3>
                    <p className="text-neutral-500 text-sm mt-1">{TYPE_LABELS[p.type] ?? p.type}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[p.status]}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 text-sm">No productions listed yet.</p>
        )}
      </div>
    </div>
  );
}
