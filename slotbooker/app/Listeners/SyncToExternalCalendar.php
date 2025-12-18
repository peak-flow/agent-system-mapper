<?php

namespace App\Listeners;

use App\Contracts\CalendarServiceInterface;
use App\Events\BookingCreated;
use App\Events\BookingCancelled;
use Illuminate\Support\Facades\Log;

class SyncToExternalCalendar
{
    private CalendarServiceInterface $calendarService;

    public function __construct(CalendarServiceInterface $calendarService)
    {
        $this->calendarService = $calendarService;
    }

    /**
     * Handle booking created - sync to external calendar
     */
    public function handleCreated(BookingCreated $event): void
    {
        $booking = $event->booking;

        Log::info('Syncing new booking to calendar', ['booking_id' => $booking->id]);

        $externalId = $this->calendarService->syncBooking($booking);

        if ($externalId) {
            $booking->markSynced($externalId);
        }
        // Wart: if sync fails, we just log it (in service) but don't retry or notify anyone
    }

    /**
     * Handle booking cancelled - remove from external calendar
     */
    public function handleCancelled(BookingCancelled $event): void
    {
        $booking = $event->booking;

        Log::info('Removing cancelled booking from calendar', ['booking_id' => $booking->id]);

        $success = $this->calendarService->removeBooking($booking);

        if (!$success) {
            // Wart: we log failure but don't do anything about it
            Log::warning('Failed to remove booking from external calendar', [
                'booking_id' => $booking->id,
            ]);
        }
    }

    /**
     * Register the listeners for the subscriber.
     * Wart: using subscribe pattern which is less discoverable than EventServiceProvider
     */
    public function subscribe($events): array
    {
        return [
            BookingCreated::class => 'handleCreated',
            BookingCancelled::class => 'handleCancelled',
        ];
    }
}
