<?php

return [
    /*
    |--------------------------------------------------------------------------
    | External Calendar API Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for connecting to the external calendar service.
    | The API is used to sync bookings so they appear in external calendars.
    |
    */

    'api_url' => env('CALENDAR_API_URL', 'https://api.example-calendar.com/v1'),
    'api_key' => env('CALENDAR_API_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Sync Settings
    |--------------------------------------------------------------------------
    |
    | Wart: these settings exist but aren't actually used anywhere yet.
    | The service has hardcoded retry logic.
    |
    */

    'sync_timeout' => env('CALENDAR_SYNC_TIMEOUT', 30),
    'retry_attempts' => env('CALENDAR_RETRY_ATTEMPTS', 3),

    /*
    |--------------------------------------------------------------------------
    | Booking Rules
    |--------------------------------------------------------------------------
    |
    | Note: cancel_hours_before is defined here but the actual check
    | is hardcoded in Booking::canCancel() and booking.js
    | TODO: These should read from this config
    |
    */

    'cancel_hours_before' => 24,
    'max_bookings_per_user' => 5,  // Not enforced anywhere yet
];
