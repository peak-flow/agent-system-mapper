'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubmitForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [tag, setTag] = useState('')
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, url, tag }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Something went wrong')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        URL
        <input value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label>
        Tag
        <input value={tag} onChange={(e) => setTag(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit">Share it</button>
    </form>
  )
}
