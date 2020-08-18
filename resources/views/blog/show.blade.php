@extends('layouts.app')

@section('title', $post->title)

@section('seo')
    <meta name="description" content="{{ $post->content }}" />
    <meta name="keywords" content="" />
    <meta name="author" content="Jonathan Debétaz" />
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url("blog.show", [ 'blog' => $post->slug ]) }}">
    <meta property="og:title" content="{{ $post->title }} | Jonathan Debétaz">
    <meta property="og:description" content="{{ $post->content }}">
    <meta property="og:image" content="">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ url("blog.show", [ 'blog' => $post->slug ]) }}">
    <meta property="twitter:title" content="{{ $post->title }} | Jonathan Debétaz">
    <meta property="twitter:description" content="{{ $post->content }}">
    <meta property="twitter:image" content="">
    <link rel="canonical" href="{{ url("blog.show", [ 'blog' => $post->slug ]) }}" />
@endsection

@section('content')
    <div class="blog-single">
        <div class="blog-single__thumb">
            <img src="{{ $post->attachment->url }}" alt="{{ $post->title }}" title="{{ $post->title }}">
        </div>
        <div class="blog-single__header">
            <h1 class="blog-single__title">{{ $post->title }}</h1>
            <div class="blog-single__meta">
                Posté le {{ $post->created_at->format("d F Y") }} -
                <a href="{{ route('blog.category', ['category' => $post->category->slug]) }}">{{ $post->category->title }}</a> -
                Par {{ $post->user->username }}
            </div>
        </div>

        <div class="blog-single__body formatted text-only">
            {!! $post->marked !!}
        </div>
    </div>
@endsection
