@extends('layouts.app')

@section('title', $title)

@section('seo')
<meta name="description" content="" />
<meta name="keywords" content="" />
<meta name="author" content="Jonathan Debétaz" />
<meta property="og:type" content="website">
<meta property="og:url" content="{{ url("project_index") }}">
<meta property="og:title" content="{{ $title }} | Jonathan Debétaz">
<meta property="og:description" content="">
<meta property="og:image" content="">
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="{{ url("project_index") }}">
<meta property="twitter:title" content="{{ $title }} | Jonathan Debétaz">
<meta property="twitter:description" content="">
<meta property="twitter:image" content="">
<link rel="canonical" href="{{ url("project_index") }}" />
@endsection

@section('content')
<div class="projects">
    <div class="project-hero {{ ($page > 1) ? 'is-paginated' : '' }}">
        <h2>
            Tous les projets
            @if($page > 1)
                <small><br>page {{ $page }}</small>
            @endif
        </h2>
        <p>
            Envie de découvrir mon travail au travers de mes divers projets ?<br>
            Alors vous êtes sur le bon chemin...
        </p>
    </div>
    @each('partials.project', $projects, 'project')
</div>

{{ $projects->links() }}
@endsection
