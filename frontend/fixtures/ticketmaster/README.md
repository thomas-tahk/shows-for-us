# Ticketmaster fixtures

`discovery-hamilton.json` is HAND-BUILT in the documented Discovery API v2
`_embedded.events[]` shape. It deliberately contains an off-topic event, a
date-TBA event and out-of-order dates.

Do NOT save a real Discovery response in this repo. Ticketmaster's terms forbid
long-term storage of Event Content, so real responses must never be committed,
not even as test-only fixtures. To check the real response shape, call the API
and inspect the body outside the repo (a terminal, or a scratch file in `/tmp`
that you delete afterwards), then update the hand-built fixture by hand.
