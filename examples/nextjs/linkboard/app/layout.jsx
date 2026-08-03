import Link from 'next/link'

export const metadata = {
  title: 'LinkBoard',
  description: 'Team link-sharing board',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header>
          <h1>LinkBoard</h1>
          <nav>
            <Link href="/">Board</Link>
            <Link href="/submit">Submit a link</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
