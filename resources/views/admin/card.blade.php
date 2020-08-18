@extends('layouts.admin')

@section('body')

<div class="stack" style="--gap:1">

    <div class="dashboard-title">
        @yield('title')
    </div>

    <div class="dashboard-card stack-large">
        @yield('content')
    </div>

</div>

@endsection
