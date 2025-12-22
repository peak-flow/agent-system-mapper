<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained();
            $table->string('action');
            $table->string('old_value')->nullable();
            $table->string('new_value')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at');

            $table->index(['request_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
