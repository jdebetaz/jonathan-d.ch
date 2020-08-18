<?php

namespace App\Http\Controllers\Admin;

use App\Technology;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TechnologiesController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $technologies = Technology::paginate(15);
        return view('admin.technologies.index', ['technologies' => $technologies]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $technology = new Technology();
        return view('admin.technologies.create', ['technology' => $technology]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $icon = $request->file('icon');
        $data = $request->only('title', 'slug', 'content');
        if ($icon) {
            $ext = array_reverse(explode('.',$icon->getClientOriginalName()))[0];
            $name = strtolower($data['title']).'.'.$ext;
            Storage::putFileAs("icons/", $icon['icon'], $name);
            $data['icon'] = $name;
        }
        $technology = new Technology($data);
        $technology->save();
        return redirect()->route('admin.technologies.index');
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        $technology = Technology::find($id);
        return view('admin.technologies.edit', ['technology' => $technology]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $icon = $request->file('icon');
        $data = $request->only('title', 'slug', 'icon', 'content');
        if ($icon) {
            $ext = array_reverse(explode('.',$icon->getClientOriginalName()))[0];
            $name = strtolower($data['title']).'.'.$ext;
            Storage::putFileAs("icons/", $icon['icon'], $name);
            $data['icon'] = $name;
        }
        $technology = Technology::find($id);
        $technology->update($data);
        return redirect()->route('admin.technologies.index');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        Technology::find($id)->delete();
        return redirect()->route('admin.technologies.index');
    }
}
