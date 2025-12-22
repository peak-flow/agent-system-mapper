<?php

namespace App\Models;

use App\Enums\RequestStatus;
use App\Events\RequestStatusChanged;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Request extends Model
{
    protected $fillable = [
        'title',
        'description',
        'amount',
        'requester_id',
        'reviewer_id',
        'status',
        'submitted_at',
        'reviewed_at',
    ];

    protected $casts = [
        'status' => RequestStatus::class,
        'amount' => 'decimal:2',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    /**
     * User who created the request
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    /**
     * User assigned to review
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * Comments on this request
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->orderBy('created_at', 'desc');
    }

    /**
     * Audit log entries
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class)->orderBy('created_at', 'desc');
    }

    /**
     * Submit request for review
     */
    public function submit(): void
    {
        // Wart: Business rule check duplicated in Livewire component
        if (!$this->status->isEditable()) {
            throw new \Exception('Request cannot be submitted in current status');
        }

        $oldStatus = $this->status;
        $this->status = RequestStatus::PENDING;
        $this->submitted_at = now();
        $this->save();

        event(new RequestStatusChanged($this, $oldStatus, $this->status));
    }

    /**
     * Approve the request
     */
    public function approve(User $reviewer): void
    {
        $oldStatus = $this->status;
        $this->status = RequestStatus::APPROVED;
        $this->reviewer_id = $reviewer->id;
        $this->reviewed_at = now();
        $this->save();

        event(new RequestStatusChanged($this, $oldStatus, $this->status));
    }

    /**
     * Reject the request
     */
    public function reject(User $reviewer): void
    {
        $oldStatus = $this->status;
        $this->status = RequestStatus::REJECTED;
        $this->reviewer_id = $reviewer->id;
        $this->reviewed_at = now();
        $this->save();

        event(new RequestStatusChanged($this, $oldStatus, $this->status));
    }

    /**
     * Check if request can be edited
     */
    public function canEdit(): bool
    {
        return $this->status->isEditable();
    }

    /**
     * Check if request can be approved/rejected
     */
    public function canReview(): bool
    {
        return $this->status === RequestStatus::PENDING
            || $this->status === RequestStatus::UNDER_REVIEW;
    }
}
