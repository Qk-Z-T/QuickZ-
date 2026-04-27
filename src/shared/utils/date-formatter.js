// src/shared/utils/date-formatter.js
// Thin wrapper around moment.js for consistent date formatting

/**
 * Format a Firestore Timestamp, Date, or ISO string into a human‑readable format.
 * @param {Object|string|Date} dateInput
 * @param {string} format - moment format string
 * @returns {string}
 */
export function formatDate(dateInput, format = 'DD MMM, YYYY') {
  if (!dateInput) return '';
  if (dateInput.toDate) {
    // Firestore Timestamp
    return moment(dateInput.toDate()).format(format);
  }
  return moment(dateInput).format(format);
}

/**
 * Short relative time (e.g., "2 hours ago", "in 3 days").
 * @param {Object|string|Date} dateInput
 * @returns {string}
 */
export function fromNow(dateInput) {
  if (!dateInput) return '';
  if (dateInput.toDate) return moment(dateInput.toDate()).fromNow();
  return moment(dateInput).fromNow();
}

// Expose to window if needed
window.formatDate = formatDate;
window.fromNow = fromNow;
