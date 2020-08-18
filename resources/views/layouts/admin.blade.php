<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimal-ui" />
    <meta name="turbolinks-cache-control" content="no-cache" />
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:500,700|Roboto:300,400&display=swap" rel="stylesheet">
    <link rel="shortcut icon" href="/images/logo.svg" type="image/png">
    <link rel="manifest" href="/manifest.webmanifest">
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link href="{{ asset('assets/app.css') }}" rel="stylesheet">
    <link href="{{ asset('assets/admin.css') }}" rel="stylesheet">
    <script src="{{ asset('assets/admin.js') }}" defer type="module"></script>
</head>
<body>
<nav class="topbar">
    <ul class="topbar-nav">
        <li class="topbar__home"><a href="{{ route('admin.home') }}" title="Accueil">Acceuil</a></li>
        <li><a href="{{ route('admin.blog.index') }}">Blog</a></li>
        <li><a href="{{ route('admin.categories.index') }}">Catégories</a></li>
        <li><a href="{{ route('admin.projects.index') }}">Projets</a></li>
        <li><a href="{{ route('admin.technologies.index') }}">Technologies</a></li>
    </ul>
    <ul class="topbar-side">
        @auth
            <li>
                <form action="{{ route('logout') }}" method="post">
                    @csrf
                    <button class="action">Se déconncter</button>
                </form>
            </li>
        @elseauth
            <li class="topbar__account"><a href="">Se connecter</a></li>
        @endauth
    </ul>
</nav>
<div class="dashboard">
    @yield('body')
</div>
</body>
</html>
