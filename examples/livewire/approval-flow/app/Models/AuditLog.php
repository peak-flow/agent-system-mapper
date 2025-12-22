<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = [
        'request_id',
        'user_id',
        'action',
        'old_value',
        'new_value',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    // Wart: Audit log table updated is false, so we only track created_at
    public $timestamps = false;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->created_at = now();
        });
    }

    /**
     * The request this log belongs to
     */
    public function request(): BelongsTo
    {
        return $this->belongsTo(Request::class);
    }

    /**
     * The user who performed the action
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create a status change log entry
     */
    public static function logStatusChange(
        Request $request,
        User $user,
        string $oldStatus,
        string $newStatus
    ): self {
        return self::create([
            'request_id' => $request->id,
            'user_id' => $user->id,
            'action' => 'status_changed',
            'old_value' => $oldStatus,
            'new_value' => $newStatus,
        ]);
    }
}
