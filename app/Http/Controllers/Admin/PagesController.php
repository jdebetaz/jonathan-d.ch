<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;

class PagesController extends Controller
{
    /**
     *
     * @return \Illuminate\Http\Response
     */
    public function home()
    {
        return view('admin.pages.home');
    }

}
