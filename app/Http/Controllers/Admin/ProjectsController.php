<?php

namespace App\Http\Controllers\Admin;

use App\Project;
use App\Transformers\TechnologyTransformer;
use App\User;
use Illuminate\Http\Request;

class ProjectsController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $projects = Project::orderBy('created_at', 'desc')->paginate(15);
        return view('admin.projects.index', ['projects' => $projects]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $users = User::all()->pluck('username', 'id');
        $project = new Project();
        $project->created_at = new \DateTime();
        return view('admin.projects.create', [
            'project' => $project,
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $data = $request->only(['title', 'slug', 'attachment_id', 'user_id', 'online', 'content', 'source', 'demo', 'created_at']);
        if(in_array('online', array_keys($data), true)) {
            $data['online'] = true;
        } else {
            $data['online'] = false;
        }
        $project = new Project($data);
        $project->save();
        $mainTech = (new TechnologyTransformer())->reverseTransform($request->get('mainTech'));
        $secondaryTech = (new TechnologyTransformer())->reverseTransform($request->get('secondaryTech'), true);
        $project->mainTechnologies()->sync($mainTech);
        $project->secondaryTechnologies()->sync($secondaryTech);
        return redirect()->route('admin.projects.index');
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Project  $project
     * @return \Illuminate\Http\Response
     */
    public function edit($project)
    {
        $users = User::all()->pluck('username', 'id');
        $project = Project::find($project);
        return view('admin.projects.edit', [
            'project' => $project,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Project  $project
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $project)
    {
        $project = Project::find($project);
        $data = $request->only(['title', 'slug', 'attachment_id', 'user_id', 'online', 'content', 'source', 'demo', 'created_at']);
        if(in_array('online', array_keys($data), true)) {
            $data['online'] = true;
        } else {
            $data['online'] = false;
        }
        $project->update($data);
        $mainTech = (new TechnologyTransformer())->reverseTransform($request->get('mainTech'));
        $secondaryTech = (new TechnologyTransformer())->reverseTransform($request->get('secondaryTech'), true);
        $project->mainTechnologies()->sync($mainTech);
        $project->secondaryTechnologies()->sync($secondaryTech);
        return redirect()->route('admin.projects.index');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Project  $project
     * @return \Illuminate\Http\Response
     */
    public function destroy($project)
    {
        Project::find($project)->delete();
        return redirect()->route('admin.projects.index');
    }
}
