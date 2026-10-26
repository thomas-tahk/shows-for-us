import { handleEvents } from './_lib/events.js'

export async function GET(request: Request): Promise<Response> {
  const show = new URL(request.url).searchParams.get('show')
  return handleEvents(show, {
    fetch: (input, init) => fetch(input, init),
    apiKey: process.env.TICKETMASTER_API_KEY,
    now: () => new Date(),
  })
}
