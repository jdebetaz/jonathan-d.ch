@extends('admin.card')

@section('title')
    Créer une technologie
@endsection
@section('content')
    <form action="{{ route('admin.technologies.store') }}" method="post" class="stacked" enctype="multipart/form-data">
        @include('admin.technologies._form', ['technology' => $technology])
    </form>
@endsection
