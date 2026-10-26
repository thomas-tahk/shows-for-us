# Fixtures

These files are **hand-built, not recorded**. They were written by hand to match the response shapes of the live endpoints (Wikidata SPARQL JSON results, Wikipedia REST `page/summary`, Commons `imageinfo` + `extmetadata`), because the environment that built them could not reach those hosts.

- Facts taken from `docs/chief/research/data-sources.md` section 1.1: the Hamilton and Les Mis Q-ids, Hamilton's first performance (2015-02-17, The Public Theater), Hamilton's IBDB id 499520 and Playbill id, Les Mis English-version lyricists (Herbert Kretzmer, James Fenton) and premiere (Barbican Centre, 1985-09-28).
- Person, venue and award Q-ids are fake placeholders (`Q0000001` ...). IBDB person ids (`9999991` ...), the Les Mis Playbill id, and the Commons files, authors and licenses are placeholders too.
- The Wikipedia `extract` fields are **placeholder text**, not Wikipedia text. Revision ids, timestamps and descriptions are placeholders.
- `data/shows.json` built from these is marked `meta.mode: "offline-fixtures"`, `live: false`. Do not publish it.

To replace them with real recorded responses, from `frontend/`:

```
npm run pull -- --record
```

That runs the live pull (sequential, descriptive User-Agent, honours 429 + Retry-After) and overwrites every file here with the raw response. Review the diff, then run `npm test`; the tests assert credits and URLs, so update expected values if Wikidata differs from what the hand-built fixtures say.
