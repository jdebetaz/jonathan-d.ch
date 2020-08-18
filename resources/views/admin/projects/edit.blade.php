@extends('admin.card')

@section('title')
Editer un projet
@endsection

@section('content')
    <form action="{{ route('admin.projects.update', ['project' => $project->id]) }}" method="post" class="stacked">
        @method('PUT')
        @include('admin.projects._form', ['project' => $project])
    </form>
@endsection
