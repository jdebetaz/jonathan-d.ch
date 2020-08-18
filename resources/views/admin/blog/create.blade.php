@extends('admin.card')

@section('title')
    Créer l'article
@endsection
@section('content')
    <form action="{{ route('admin.blog.store') }}" method="POST" class="stacked">
        @include('admin/blog/_form', ['post' => $post])
    </form>
@endsection
