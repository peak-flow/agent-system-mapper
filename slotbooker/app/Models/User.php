<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $fillable = ['name', 'email', 'phone'];

    /**
     * Get all bookings for this user
     */
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Get active bookings only
     * TODO: should probably be a scope instead
     */
    public function activeBookings()
    {
        return $this->bookings()->where('status', 'confirmed');
    }
}
