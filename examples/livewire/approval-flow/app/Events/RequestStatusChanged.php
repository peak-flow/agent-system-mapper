<?php

namespace App\Events;

use App\Enums\RequestStatus;
use App\Models\Request;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RequestStatusChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Request $request,
        public RequestStatus $oldStatus,
        public RequestStatus $newStatus,
    ) {}
}
