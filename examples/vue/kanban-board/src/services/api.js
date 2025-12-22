/**
 * API service - mock server communication
 *
 * ARCHITECTURE NOTE:
 * This simulates a server API. In reality:
 * - No actual server exists
 * - No authentication
 * - No conflict resolution
 * - Response is fake
 *
 * The UI will show "synced" even though nothing actually synced.
 */

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Wart: "Server state" is just in-memory, resets on refresh
let serverState = {
  cards: {},
  lastModified: null,
}

export const api = {
  /**
   * Sync a card to "server"
   *
   * Wart: This looks like it syncs but actually:
   * - Just stores in memory
   * - No persistence
   * - No conflict detection
   * - Always succeeds (unless simulated failure)
   */
  async syncCard(card) {
    await delay(200 + Math.random() * 300) // Simulate network

    // Simulate occasional failures (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Network error - sync failed')
    }

    // Wart: No version checking - blindly overwrites
    serverState.cards[card.id] = {
      ...card,
      syncedAt: new Date().toISOString(),
    }
    serverState.lastModified = new Date().toISOString()

    return { success: true, card: serverState.cards[card.id] }
  },

  /**
   * Fetch all cards from "server"
   *
   * Wart: Returns mock data, not actual server state
   */
  async fetchCards() {
    await delay(300)
    return Object.values(serverState.cards)
  },

  /**
   * Delete card from "server"
   *
   * Wart: Not implemented - deletes only happen locally
   */
  async deleteCard(cardId) {
    throw new Error('Delete sync not implemented')
  },

  /**
   * Check if server is reachable
   *
   * Wart: Always returns true - no actual health check
   */
  async healthCheck() {
    await delay(100)
    return { ok: true }
  },

  /**
   * Get server timestamp (for conflict detection)
   *
   * Wart: Returns local time, not server time
   */
  async getServerTime() {
    return new Date().toISOString()
  },
}
