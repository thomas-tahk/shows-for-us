// Output shape of `npm run pull` (data/shows.json). The show page imports these types.

export interface PersonCredit {
  name: string
  /** Wikidata Q-id of the person. */
  qid: string
  /** Outbound link to the person's IBDB page (link only; built from Wikidata P1220). */
  ibdb_url?: string
}

export interface ShowImage {
  /** Commons file name, without the "File:" prefix. */
  commons_file: string
  /** URL of the license text from Commons, when stated. */
  license_url: string | null
  /** Direct file URL on upload.wikimedia.org. */
  url: string
  /** The file's own license, e.g. "CC BY-SA 4.0". */
  license: string
  /** Author as stated on Commons (plain text). */
  author: string
  /** Commons description page, to credit and link. */
  source_url: string
}

export interface ShowAward {
  name: string
  qid: string
}

export interface ShowLinks {
  ibdb?: string
  playbill?: string
  official_site?: string
}

export interface ShowSummary {
  text: string
  /** Wikipedia article the text came from. */
  source_url: string
  license: 'CC BY-SA 4.0'
  modified: false
}

export interface Show {
  slug: string
  title: string
  qids: string[]
  composers: PersonCredit[]
  lyricists: PersonCredit[]
  librettists: PersonCredit[]
  /** `date` is ISO but only as precise as Wikidata: "1985", "1985-09" or "1985-09-28". */
  premiere: { date: string | null; venue: string | null }
  awards: ShowAward[]
  image: ShowImage | null
  links: ShowLinks
  summary: ShowSummary | null
  wikidata_url: string
}

export interface ShowsFile {
  meta: {
    generated_at: string
    mode: 'live' | 'recorded-live' | 'offline-fixtures'
    live: boolean
    /** Slugs that could not be built in this run. */
    skipped: string[]
  }
  shows: Show[]
}

export interface Flagship {
  slug: string
  title: string
  /** en.wikipedia article title. */
  enwiki: string
  /** Wikidata items; omitted when not certain, then resolved from the enwiki sitelink. */
  qids?: string[]
  /** The English-version item, whose credits win when items are merged. */
  prefer_qid?: string
  reason: string
}
