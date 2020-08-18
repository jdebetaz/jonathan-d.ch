@extends('admin.card')

@section('title')
Editer une technologie
@endsection

@section('content')
    <form action="{{ route('admin.technologies.update', ['technology' => $technology->id]) }}" method="post" class="stacked" enctype="multipart/form-data">
        @method('PUT')
        @include('admin.technologies._form', ['technology' => $technology])
    </form>
@endsection
