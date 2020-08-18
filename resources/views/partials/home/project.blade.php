<div class="project">
    <a class="project-thumb" href="{{ route('projects.show', ['project' => "{$project->slug}-{$project->id}"]) }}" title="{{ $project->title }}">
        <img src="{{ $project->attachment->url }}" alt="{{ $project->title }}" title="{{ $project->title }}">
    </a>
    <a class="project-title" href="{{ route('projects.show', ['project' => "{$project->slug}-{$project->id}"]) }}" title="{{ $project->title }}">
        <h2>{{ $project->title }}</h2>
    </a>
    <p class="project-technologies">
        @foreach($project->mainTechnologies as $technology)
            <a href="{{ route('projects.technology', ['technology' => $technology->slug]) }}" class="project__icon" tabindex="-1" title="t{{ $technology->title }}">
                <img src="{{ $technology->iconUrl }}" alt="{{ $technology->title }}" title="{{ $technology->title }}">
            </a>
        @endforeach
    </p>
</div>
