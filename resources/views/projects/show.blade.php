@extends('layouts.app')
@section('title', $project->title)

@section('seo')
<meta name="description" content="{{ $project->content }}" />
<meta name="keywords" content="" />
<meta name="author" content="Jonathan Debétaz" />
<meta property="og:type" content="website">
<meta property="og:url" content="{{ url('projects.show', ['project' => "{$project->slug}-{$project->id}"]) }}">
<meta property="og:title" content="{{ $project->title }} | Jonathan Debétaz">
<meta property="og:description" content="{{ $project->content }}">
<meta property="og:image" content="{{ $project->attachment->url }}">
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="{{ url('projects.show', ['project' => "{$project->slug}-{$project->id}"]) }}">
<meta property="twitter:title" content="{{ $project->title }} | Jonathan Debétaz">
<meta property="twitter:description" content="{{ $project->content }}">
<meta property="twitter:image" content="{{ $project->attachment->url }}">
<link rel="canonical" href="{{ url('projects.show', ['project' => "{$project->slug}-{$project->id}"]) }}" />
@endsection

@section('content')
<div class="layout-sidebar">
    <div class="stack">
        <img src="{{ $project->attachment->url }}" alt="{{ $project->title }}" title="{{ $project->title }}">
        <div class="formatted">
            <h1>{{ $project->title }}</h1>
            {{ $project->content }}
        </div>
    </div>
    <div>
        <div class="stack-large project-sticky">
            <div>
                <div class="requirements__title">Technologies utilisées</div>
                <div class="list">
                    @foreach($project->mainTechnologies as $technology)
                        <a class="flex" href="{{ route('projects.technology', ['technology' => $technology->slug]) }}">
                            <img src="{{ $technology->iconUrl }}" alt="{{ $technology->title }}" title="{{ $technology->title }}">
                            {{ $technology->title }}
                        </a>
                    @endforeach
                    @foreach($project->secondaryTechnologies as $technology)
                        <a class="flex" href="{{ route('projects.technology', ['technology' => $technology->slug]) }}">
                            <img src="{{ $technology->iconUrl }}" alt="{{ $technology->title }}" title="{{ $technology->title }}">
                            {{ $technology->title }}
                        </a>
                    @endforeach
                </div>
            </div>
            <div>
                <div class="requirements__title">Partage social</div>
            </div>
        </div>
    </div>
</div>
@endsection

