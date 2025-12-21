<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\TimeSlot;
use App\Events\BookingCreated;
use App\Events\BookingCancelled;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * Show available slots and booking form
     */
    public function index()
    {
        $slots = TimeSlot::availableFuture()
            ->with('bookings')
            ->get();

        $userBookings = auth()->user()->bookings()
            ->with('timeSlot')
            ->where('status', '!=', 'cancelled')
            ->get();

        return view('booking', [
            'slots' => $slots,
            'userBookings' => $userBookings,
        ]);
    }

    /**
     * Create a new booking
     * Flow: validate -> check capacity -> create -> fire event
     */
    public function store(Request $request)
    {
        $slotId = $request->input('time_slot_id');
        $slot = TimeSlot::findOrFail($slotId);

        // Wart: duplicates capacity check from TimeSlot::hasAvailability()
        $confirmedCount = $slot->bookings()->where('status', 'confirmed')->count();
        if ($confirmedCount >= $slot->capacity) {
            return back()->with('error', 'This slot is no longer available');
        }

        // Wart: no validation on notes field, could be XSS
        $booking = Booking::create([
            'user_id' => auth()->id(),
            'time_slot_id' => $slotId,
            'status' => 'pending',  // Wart: should use constant
            'notes' => $request->input('notes'),
        ]);

        // Fire event - listener will sync to external calendar
        event(new BookingCreated($booking));

        // Wart: assuming event succeeded, mark as confirmed
        $booking->update(['status' => 'confirmed']);

        return redirect()->route('booking.index')
            ->with('success', 'Booking confirmed!');
    }

    /**
     * Cancel a booking
     * Flow: validate ownership -> check cancellation rules -> cancel -> fire event
     */
    public function cancel(Request $request, Booking $booking)
    {
        // Check ownership
        if ($booking->user_id !== auth()->id()) {
            abort(403);
        }

        // Check if can cancel (24hr rule)
        if (!$booking->canCancel()) {
            return back()->with('error', 'Cannot cancel within 24 hours of appointment');
        }

        $booking->update(['status' => Booking::STATUS_CANCELLED]);

        // Fire event - listener will remove from external calendar
        event(new BookingCancelled($booking));

        return redirect()->route('booking.index')
            ->with('success', 'Booking cancelled');
    }

    /**
     * API endpoint for JS to check slot availability
     * Called by booking.js when user selects a date
     */
    public function checkAvailability(Request $request)
    {
        $slotId = $request->input('slot_id');
        $slot = TimeSlot::find($slotId);

        if (!$slot) {
            return response()->json(['available' => false, 'reason' => 'not_found']);
        }

        return response()->json([
            'available' => $slot->hasAvailability(),
            'spots_left' => $slot->spotsLeft(),
            'start_time' => $slot->start_time->format('g:i A'),
        ]);
    }
}
