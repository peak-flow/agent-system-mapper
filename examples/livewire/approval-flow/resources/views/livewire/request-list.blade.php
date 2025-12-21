<div>
    {{-- Filters --}}
    <div class="filters mb-4">
        <input
            type="text"
            wire:model.live.debounce.300ms="search"
            placeholder="Search requests..."
            class="search-input"
        />

        <select wire:model.live="statusFilter" class="status-filter">
            <option value="">All Statuses</option>
            @foreach($statuses as $status)
                <option value="{{ $status->value }}">{{ $status->label() }}</option>
            @endforeach
        </select>
    </div>

    {{-- Request list --}}
    <div class="request-list">
        @forelse($requests as $request)
            <div class="request-card" wire:key="request-{{ $request->id }}">
                <div class="request-header">
                    <a href="{{ route('requests.show', $request) }}" class="request-title">
                        {{ $request->title }}
                    </a>
                    <span class="status-badge status-{{ $request->status->color() }}">
                        {{ $request->status->label() }}
                    </span>
                </div>

                <div class="request-meta">
                    <span>By: {{ $request->requester->name }}</span>
                    <span>Amount: ${{ number_format($request->amount, 2) }}</span>
                    <span>{{ $request->created_at->diffForHumans() }}</span>
                </div>
            </div>
        @empty
            <p class="empty-state">No requests found.</p>
        @endforelse
    </div>

    {{-- Pagination --}}
    {{ $requests->links() }}
</div>
