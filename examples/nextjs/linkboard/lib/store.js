/**
 * In-memory link store shared by server components and API routes.
 *
 * Wart: Module-level Map — every server restart wipes the data, and the
 * store is NOT shared across serverless instances. Two lambdas each get
 * their own copy, so votes and submissions silently diverge in production.
 */

// Wart: duplicated in app/api/links/route.js instead of being imported there.
export const MAX_TITLE_LENGTH = 80

let nextId = 4

const links = new Map([
  ['1', {
    id: '1',
    title: 'Next.js App Router docs',
    url: 'https://nextjs.org/docs/app',
    tag: 'docs',
    votes: 5,
    createdAt: '2026-07-01T09:00:00Z',
  }],
  ['2', {
    id: '2',
    title: 'React Server Components explainer',
    url: 'https://react.dev/reference/rsc/server-components',
    tag: 'reading',
    votes: 3,
    createdAt: '2026-07-02T14:30:00Z',
  }],
  ['3', {
    id: '3',
    title: 'Team retro board',
    url: 'https://example.com/retro',
    tag: 'internal',
    votes: 1,
    createdAt: '2026-07-03T08:15:00Z',
  }],
])

export function listLinks() {
  return [...links.values()].sort((a, b) => b.votes - a.votes)
}

export function getLink(id) {
  return links.get(id) ?? null
}

export function createLink({ title, url, tag }) {
  const id = String(nextId++)
  const link = {
    id,
    title: title.slice(0, MAX_TITLE_LENGTH),
    url,
    tag,
    votes: 0,
    createdAt: new Date().toISOString(),
  }
  links.set(id, link)
  return link
}

export function voteLink(id) {
  const link = links.get(id)
  if (!link) return null
  link.votes += 1
  return link
}
