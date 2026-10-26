/** Flagship slug -> Ticketmaster search keyword (the title in data/flagships.json). */
const KEYWORDS: Record<string, string> = {
  hamilton: 'Hamilton',
  'les-miserables': 'Les Misérables',
  'the-lion-king': 'The Lion King',
  rent: 'Rent',
  'the-book-of-mormon': 'The Book of Mormon',
  hadestown: 'Hadestown',
  'kimberly-akimbo': 'Kimberly Akimbo',
  'the-outsiders': 'The Outsiders',
  'maybe-happy-ending': 'Maybe Happy Ending',
  'jersey-boys': 'Jersey Boys',
  'kinky-boots': 'Kinky Boots',
  'the-phantom-of-the-opera': 'The Phantom of the Opera',
  'dear-evan-hansen': 'Dear Evan Hansen',
  'next-to-normal': 'Next to Normal',
  'a-strange-loop': 'A Strange Loop',
}

/** Slugs are lowercase letters, digits and hyphens only. */
export function isValidSlug(slug: string | null | undefined): slug is string {
  return !!slug && slug.length <= 80 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)
}

/** Ticketmaster search keyword for a flagship slug, or undefined for any other slug. */
export function keywordForSlug(slug: string): string | undefined {
  return Object.hasOwn(KEYWORDS, slug) ? KEYWORDS[slug] : undefined
}
