<?php

namespace App\Listeners;

use App\Enums\RequestStatus;
use App\Events\RequestStatusChanged;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SendStatusNotification
{
    public function handle(RequestStatusChanged $event): void
    {
        $request = $event->request;

        // Log the status change
        AuditLog::logStatusChange(
            $request,
            Auth::user(),
            $event->oldStatus->value,
            $event->newStatus->value
        );

        // Send notification based on new status
        // Wart: Notification logic not actually implemented
        match ($event->newStatus) {
            RequestStatus::PENDING => $this->notifyReviewers($request),
            RequestStatus::APPROVED => $this->notifyRequester($request, 'approved'),
            RequestStatus::REJECTED => $this->notifyRequester($request, 'rejected'),
            default => null,
        };
    }

    private function notifyReviewers($request): void
    {
        // Wart: Should get all reviewers and notify them
        // Currently just logs
        Log::info("New request pending review: {$request->id}");
    }

    private function notifyRequester($request, string $action): void
    {
        // Wart: Should send email/notification to requester
        // Currently just logs
        Log::info("Request {$request->id} was {$action}");
    }
}
