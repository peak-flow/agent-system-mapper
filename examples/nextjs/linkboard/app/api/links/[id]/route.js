import { NextResponse } from 'next/server'
import { voteLink } from '../../../../lib/store'

export async function PATCH(request, { params }) {
  const link = voteLink(params.id)
  if (!link) {
    return NextResponse.json({ error: 'link not found' }, { status: 404 })
  }
  return NextResponse.json(link)
}
