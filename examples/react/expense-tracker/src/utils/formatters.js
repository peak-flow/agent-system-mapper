/**
 * Utility functions for formatting values
 */

/**
 * Format number as currency (USD)
 * Wart: Hardcoded to USD, should be configurable
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/**
 * Format date string for display
 */
export function formatDate(dateString) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/**
 * Format date as relative time (e.g., "2 days ago")
 * Wart: Not implemented, returns date string instead
 */
export function formatRelativeTime(dateString) {
  // TODO: Implement relative time formatting
  return formatDate(dateString)
}
