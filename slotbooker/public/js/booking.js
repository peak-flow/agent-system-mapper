/**
 * Booking page JavaScript
 *
 * Handles:
 * - Real-time availability checking via AJAX
 * - Cancel confirmation modal
 * - Form validation
 */

// Wart: 24 hour rule duplicated here and in Booking.php:canCancel()
const CANCEL_HOURS_BEFORE = 24;

/**
 * Check slot availability via API
 * Called when user clicks on a slot card to get fresh availability
 */
function checkSlotAvailability(slotId) {
    // Wart: API URL hardcoded, should come from a config
    fetch('/api/slots/availability?slot_id=' + slotId)
        .then(response => response.json())
        .then(data => {
            updateSlotDisplay(slotId, data);
        })
        .catch(error => {
            console.error('Failed to check availability:', error);
        });
}

/**
 * Update the slot display with fresh availability data
 */
function updateSlotDisplay(slotId, data) {
    const availabilityEl = document.getElementById('availability-' + slotId);
    if (!availabilityEl) return;

    if (data.available) {
        availabilityEl.textContent = data.spots_left + ' spots left';
        availabilityEl.className = 'availability';
    } else {
        availabilityEl.textContent = 'Fully Booked';
        availabilityEl.className = 'availability full';

        // Disable the book button if exists
        const card = document.querySelector('[data-slot-id="' + slotId + '"]');
        const btn = card?.querySelector('.book-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Unavailable';
        }
    }
}

/**
 * Show cancel confirmation modal
 * Wart: uses inline onclick in HTML, should use event delegation
 */
function confirmCancel(bookingId) {
    const modal = document.getElementById('cancel-modal');
    const form = document.getElementById('cancel-form');

    // Wart: URL construction duplicates route logic from Laravel
    form.action = '/booking/' + bookingId + '/cancel';

    modal.style.display = 'block';
}

/**
 * Close the cancel modal
 */
function closeModal() {
    document.getElementById('cancel-modal').style.display = 'none';
}

/**
 * Initialize page
 * - Add click handlers to slot cards for availability refresh
 * - Refresh availability every 30 seconds
 */
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers to slot cards
    document.querySelectorAll('.slot-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on form elements
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
                return;
            }
            const slotId = this.dataset.slotId;
            checkSlotAvailability(slotId);
        });
    });

    // Wart: polling interval hardcoded, no way to configure
    // Also: keeps running even if tab is inactive
    setInterval(function() {
        document.querySelectorAll('.slot-card').forEach(card => {
            checkSlotAvailability(card.dataset.slotId);
        });
    }, 30000);
});

/**
 * Close modal if clicking outside of it
 */
window.onclick = function(event) {
    const modal = document.getElementById('cancel-modal');
    if (event.target === modal) {
        closeModal();
    }
};
