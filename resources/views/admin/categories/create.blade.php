@extends('admin.card')

@section('title')
    Créer une catégorie
@endsection
@section('content')
    <form action="{{ route('admin.categories.store') }}" method="post" class="stacked">
        @include('admin.categories._form', ['category' => $category])
    </form>
@endsection
