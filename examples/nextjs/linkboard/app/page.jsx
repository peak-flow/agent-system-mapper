import { listLinks } from '../lib/store'
import LinkCard from '../components/LinkCard'

// Server component: reads the store directly, no fetch involved.
export default function BoardPage() {
  const links = listLinks()
  return (
    <section>
      <h2>Top links</h2>
      {links.length === 0 && <p>No links yet. Submit the first one!</p>}
      <ul>
        {links.map((link) => (
          <li key={link.id}>
            <LinkCard link={link} />
          </li>
        ))}
      </ul>
    </section>
  )
}
