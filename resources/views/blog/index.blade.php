@extends('layouts.app')

@section('title', $title)

@section('seo')
<meta name="description" content="" />
<meta name="keywords" content="" />
<meta name="author" content="Jonathan Debétaz" />
<meta property="og:type" content="website">
<meta property="og:url" content="{{ url("blog.index") }}">
<meta property="og:title" content="{{ $title }} | Jonathan Debétaz">
<meta property="og:description" content="">
<meta property="og:image" content="">
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="{{ url("blog.index") }}">
<meta property="twitter:title" content="{{ $title }} | Jonathan Debétaz">
<meta property="twitter:description" content="">
<meta property="twitter:image" content="">
<link rel="canonical" href="{{ url("blog.index")}}" />
@endsection

@section('content')
<h2 class="reader-only">{{ $title }}</h2>
<div class="blog-posts">
    @each('partials.post', $posts, 'post')
</div>
{{ $posts->links() }}
@endsection
