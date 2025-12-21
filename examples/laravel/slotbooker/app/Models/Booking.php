<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'user_id',
        'time_slot_id',
        'status',
        'notes',
        'external_calendar_id',  // stored after sync
    ];

    // Status constants - but we also use strings directly in some places...
    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_CANCELLED = 'cancelled';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function timeSlot()
    {
        return $this->belongsTo(TimeSlot::class);
    }

    /**
     * Check if booking can be cancelled
     * Note: 24 hour rule is hardcoded here AND in the JS
     */
    public function canCancel()
    {
        if ($this->status === 'cancelled') {
            return false;
        }

        // Must cancel 24 hours before
        $slotTime = $this->timeSlot->start_time;
        $hoursUntil = now()->diffInHours($slotTime, false);

        return $hoursUntil >= 24;
    }

    /**
     * Mark as synced with external calendar
     */
    public function markSynced($externalId)
    {
        $this->external_calendar_id = $externalId;
        $this->save();
    }
}
