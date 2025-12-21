<?php

namespace App\Livewire;

use App\Enums\RequestStatus;
use App\Models\Request;
use Illuminate\Support\Facades\Auth;
use Livewire\Component;
use Livewire\WithPagination;

class RequestList extends Component
{
    use WithPagination;

    public string $statusFilter = '';
    public string $search = '';

    protected $queryString = ['statusFilter', 'search'];

    // Listen for events from other components
    protected $listeners = ['requestUpdated' => '$refresh'];

    public function updatingSearch()
    {
        $this->resetPage();
    }

    public function updatingStatusFilter()
    {
        $this->resetPage();
    }

    public function render()
    {
        $user = Auth::user();

        $query = Request::with(['requester', 'reviewer']);

        // Role-based filtering
        // Wart: This logic duplicated in RequestPolicy
        if (!$user->canViewAll()) {
            $query->where('requester_id', $user->id);
        }

        // Status filter
        if ($this->statusFilter) {
            $query->where('status', $this->statusFilter);
        }

        // Search
        if ($this->search) {
            $query->where(function ($q) {
                $q->where('title', 'like', "%{$this->search}%")
                    ->orWhere('description', 'like', "%{$this->search}%");
            });
        }

        $requests = $query->orderBy('created_at', 'desc')->paginate(10);

        return view('livewire.request-list', [
            'requests' => $requests,
            'statuses' => RequestStatus::cases(),
        ]);
    }
}
