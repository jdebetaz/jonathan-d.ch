@extends('admin.card')

@section('title')
Editer une technologie
@endsection

@section('content')
    <form action="{{ route('admin.categories.update', ['category' => $category->id]) }}" method="post" class="stacked">
        @method('PUT')
        @include('admin.categories._form', ['category' => $category])
    </form>
@endsection
