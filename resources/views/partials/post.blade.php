<article class="post {{ ($key % 6 === 0) ? 'post-large': '' }}">
    <a class="post-image-link" href="{{ route('blog.show', ['blog' => $post->slug]) }}" title="{{ $post->title }}">
        <img class="post-image" src="{{ $post->attachment->url }}" alt="{{ $post->title }}" title="{{ $post->title }}">
    </a>
    <div class="post-content">
        <header class="post-header">
            <div class="post-meta">
                <a href="{{ route('blog.category', ['category' => $post->category->slug]) }}" class="post-category" title="{{ $post->category->title }}">{{ $post->category->title }}</a>
                <time datetime="">{{ $post->created_at->format('d M Y') }}</time>
            </div>
            <h2 class="post-title">
                <a class="post-link" href="{{ route('blog.show', ['blog' => $post->slug]) }}" title="{{ $post->title }}"><h3>{{ $post->title }}</h3></a>
            </h2>
        </header>
        <section class="post-excerpt">
            {{ $post->resume }}
        </section>
    </div>
</article>
