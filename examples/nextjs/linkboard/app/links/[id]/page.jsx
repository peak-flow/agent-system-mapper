import { notFound } from 'next/navigation'
import { getLink } from '../../../lib/store'
import VoteButton from '../../../components/VoteButton'

// Server component for the /links/[id] dynamic route.
export default function LinkDetailPage({ params }) {
  const link = getLink(params.id)
  if (!link) {
    notFound()
  }
  return (
    <article>
      <h2>{link.title}</h2>
      <p>
        <a href={link.url}>{link.url}</a>
      </p>
      <p>Tag: {link.tag}</p>
      <p>Shared: {link.createdAt}</p>
      <VoteButton id={link.id} votes={link.votes} />
    </article>
  )
}
