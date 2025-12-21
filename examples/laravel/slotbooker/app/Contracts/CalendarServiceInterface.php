<?php

namespace App\Contracts;

use App\Models\Booking;

interface CalendarServiceInterface
{
    /**
     * Sync a booking to the external calendar
     *
     * @param Booking $booking
     * @return string|null External calendar event ID
     */
    public function syncBooking(Booking $booking): ?string;

    /**
     * Remove a booking from external calendar
     *
     * @param Booking $booking
     * @return bool
     */
    public function removeBooking(Booking $booking): bool;
}
