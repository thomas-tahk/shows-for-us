# Ticketmaster fixtures

`discovery-hamilton.json` is HAND-BUILT in the documented Discovery API v2
`_embedded.events[]` shape (no API key was available when it was written). It
deliberately contains an off-topic event, a date-TBA event and out-of-order dates.

To record a real one: with a key in `TICKETMASTER_API_KEY`, run
`curl "https://app.ticketmaster.com/discovery/v2/events.json?keyword=Hamilton&classificationName=Theatre&sort=date,asc&size=20&countryCode=US&apikey=$TICKETMASTER_API_KEY"`
and save the body here. Ticketmaster's terms forbid long-term storage of Event
Content, so keep recorded fixtures test-only and never ship them in the build.
