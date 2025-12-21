<?php

namespace App\Providers;

use App\Contracts\CalendarServiceInterface;
use App\Listeners\SyncToExternalCalendar;
use App\Services\CalendarService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class CalendarServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     * Binds the CalendarServiceInterface to CalendarService implementation
     */
    public function register(): void
    {
        $this->app->bind(
            CalendarServiceInterface::class,
            CalendarService::class
        );
    }

    /**
     * Bootstrap services.
     * Registers event subscriber for calendar sync
     *
     * Wart: mixing concerns - service binding AND event registration in same provider
     * Could argue these should be separate providers
     */
    public function boot(): void
    {
        Event::subscribe(SyncToExternalCalendar::class);
    }
}
