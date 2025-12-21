<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeSlot extends Model
{
    protected $fillable = [
        'start_time',
        'end_time',
        'capacity',
        'is_available',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_available' => 'boolean',
    ];

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Check if slot has availability
     * Wart: capacity logic is duplicated in BookingController@store
     */
    public function hasAvailability()
    {
        if (!$this->is_available) {
            return false;
        }

        $confirmedCount = $this->bookings()
            ->where('status', 'confirmed')
            ->count();

        return $confirmedCount < $this->capacity;
    }

    /**
     * Get remaining spots
     */
    public function spotsLeft()
    {
        $taken = $this->bookings()->where('status', 'confirmed')->count();
        return max(0, $this->capacity - $taken);
    }

    /**
     * Scope for available future slots
     */
    public function scopeAvailableFuture($query)
    {
        return $query
            ->where('is_available', true)
            ->where('start_time', '>', now());
    }
}
