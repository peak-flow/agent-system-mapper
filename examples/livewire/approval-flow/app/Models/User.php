<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    protected $fillable = ['name', 'email', 'role'];

    protected $casts = [
        'role' => UserRole::class,
    ];

    /**
     * Requests submitted by this user
     */
    public function requests(): HasMany
    {
        return $this->hasMany(Request::class, 'requester_id');
    }

    /**
     * Requests assigned to this user for review
     */
    public function assignedRequests(): HasMany
    {
        return $this->hasMany(Request::class, 'reviewer_id');
    }

    /**
     * Comments made by this user
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Check if user can approve requests
     */
    public function canApprove(): bool
    {
        return $this->role->canApprove();
    }

    /**
     * Check if user can view all requests (not just their own)
     */
    public function canViewAll(): bool
    {
        return $this->role->canViewAll();
    }
}
