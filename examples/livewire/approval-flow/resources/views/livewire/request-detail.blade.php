<div class="request-detail">
    {{-- Header --}}
    <div class="detail-header">
        <h1>{{ $request->title }}</h1>
        <span class="status-badge status-{{ $request->status->color() }}">
            {{ $request->status->label() }}
        </span>
    </div>

    {{-- Meta info --}}
    <div class="detail-meta">
        <div class="meta-item">
            <strong>Requested by:</strong>
            {{ $request->requester->name }}
        </div>
        <div class="meta-item">
            <strong>Amount:</strong>
            ${{ number_format($request->amount, 2) }}
        </div>
        <div class="meta-item">
            <strong>Submitted:</strong>
            {{ $request->submitted_at?->format('M j, Y g:i A') ?? 'Not submitted' }}
        </div>
        @if($request->reviewer)
            <div class="meta-item">
                <strong>Reviewed by:</strong>
                {{ $request->reviewer->name }}
            </div>
        @endif
    </div>

    {{-- Description --}}
    <div class="detail-description">
        <h3>Description</h3>
        <p>{{ $request->description }}</p>
    </div>

    {{-- Approval actions (separate component) --}}
    @can('review', $request)
        <livewire:approval-actions :request="$request" />
    @endcan

    {{-- Comments section (separate component) --}}
    <livewire:comment-section :request="$request" />

    {{-- Audit trail --}}
    <div class="audit-trail">
        <h3>Activity Log</h3>
        @forelse($request->auditLogs as $log)
            <div class="audit-entry">
                <span class="audit-action">{{ $log->action }}</span>
                <span class="audit-user">by {{ $log->user->name }}</span>
                <span class="audit-time">{{ $log->created_at->diffForHumans() }}</span>
                @if($log->old_value && $log->new_value)
                    <span class="audit-change">
                        {{ $log->old_value }} → {{ $log->new_value }}
                    </span>
                @endif
            </div>
        @empty
            <p class="empty-state">No activity yet.</p>
        @endforelse
    </div>
</div>
