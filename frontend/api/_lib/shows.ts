const KEYWORDS: Record<string, string> = {
  hamilton: 'Hamilton',
  'les-miserables': 'Les Misérables',
}

/** Slugs are lowercase letters, digits and hyphens only. */
export function isValidSlug(slug: string | null | undefined): slug is string {
  return !!slug && slug.length <= 80 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)
}

/** Ticketmaster search keyword for a show slug; falls back to the title-cased slug. */
export function keywordForSlug(slug: string): string {
  return (
    KEYWORDS[slug] ??
    slug
      .split('-')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  )
}
