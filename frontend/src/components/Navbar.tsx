import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <nav className="bg-neutral-950 border-b border-neutral-800 px-6 py-4 flex items-center gap-6">
      <Link to="/" className="text-amber-400 font-bold text-xl tracking-wide shrink-0">
        Shows For Us
      </Link>
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search shows or cast..."
          className="w-full bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-400 transition-colors"
        />
      </form>
    </nav>
  );
}
