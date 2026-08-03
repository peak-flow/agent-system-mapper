import { NextResponse } from 'next/server'
import { listLinks, createLink } from '../../../lib/store'

// Wart: duplicated from lib/store.js — the two copies can silently drift.
const MAX_TITLE_LENGTH = 80

export async function GET() {
  return NextResponse.json(listLinks())
}

export async function POST(request) {
  const body = await request.json()

  if (!body.title || body.title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { error: `title is required (max ${MAX_TITLE_LENGTH} chars)` },
      { status: 400 },
    )
  }
  if (!body.url || !body.url.startsWith('http')) {
    return NextResponse.json(
      { error: 'url must start with http' },
      { status: 400 },
    )
  }
  // Wart: tag is passed straight through with no validation — whatever
  // value (or type) the client sends lands in the store as-is.
  const link = createLink({ title: body.title, url: body.url, tag: body.tag })
  return NextResponse.json(link, { status: 201 })
}
