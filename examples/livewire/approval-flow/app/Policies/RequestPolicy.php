<?php

namespace App\Policies;

use App\Models\Request;
use App\Models\User;

class RequestPolicy
{
    /**
     * Can user view the request?
     */
    public function view(User $user, Request $request): bool
    {
        // Owner can always view their own requests
        if ($request->requester_id === $user->id) {
            return true;
        }

        // Reviewers/admins can view all
        // Wart: Logic duplicated in RequestList component
        return $user->canViewAll();
    }

    /**
     * Can user edit the request?
     */
    public function update(User $user, Request $request): bool
    {
        // Only owner can edit, and only if editable status
        return $request->requester_id === $user->id
            && $request->canEdit();
    }

    /**
     * Can user delete the request?
     */
    public function delete(User $user, Request $request): bool
    {
        // Only owner can delete drafts
        return $request->requester_id === $user->id
            && $request->status === \App\Enums\RequestStatus::DRAFT;
    }

    /**
     * Can user approve/reject the request?
     */
    public function review(User $user, Request $request): bool
    {
        return $user->canApprove() && $request->canReview();
    }
}
