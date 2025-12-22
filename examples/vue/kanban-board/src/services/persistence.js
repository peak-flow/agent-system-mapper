/**
 * Local persistence service
 *
 * ARCHITECTURE NOTE:
 * This handles LOCAL storage only. It does NOT communicate with server.
 * Data saved here is optimistic - server may have different state.
 *
 * Using localStorage (not IndexedDB) for simplicity.
 * Wart: No versioning, no migration, no corruption handling.
 */

const STORAGE_KEY = 'kanban-board-data'

export const persistence = {
  /**
   * Save board state to localStorage
   */
  save(data) {
    try {
      const serialized = JSON.stringify({
        ...data,
        savedAt: new Date().toISOString(),
      })
      localStorage.setItem(STORAGE_KEY, serialized)
      return true
    } catch (error) {
      // Wart: Silently fails on quota exceeded
      console.error('Failed to save to localStorage:', error)
      return false
    }
  },

  /**
   * Load board state from localStorage
   */
  load() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY)
      if (!serialized) return null

      const data = JSON.parse(serialized)
      return data
    } catch (error) {
      // Wart: On parse error, returns null instead of default state
      // Could lose all data on corruption
      console.error('Failed to load from localStorage:', error)
      return null
    }
  },

  /**
   * Clear all stored data
   */
  clear() {
    localStorage.removeItem(STORAGE_KEY)
  },

  /**
   * Check if we have stored data
   */
  hasData() {
    return localStorage.getItem(STORAGE_KEY) !== null
  },

  /**
   * Get storage usage (approximate)
   * Wart: Doesn't account for other app data
   */
  getUsage() {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? data.length : 0
  },
}

// Wart: No IndexedDB implementation despite being mentioned in requirements
// export const indexedDBPersistence = { ... }
