<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    protected $fillable = ['request_id', 'user_id', 'body', 'is_internal'];

    protected $casts = [
        'is_internal' => 'boolean',
    ];

    /**
     * The request this comment belongs to
     */
    public function request(): BelongsTo
    {
        return $this->belongsTo(Request::class);
    }

    /**
     * The user who wrote the comment
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if comment is visible to user
     * Internal comments only visible to reviewers/admins
     */
    public function isVisibleTo(User $user): bool
    {
        if (!$this->is_internal) {
            return true;
        }

        return $user->canApprove();
    }
}
