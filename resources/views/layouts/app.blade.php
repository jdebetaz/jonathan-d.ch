<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="shortcut icon" href="/images/logo.svg" type="image/png">
    <link rel="manifest" href="/manifest.webmanifest">
    <title>@yield('title') | Jonathan Debétaz</title>
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:500,700|Roboto:300,400&display=swap" rel="stylesheet">
    <link href="{{ asset('assets/app.css') }}" rel="stylesheet">
    @yield('css')
    <script src="{{ asset('assets/app.js') }}" defer></script>
    @yield('seo')
</head>
<body>
    <div id="app">
        <nav class="topbar">
            <ul class="topbar-nav">
                <li class="topbar__logo">
                    <a href="{{ route('home') }}" title="Accueil">
                        <img src="/images/logo.svg" alt="">
                    </a>
                </li>
                <li><a href="{{ route('blog.index') }}" title="Blog">Blog</a></li>
                <li><a href="{{ route('projects.index') }}" title="Projets">Projets</a></li>
            </ul>
            <ul class="topbar-side">
                @auth
                    <li>
                        <form action="{{ route('logout') }}" method="post">
                            @csrf
                            <button class="action">Se déconncter</button>
                        </form>
                    </li>
                @endauth
            </ul>
        </nav>
        @yield('content')
        <footer class="footer">
            <div class="copyright">&copy; 2020 Jonathan Debétaz all rights reserved</div>
        </footer>
    </div>
</body>
</html>
