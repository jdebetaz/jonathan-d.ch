@extends('layouts.app')

@section('title', $title)

@section('seo')
    <meta name="description" content="{{ $technology->marked }}" />
    <meta name="keywords" content="" />
    <meta name="author" content="Jonathan Debétaz" />
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url('projects.technology', ['technology' => $technology->slug]) }}">
    <meta property="og:title" content="{{ $title }} | Jonathan Debétaz">
    <meta property="og:description" content="{{ $technology->marked }}">
    <meta property="og:image" content="{{ $technology->iconUrl }}">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ url('projects.technology', ['technology' => $technology->slug]) }}">
    <meta property="twitter:title" content="{{ $title }} | Jonathan Debétaz">
    <meta property="twitter:description" content="{{ $technology->marked }}">
    <meta property="twitter:image" content="{{ $technology->iconUrl }}">
    <link rel="canonical" href="{{ url('projects.technology', ['technology' => $technology->slug]) }}" />
@endsection

@section('content')
<header class="hero-header">
    <div class="hero-header__body stack">
        <h1 class="hero-header__title">{{ $technology->title }}</h1>
        <p>{!! $technology->marked !!}</p>
    </div>
    <div class="hero-header__image">
        <img src="{{ $technology->iconUrl }}" alt="">
    </div>
</header>
<div class="container stack" style="--gap:10">
    <section class="stack">
        <h2 class="h3"><strong>Pratiquer</strong> à travers des exemples concrets</h2>
        <div class="projects">
            @each('partials.project', $projects, 'project')
        </div>
        {{ $projects->links() }}
    </section>

</div>




@endsection

