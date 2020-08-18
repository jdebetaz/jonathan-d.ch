<?php

use App\Http\Middleware\AdminMiddleware;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Auth::routes(['register' => env('APP_REGISTER', false)]);
Route::get('/', 'PagesController@home')->name('home');

Route::resource('blog', 'BlogController')->only(['index', 'show']);
Route::get('/category/{category}', 'BlogController@category')->name('blog.category');

Route::resource('projects', 'ProjectController')->only(['index', 'show']);
Route::get('/technology/{technology}', 'ProjectController@technology')->name('projects.technology');

Route::middleware(['auth', AdminMiddleware::class])->namespace('Admin')->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', 'PagesController@home')->name('home');
    Route::resource('blog', 'BlogController')->except(['show']);
    Route::resource('categories', 'CategoriesController')->except(['show']);
    Route::resource('projects', 'ProjectsController')->except(['show']);
    Route::resource('technologies', 'TechnologiesController')->except(['show']);
    Route::get('attachment/folders', 'AttachmentController@folders')->name('attachment.folders');
    Route::get('attachment/files', 'AttachmentController@files')->name('attachment.files');
    Route::post('attachment', 'AttachmentController@store');
});
