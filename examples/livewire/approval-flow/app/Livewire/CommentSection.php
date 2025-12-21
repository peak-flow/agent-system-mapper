<?php

namespace App\Livewire;

use App\Models\Comment;
use App\Models\Request;
use Illuminate\Support\Facades\Auth;
use Livewire\Component;

class CommentSection extends Component
{
    public Request $request;
    public string $newComment = '';
    public bool $isInternal = false;

    protected $rules = [
        'newComment' => 'required|min:2|max:1000',
    ];

    public function mount(Request $request)
    {
        $this->request = $request;
    }

    public function addComment()
    {
        $this->validate();

        $user = Auth::user();

        // Only reviewers can post internal comments
        if ($this->isInternal && !$user->canApprove()) {
            $this->isInternal = false;
        }

        Comment::create([
            'request_id' => $this->request->id,
            'user_id' => $user->id,
            'body' => $this->newComment,
            'is_internal' => $this->isInternal,
        ]);

        $this->newComment = '';
        $this->isInternal = false;

        $this->dispatch('commentAdded');

        // Wart: Should also log to audit trail
    }

    public function render()
    {
        $user = Auth::user();

        // Filter comments based on visibility
        $comments = $this->request->comments()
            ->with('user')
            ->get()
            ->filter(fn ($comment) => $comment->isVisibleTo($user));

        return view('livewire.comment-section', [
            'comments' => $comments,
            'canPostInternal' => $user->canApprove(),
        ]);
    }
}
