<?php

namespace App\Http\Controllers;

use App\Project;
use App\Technology;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $page = $request->query->getInt('page', 1);
        $projects = Project::where('online', true)->orderBy('created_at', 'desc')->paginate(14);
        return view('projects.index', [
            'page' => $page,
            'title' => 'Tous les projets'.(($page > 1) ? (', page '.$page) : ''),
            'projects' => $projects
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @param string $slug
     * @return void
     */
    public function show(string $slug)
    {
        $slug = array_reverse(explode('-', $slug));
        $project = Project::find($slug[0]);
        return view('projects.show', [
            'project' => $project
        ]);
    }

    public function technology(Request $request, $technology) {
        $page = $request->query->getInt('page', 1);
        $technology = Technology::where('slug', $technology)->first();
        $projects = $technology->projects()->published()->distinct()->paginate(14);
        return view('projects.technology', [
            'page' => $page,
            'title' => 'Technologie : '.$technology->title.''.(($page > 1) ? (', page '.$page) : ''),
            'technology' => $technology,
            'projects' => $projects
        ]);
    }
}
