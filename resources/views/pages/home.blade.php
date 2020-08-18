@extends('layouts.app')

@section('title', $title)

@section('seo')
    <meta name="description" content="" />
    <meta name="keywords" content="" />
    <meta name="author" content="Jonathan Debétaz" />
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url("home") }}">
    <meta property="og:title" content="Jonathan Debétaz">
    <meta property="og:description" content="">
    <meta property="og:image" content="">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ url("home") }}">
    <meta property="twitter:title" content="Jonathan Debétaz">
    <meta property="twitter:description" content="">
    <meta property="twitter:image" content="">
    <link rel="canonical" href="{{ url("home") }}" />
@endsection

@section('content')
    <div class="sections">
        <div class="container home-about">
            <div class="home-intro">
                <div class="home__info">
                    <h2 class="home-title">A propos</h2>
                    <h3 class="home-subtitle">
                        Jonathan Debétaz
                    </h3>
                    <p class="home-text">
                        Mon expérience technique dans le domaine est principalement due aux innombrables soirées consacrées à l'apprentissage des technologies. Avec tout ce que j'ai pu voir, je peux conclure une chose : <strong>«tout système comporte des failles, ce n’est qu’une question de temps».</strong>
                    </p>
                    <div class="hstack">
                        <a href="https://cv.jonathan-d.ch" target="_blank" class="action" title="Voir mon CV">Voir mon CV</a>
                    </div>
                </div>
                <div class="home__illustration">
                    <img src="/images/chibi.png" alt="">
                </div>
            </div>
        </div>
        <div class="home-projects container">
            <div class="home-intro">
                <div class="home__info">
                    <h2 class="home-title">Mon portfolio</h2>
                    <h3 class="home-subtitle">
                        Le travail que j'ai accompli jusqu'à présent
                    </h3>
                    <p class="home-text">
                    </p>
                    <div class="hstack">
                        <a href="{{ route('projects.index') }}" title="Voir mes projets" class="action">Voir mes projets</a>
                    </div>
                </div>
                @each('partials.home.project', $projects, 'project')
            </div>
        </div>
        <div class="home-posts container">
        <div class="home-intro">
            <div class="home__info">
                <h2 class="home-title">Mes articles</h2>
                <h3 class="home-subtitle">
                    Les dernières actualités
                </h3>
                <p class="home-text">
                </p>
                <div class="hstack">
                    <a href="{{ route('blog.index') }}" class="action" title="Voir mes articles">Voir mes articles</a>
                </div>
            </div>
            @each('partials.home.post', $posts, 'post')
        </div>
    </div>
    </div>
@endsection
