import { Link } from 'react-router-dom';
import type { Musical } from '../types';

interface Props {
  musical: Musical;
}

export default function MusicalCard({ musical }: Props) {
  return (
    <Link
      to={`/musicals/${musical.id}`}
      className="block bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-amber-400/50 hover:bg-neutral-800 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-white font-semibold text-base group-hover:text-amber-400 transition-colors leading-tight">
          {musical.name}
        </h3>
        <span className="shrink-0 text-xs bg-neutral-800 group-hover:bg-neutral-700 text-neutral-400 px-2 py-1 rounded-full border border-neutral-700">
          {musical.genre}
        </span>
      </div>
      {musical.description && (
        <p className="text-neutral-400 text-sm line-clamp-2 leading-relaxed">
          {musical.description}
        </p>
      )}
      {musical.originalBroadwayRun && (
        <p className="text-neutral-500 text-xs mt-3">
          Broadway · {musical.originalBroadwayRun.theater}
        </p>
      )}
    </Link>
  );
}
