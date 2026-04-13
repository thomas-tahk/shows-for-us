import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { CastMemberWithRoles } from '../types';

const ROLE_TYPE_COLORS = {
  lead: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  supporting: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  ensemble: 'text-neutral-400 bg-neutral-800 border-neutral-700',
};

export default function CastMemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [castMember, setCastMember] = useState<CastMemberWithRoles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const data = await api.getCastMemberWithRoles(id!);
        setCastMember(data);
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
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-neutral-900 animate-pulse" />
            <div className="h-8 bg-neutral-900 rounded-xl animate-pulse w-48" />
          </div>
          <div className="h-20 bg-neutral-900 rounded-xl animate-pulse mt-6" />
        </div>
      </div>
    );
  }

  if (error || !castMember) {
    return (
      <div className="min-h-screen bg-neutral-950 px-6 py-12 text-center">
        <p className="text-red-400 mb-4">{error ?? 'Cast member not found'}</p>
        <Link to="/" className="text-amber-400 hover:underline text-sm">← Back to home</Link>
      </div>
    );
  }

  const initials = castMember.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="text-neutral-500 hover:text-amber-400 text-sm transition-colors mb-6 inline-block">
            ← Back to home
          </Link>
          <div className="flex items-center gap-5">
            {castMember.profileImage ? (
              <img
                src={castMember.profileImage}
                alt={castMember.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-neutral-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-neutral-700 flex items-center justify-center text-white text-2xl font-bold border-2 border-neutral-600">
                {initials}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">{castMember.name}</h1>
              <p className="text-neutral-500 text-sm mt-1">
                {castMember.roles?.length ?? 0} credit{(castMember.roles?.length ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {castMember.bio && (
            <p className="text-neutral-400 mt-6 leading-relaxed max-w-2xl">{castMember.bio}</p>
          )}
        </div>
      </div>

      {/* Credits */}
      <div className="px-6 py-10 max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold text-white mb-6">Credits</h2>
        {castMember.roles?.length > 0 ? (
          <div className="space-y-3">
            {castMember.roles.map(role => (
              <div key={role.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white font-medium">{role.characterName}</p>
                  {role.musicalName && (
                    <p className="text-neutral-500 text-sm mt-0.5">{role.musicalName}</p>
                  )}
                  {role.productionName && (
                    <p className="text-neutral-600 text-xs mt-0.5">{role.productionName}</p>
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border capitalize shrink-0 ${ROLE_TYPE_COLORS[role.roleType]}`}>
                  {role.roleType}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 text-sm">No credits listed yet.</p>
        )}
      </div>
    </div>
  );
}
