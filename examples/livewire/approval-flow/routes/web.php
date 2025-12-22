<?php

use App\Livewire\RequestDetail;
use App\Livewire\RequestForm;
use App\Livewire\RequestList;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Approval Flow Routes
|--------------------------------------------------------------------------
|
| Routes for the approval workflow system.
| All routes require authentication (middleware applied in RouteServiceProvider).
|
*/

// Dashboard / List
Route::get('/', RequestList::class)->name('requests.index');

// Create new request
Route::get('/requests/create', RequestForm::class)->name('requests.create');

// View request detail
Route::get('/requests/{request}', RequestDetail::class)->name('requests.show');

// Edit request (uses same form component)
Route::get('/requests/{request}/edit', RequestForm::class)->name('requests.edit');
