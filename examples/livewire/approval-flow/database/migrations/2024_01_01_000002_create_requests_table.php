<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requests', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->decimal('amount', 10, 2);
            $table->foreignId('requester_id')->constrained('users');
            $table->foreignId('reviewer_id')->nullable()->constrained('users');
            $table->string('status')->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index(['requester_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requests');
    }
};
