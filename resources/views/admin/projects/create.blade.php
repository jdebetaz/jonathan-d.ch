@extends('admin.card')

@section('title')
    Créer un projet
@endsection
@section('content')
    <form action="{{ route('admin.projects.store') }}" method="post" class="stacked">
        @include('admin.projects._form', ['project' => $project])
    </form>
@endsection
