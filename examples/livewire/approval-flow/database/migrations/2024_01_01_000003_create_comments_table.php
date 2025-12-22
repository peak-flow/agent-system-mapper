<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained();
            $table->text('body');
            $table->boolean('is_internal')->default(false);
            $table->timestamps();

            $table->index(['request_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
