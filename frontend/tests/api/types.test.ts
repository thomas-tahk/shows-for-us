import { describe, expectTypeOf, it } from 'vitest'
import type { ShowEvent as ApiShowEvent } from '../../api/_lib/events.ts'
import type { ShowEvent as AppShowEvent } from '../../src/data/events.ts'

// The two ShowEvent types live in separate TS programs (api/ and src/). If either changes
// without the other, `npm run typecheck` fails here.
describe('ShowEvent', () => {
  it('is identical in the API and the app', () => {
    expectTypeOf<ApiShowEvent>().toEqualTypeOf<AppShowEvent>()
  })
})
