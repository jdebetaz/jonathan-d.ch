<?php

namespace App\Http\Controllers\Admin;

use App\Category;
use App\Post;
use App\User;
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
        $posts = Post::orderBy('created_at', 'desc')->paginate(15);
        return view('admin.blog.index', ['posts' => $posts]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $categories = Category::all()->pluck('title', 'id');
        $users = User::all()->pluck('username', 'id');
        $post = new Post();
        $post->created_at = new \DateTime();
        return view('admin.blog.create', [
            'post' => $post,
            'categories' => $categories,
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
        $data = $request->only(['title', 'slug', 'user_id', 'category_id', 'attachment_id', 'online', 'content', 'created_at']);

        if(in_array('online', array_keys($data), true)) {
            $data['online'] = true;
        } else {
            $data['online'] = false;
        }
        $post = new Post();
        $post->title = $data['title'];
        $post->slug = $data['slug'];
        $post->user_id = $data['user_id'];
        $post->category_id = $data['category_id'];
        $post->attachment_id = $data['attachment_id'];
        $post->online = $data['online'];
        $post->content = $data['content'];
        $post->created_at = $data['created_at'];
        $post->save();
        return redirect()->route('admin.blog.index');
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Post  $post
     * @return \Illuminate\Http\Response
     */
    public function edit($post)
    {
        $categories = Category::all()->pluck('title', 'id');
        $users = User::all()->pluck('username', 'id');
        $post = Post::find($post);
        return view('admin.blog.edit', [
            'post' => $post,
            'categories' => $categories,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Post  $post
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $post)
    {
        $data = $request->only(['title', 'slug', 'user_id', 'category_id', 'attachment_id', 'online', 'content', 'created_at']);
        if(in_array('online', array_keys($data), true)) {
            $data['online'] = true;
        } else {
            $data['online'] = false;
        }
        Post::find($post)->update($data);
        return redirect()->route('admin.blog.index');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Post  $post
     * @return \Illuminate\Http\Response
     */
    public function destroy($post)
    {
        Post::find($post)->delete();
        return redirect()->route('admin.blog.index');
    }
}
