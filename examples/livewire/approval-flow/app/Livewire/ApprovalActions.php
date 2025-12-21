<?php

namespace App\Livewire;

use App\Models\Request;
use Illuminate\Support\Facades\Auth;
use Livewire\Component;

class ApprovalActions extends Component
{
    public Request $request;
    public string $rejectionReason = '';
    public bool $showRejectModal = false;

    public function mount(Request $request)
    {
        $this->request = $request;
    }

    public function startReview()
    {
        $user = Auth::user();

        if (!$user->canApprove()) {
            session()->flash('error', 'You do not have permission to review');
            return;
        }

        $this->request->update([
            'status' => \App\Enums\RequestStatus::UNDER_REVIEW,
            'reviewer_id' => $user->id,
        ]);

        $this->dispatch('requestUpdated');
    }

    public function approve()
    {
        $user = Auth::user();

        if (!$user->canApprove()) {
            session()->flash('error', 'You do not have permission to approve');
            return;
        }

        if (!$this->request->canReview()) {
            session()->flash('error', 'Request cannot be approved in current status');
            return;
        }

        $this->request->approve($user);

        session()->flash('message', 'Request approved successfully');
        $this->dispatch('requestUpdated');
    }

    public function openRejectModal()
    {
        $this->showRejectModal = true;
    }

    public function closeRejectModal()
    {
        $this->showRejectModal = false;
        $this->rejectionReason = '';
    }

    public function reject()
    {
        $user = Auth::user();

        if (!$user->canApprove()) {
            session()->flash('error', 'You do not have permission to reject');
            return;
        }

        // Wart: Rejection reason not actually saved anywhere
        // Should create a comment with the reason

        $this->request->reject($user);

        $this->showRejectModal = false;
        session()->flash('message', 'Request rejected');
        $this->dispatch('requestUpdated');
    }

    public function render()
    {
        $user = Auth::user();

        return view('livewire.approval-actions', [
            'canReview' => $user->canApprove() && $this->request->canReview(),
            'isReviewing' => $this->request->reviewer_id === $user->id,
        ]);
    }
}
