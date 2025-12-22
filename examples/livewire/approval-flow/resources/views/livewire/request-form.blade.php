<div class="request-form">
    <form wire:submit="save">
        <div class="form-group">
            <label for="title">Title</label>
            <input
                type="text"
                id="title"
                wire:model="title"
                class="form-input @error('title') is-invalid @enderror"
            />
            @error('title')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label for="description">Description</label>
            <textarea
                id="description"
                wire:model="description"
                rows="4"
                class="form-input @error('description') is-invalid @enderror"
            ></textarea>
            @error('description')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label for="amount">Amount ($)</label>
            <input
                type="number"
                id="amount"
                wire:model="amount"
                step="0.01"
                min="0"
                class="form-input @error('amount') is-invalid @enderror"
            />
            @error('amount')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-actions">
            <button type="submit" class="btn btn-secondary">
                Save as Draft
            </button>

            @if($request && $request->canEdit())
                <button type="button" wire:click="submit" class="btn btn-primary">
                    Submit for Review
                </button>
            @endif
        </div>
    </form>
</div>
