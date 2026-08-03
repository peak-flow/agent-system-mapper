import Link from 'next/link'
import VoteButton from './VoteButton'

// Server component: pure rendering, no state and no event handlers.
export default function LinkCard({ link }) {
  const host = new URL(link.url).host
  return (
    <div className="link-card">
      <Link href={`/links/${link.id}`}>{link.title}</Link>
      <span className="host">({host})</span>
      <span className="tag">{link.tag}</span>
      <VoteButton id={link.id} votes={link.votes} />
    </div>
  )
}
