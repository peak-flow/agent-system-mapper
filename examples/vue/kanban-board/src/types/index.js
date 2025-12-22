/**
 * Type definitions (JSDoc style for vanilla JS)
 *
 * These define the data shapes used in the app.
 * Note: These are DOCUMENTATION only - no runtime validation.
 */

/**
 * @typedef {Object} Card
 * @property {string} id - Unique card identifier
 * @property {string} title - Card title
 * @property {string} description - Card description (optional)
 * @property {string} columnId - ID of column this card belongs to
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 * @property {'pending'|'synced'|'error'} syncStatus - Sync state
 */

/**
 * @typedef {Object} Column
 * @property {string} id - Unique column identifier
 * @property {string} title - Column title
 * @property {string[]} cardIds - Ordered array of card IDs in this column
 */

/**
 * @typedef {Object} BoardState
 * @property {Column[]} columns - All columns
 * @property {Object.<string, Card>} cards - Cards indexed by ID
 * @property {string|null} lastSyncedAt - Last successful sync timestamp
 */

/**
 * @typedef {Object} SyncState
 * @property {boolean} isOnline - Network status
 * @property {boolean} isSyncing - Currently syncing
 * @property {string[]} pendingQueue - Card IDs waiting to sync
 * @property {string|null} lastSyncError - Last error message
 */

// Sync status values
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  ERROR: 'error',
}

// Wart: No actual TypeScript, just JSDoc
// Real app should use TypeScript for type safety
