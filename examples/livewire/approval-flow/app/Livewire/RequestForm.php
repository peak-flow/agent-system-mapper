<?php

namespace App\Livewire;

use App\Enums\RequestStatus;
use App\Models\Request;
use Illuminate\Support\Facades\Auth;
use Livewire\Component;

class RequestForm extends Component
{
    public ?Request $request = null;

    public string $title = '';
    public string $description = '';
    public string $amount = '';

    protected $rules = [
        'title' => 'required|min:5|max:255',
        'description' => 'required|min:10',
        'amount' => 'required|numeric|min:0',
    ];

    public function mount(?int $requestId = null)
    {
        if ($requestId) {
            $this->request = Request::findOrFail($requestId);
            $this->title = $this->request->title;
            $this->description = $this->request->description;
            $this->amount = (string) $this->request->amount;
        }
    }

    public function save()
    {
        $this->validate();

        if ($this->request) {
            // Update existing
            // Wart: Duplicates editable check from model
            if (!$this->request->status->isEditable()) {
                session()->flash('error', 'Cannot edit this request');
                return;
            }

            $this->request->update([
                'title' => $this->title,
                'description' => $this->description,
                'amount' => $this->amount,
            ]);

            session()->flash('message', 'Request updated successfully');
        } else {
            // Create new
            $this->request = Request::create([
                'title' => $this->title,
                'description' => $this->description,
                'amount' => $this->amount,
                'requester_id' => Auth::id(),
                'status' => RequestStatus::DRAFT,
            ]);

            session()->flash('message', 'Request created as draft');
        }

        $this->dispatch('requestUpdated');

        return redirect()->route('requests.show', $this->request);
    }

    public function submit()
    {
        if (!$this->request) {
            $this->save();
        }

        // Wart: Duplicates submit logic from model
        if (!$this->request->status->isEditable()) {
            session()->flash('error', 'Cannot submit this request');
            return;
        }

        $this->request->submit();

        session()->flash('message', 'Request submitted for review');

        return redirect()->route('requests.show', $this->request);
    }

    public function render()
    {
        return view('livewire.request-form');
    }
}
