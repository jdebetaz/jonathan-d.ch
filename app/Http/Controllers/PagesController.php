<?php

namespace App\Http\Controllers;

use App\Post;
use App\Project;

class PagesController extends Controller
{
    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function home()
    {
        $posts = Post::published()->limit(2)->get();
        $projects = Project::published()->limit(3)->get();
        return view('pages/home', [
            'title' => 'Accueil',
            'projects' => $projects,
            'posts' => $posts
        ]);
    }
}
