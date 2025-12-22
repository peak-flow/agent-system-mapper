<div class="comment-section">
    <h3>Comments</h3>

    {{-- Add comment form --}}
    <form wire:submit="addComment" class="comment-form">
        <textarea
            wire:model="newComment"
            rows="3"
            class="form-input @error('newComment') is-invalid @enderror"
            placeholder="Add a comment..."
        ></textarea>
        @error('newComment')
            <span class="error">{{ $message }}</span>
        @enderror

        <div class="comment-form-actions">
            @if($canPostInternal)
                <label class="checkbox-label">
                    <input type="checkbox" wire:model="isInternal" />
                    Internal comment (only visible to reviewers)
                </label>
            @endif

            <button type="submit" class="btn btn-primary">
                Post Comment
            </button>
        </div>
    </form>

    {{-- Comments list --}}
    <div class="comments-list">
        @forelse($comments as $comment)
            <div class="comment {{ $comment->is_internal ? 'comment-internal' : '' }}"
                 wire:key="comment-{{ $comment->id }}">
                <div class="comment-header">
                    <strong>{{ $comment->user->name }}</strong>
                    @if($comment->is_internal)
                        <span class="internal-badge">Internal</span>
                    @endif
                    <span class="comment-time">
                        {{ $comment->created_at->diffForHumans() }}
                    </span>
                </div>
                <div class="comment-body">
                    {{ $comment->body }}
                </div>
            </div>
        @empty
            <p class="empty-state">No comments yet.</p>
        @endforelse
    </div>
</div>
