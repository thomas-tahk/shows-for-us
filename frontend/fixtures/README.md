# Fixtures

These files are **hand-built, not recorded**. They were written by hand to match the response shapes of the live endpoints (Wikidata SPARQL JSON results, Wikipedia REST `page/summary`, Commons `imageinfo` + `extmetadata`), because the environment that built them could not reach those hosts.

- Facts taken from `docs/chief/research/data-sources.md` section 1.1: the Hamilton and Les Mis Q-ids, Hamilton's first performance (2015-02-17, The Public Theater), Hamilton's IBDB id 499520 and Playbill id, Les Mis English-version lyricists (Herbert Kretzmer, James Fenton) and premiere (Barbican Centre, 1985-09-28).
- Person, venue and award Q-ids are fake placeholders (`Q0000001` ...). IBDB person ids (`9999991` ...), the Les Mis Playbill id, and the Commons files, authors and licenses are placeholders too.
- The Wikipedia `extract` fields are **placeholder text**, not Wikipedia text. Revision ids, timestamps and descriptions are placeholders.
- `data/shows.json` built from these is marked `meta.mode: "offline-fixtures"`, `live: false`. Do not publish it.

- **Unverified formatter:** the IBDB show URL pattern `https://www.ibdb.com/broadway-show/{P1219}` is from memory. Owner to check the formatter URL (P1630) on Property:P1219 and fix `buildShow` in `scripts/pull-lib.ts` if it differs.
- Premiere date rows carry a placeholder time precision of `11` (day).

To replace the placeholders with real Wikidata/Wikipedia data, do NOT run `npm run pull -- --record`: it overwrites these hand-built files, and `tests/pull.test.ts` asserts their hand-built contents, so the tests would break. Instead run a plain live pull from `frontend/` (or run the "Refresh data" workflow, see `docs/deploy.md`):

```
npm run pull
```

That writes `data/shows.json` from live responses and leaves these fixtures alone. (`--record` exists only for deliberately re-recording fixtures, after which expected values in `tests/pull.test.ts` need updating.)
