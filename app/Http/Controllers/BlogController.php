<?php

namespace App\Http\Controllers;

use App\Category;
use App\Post;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $posts = Post::published()->paginate(12);
        return view('blog.index', [
            'title' => 'Blog',
            'posts' => $posts
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @param string $slug
     * @return \Illuminate\Http\Response
     */
    public function show(string $slug)
    {
        $post = Post::where('slug', $slug)->first();
        return view('blog.show', ['post' => $post]);
    }

    /**
     * @param string $category
     */
    public function category (string $category) {
        $category = Category::where('slug', $category)->first();
        $posts = Post::where('online', true)->orderBy('created_at', 'desc')->paginate(12);
        return view('blog.index', [
            'posts' => $posts,
            'title' => "Catégorie : {$category->title}"
        ]);
    }
}
