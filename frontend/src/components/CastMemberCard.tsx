import { Link } from 'react-router-dom';
import type { CastMember } from '../types';

interface Props {
  castMember: CastMember;
}

export default function CastMemberCard({ castMember }: Props) {
  return (
    <Link
      to={`/cast/${castMember.id}`}
      className="block bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-amber-400/50 hover:bg-neutral-800 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-neutral-300 font-semibold text-sm shrink-0">
          {castMember.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">
            {castMember.name}
          </h3>
          {castMember.bio && (
            <p className="text-neutral-400 text-xs line-clamp-1 mt-0.5">{castMember.bio}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
