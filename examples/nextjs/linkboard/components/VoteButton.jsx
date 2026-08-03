'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VoteButton({ id, votes }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  // Wart: no error handling — a failed PATCH is silently swallowed and
  // the on-screen count goes stale with no feedback to the user.
  async function vote() {
    setPending(true)
    await fetch(`/api/links/${id}`, { method: 'PATCH' })
    setPending(false)
    router.refresh()
  }

  return (
    <button onClick={vote} disabled={pending}>
      ▲ {votes}
    </button>
  )
}
