import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-neutral-950 border-b border-neutral-800 px-4 sm:px-6 py-2 flex items-center">
      <Link to="/" className="inline-flex min-h-11 items-center text-amber-400 font-bold text-xl tracking-wide">
        Shows For Us
      </Link>
    </nav>
  )
}
