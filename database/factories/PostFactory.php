<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Post;
use Faker\Generator as Faker;
use Illuminate\Support\Str;

/*
|--------------------------------------------------------------------------
| Model Factories
|--------------------------------------------------------------------------
|
| This directory should contain each of the model factory definitions for
| your application. Factories provide a convenient way to generate new
| model instances for testing / seeding your application's database.
|
*/

$factory->define(Post::class, function (Faker $faker) {
    return [
        'title' => $faker->name,
        'slug' => Str::slug($faker->name),
        'content' => $faker->text,
        'user_id' => 1,
        'attachment_id' => 1,
        'online' => (random_int(0,1) == true),
        'category_id' => 1
    ];
});
