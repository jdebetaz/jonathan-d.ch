@extends('admin.card')

@section('title')
Editer l'article
@endsection

@section('content')
    <form action="{{ route('admin.blog.update', ['blog' => $post->id]) }}" method="POST" class="stacked">
        @method('PUT')
        @include('admin/blog/_form', ['post' => $post])
    </form>
@endsection
