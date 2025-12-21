<?php

namespace App\Enums;

enum UserRole: string
{
    case REQUESTER = 'requester';
    case REVIEWER = 'reviewer';
    case ADMIN = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::REQUESTER => 'Requester',
            self::REVIEWER => 'Reviewer',
            self::ADMIN => 'Administrator',
        };
    }

    /**
     * Check if role can approve requests
     */
    public function canApprove(): bool
    {
        return in_array($this, [self::REVIEWER, self::ADMIN]);
    }

    /**
     * Check if role can view all requests
     */
    public function canViewAll(): bool
    {
        return in_array($this, [self::REVIEWER, self::ADMIN]);
    }
}
