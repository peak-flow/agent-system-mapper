<!DOCTYPE html>
<html>
<head>
    <title>Book a Slot</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body>
    <h1>Book an Appointment</h1>

    {{-- Flash messages --}}
    @if(session('success'))
        <div class="alert success">{{ session('success') }}</div>
    @endif
    @if(session('error'))
        <div class="alert error">{{ session('error') }}</div>
    @endif

    {{-- Available Slots Section --}}
    <section id="available-slots">
        <h2>Available Slots</h2>

        @foreach($slots as $slot)
            <div class="slot-card" data-slot-id="{{ $slot->id }}">
                <span class="time">
                    {{ $slot->start_time->format('M j, Y g:i A') }}
                </span>
                <span class="availability" id="availability-{{ $slot->id }}">
                    {{ $slot->spotsLeft() }} spots left
                </span>

                @if($slot->hasAvailability())
                    {{-- Wart: form action URL hardcoded, should use route() --}}
                    <form action="/booking" method="POST" class="booking-form">
                        @csrf
                        <input type="hidden" name="time_slot_id" value="{{ $slot->id }}">
                        <input type="text" name="notes" placeholder="Notes (optional)">
                        <button type="submit" class="book-btn">Book This Slot</button>
                    </form>
                @else
                    <span class="full">Fully Booked</span>
                @endif
            </div>
        @endforeach
    </section>

    {{-- User's Bookings Section --}}
    <section id="my-bookings">
        <h2>My Bookings</h2>

        @forelse($userBookings as $booking)
            <div class="booking-card">
                <span class="time">
                    {{ $booking->timeSlot->start_time->format('M j, Y g:i A') }}
                </span>
                <span class="status status-{{ $booking->status }}">
                    {{ ucfirst($booking->status) }}
                </span>

                @if($booking->canCancel())
                    <button
                        class="cancel-btn"
                        data-booking-id="{{ $booking->id }}"
                        onclick="confirmCancel({{ $booking->id }})"
                    >
                        Cancel
                    </button>
                @else
                    <span class="no-cancel">Cannot cancel (< 24hrs)</span>
                @endif
            </div>
        @empty
            <p>No bookings yet.</p>
        @endforelse
    </section>

    {{-- Cancel Confirmation Modal --}}
    <div id="cancel-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <p>Are you sure you want to cancel this booking?</p>
            <form id="cancel-form" method="POST">
                @csrf
                <button type="submit">Yes, Cancel</button>
                <button type="button" onclick="closeModal()">No, Keep It</button>
            </form>
        </div>
    </div>

    {{-- Load booking JS - handles slot selection and cancel confirmation --}}
    <script src="/js/booking.js"></script>
</body>
</html>
