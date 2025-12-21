<?php

namespace App\Services;

use App\Contracts\CalendarServiceInterface;
use App\Models\Booking;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CalendarService implements CalendarServiceInterface
{
    private string $apiUrl;
    private string $apiKey;

    public function __construct()
    {
        // Wart: config path is hardcoded, not injected
        $this->apiUrl = config('calendar.api_url');
        $this->apiKey = config('calendar.api_key');
    }

    /**
     * Sync booking to external calendar API
     */
    public function syncBooking(Booking $booking): ?string
    {
        $payload = $this->buildPayload($booking);

        // NOTE: no try/catch here - errors bubble up
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->post($this->apiUrl . '/events', $payload);

        if ($response->successful()) {
            $externalId = $response->json('id');
            Log::info('Booking synced to calendar', [
                'booking_id' => $booking->id,
                'external_id' => $externalId,
            ]);
            return $externalId;
        }

        // Wart: we log but don't throw, caller doesn't know it failed
        Log::error('Calendar sync failed', [
            'booking_id' => $booking->id,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    /**
     * Remove booking from external calendar
     */
    public function removeBooking(Booking $booking): bool
    {
        if (empty($booking->external_calendar_id)) {
            return true; // nothing to remove
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
        ])->delete($this->apiUrl . '/events/' . $booking->external_calendar_id);

        if ($response->successful()) {
            Log::info('Booking removed from calendar', [
                'booking_id' => $booking->id,
            ]);
            return true;
        }

        return false;
    }

    /**
     * Build the API payload
     * Wart: date format hardcoded, should probably be config
     */
    private function buildPayload(Booking $booking): array
    {
        $slot = $booking->timeSlot;
        $user = $booking->user;

        return [
            'title' => 'Booking: ' . $user->name,
            'start' => $slot->start_time->format('Y-m-d\TH:i:s'),
            'end' => $slot->end_time->format('Y-m-d\TH:i:s'),
            'attendee_email' => $user->email,
            'metadata' => [
                'booking_id' => $booking->id,
                'source' => 'slotbooker',
            ],
        ];
    }
}
