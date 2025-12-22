<div class="approval-actions">
    @if($canReview)
        <div class="action-buttons">
            @if(!$isReviewing)
                <button wire:click="startReview" class="btn btn-info">
                    Start Review
                </button>
            @else
                <button wire:click="approve" class="btn btn-success">
                    Approve
                </button>
                <button wire:click="openRejectModal" class="btn btn-danger">
                    Reject
                </button>
            @endif
        </div>
    @endif

    {{-- Reject confirmation modal --}}
    @if($showRejectModal)
        <div class="modal-overlay" wire:click.self="closeRejectModal">
            <div class="modal">
                <h3>Reject Request</h3>
                <p>Please provide a reason for rejection:</p>

                <textarea
                    wire:model="rejectionReason"
                    rows="3"
                    class="form-input"
                    placeholder="Rejection reason (optional)"
                ></textarea>

                <div class="modal-actions">
                    <button wire:click="closeRejectModal" class="btn btn-secondary">
                        Cancel
                    </button>
                    <button wire:click="reject" class="btn btn-danger">
                        Confirm Rejection
                    </button>
                </div>
            </div>
        </div>
    @endif
</div>
