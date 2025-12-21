<?php

namespace App\Livewire;

use App\Models\Request;
use Livewire\Component;

class RequestDetail extends Component
{
    public Request $request;

    protected $listeners = [
        'requestUpdated' => '$refresh',
        'commentAdded' => '$refresh',
    ];

    public function mount(Request $request)
    {
        $this->request = $request->load(['requester', 'reviewer', 'auditLogs.user']);
    }

    public function render()
    {
        return view('livewire.request-detail');
    }
}
