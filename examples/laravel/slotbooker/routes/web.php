<?php

use App\Http\Controllers\BookingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Booking Routes
|--------------------------------------------------------------------------
|
| All routes require authentication (middleware applied in RouteServiceProvider)
| Wart: auth middleware not actually shown here, assumed to be global
|
*/

// Main booking page - shows slots and user's bookings
Route::get('/booking', [BookingController::class, 'index'])
    ->name('booking.index');

// Create new booking
Route::post('/booking', [BookingController::class, 'store'])
    ->name('booking.store');

// Cancel existing booking
Route::post('/booking/{booking}/cancel', [BookingController::class, 'cancel'])
    ->name('booking.cancel');

// API endpoint for JS availability check
Route::get('/api/slots/availability', [BookingController::class, 'checkAvailability'])
    ->name('api.slots.availability');
