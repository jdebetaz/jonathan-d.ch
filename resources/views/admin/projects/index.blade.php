@extends('admin.card')

@section('title')
Gestion des projets
@endsection

@section('content')
<div class="flex">
    <a href="{{ route('admin.projects.create') }}" class="dashboard-btn">Ajouter un projet</a>
    {{ $projects->links() }}
</div>
<table class="table">
    <thead>
    <tr>
        <th>#</th>
        <th>Nom</th>
        <th class="text-center">Status</th>
        <th class="text-center">Publié le</th>
        <th class="text-right">Actions</th>
    </tr>
    </thead>
    <tbody>
    @foreach($projects as $project)
        <tr>
            <td class="dashboard-id">
                <a href="{{ route('admin.projects.edit', ['project' => $project]) }}">{{ $project->id }}</a>
            </td>
            <td>
                <a href="{{ route('admin.projects.edit', ['project' => $project]) }}">{{ $project->title }}</a>
            </td>
            <td><span class="bullet {{ ($project->online == false) ? 'bullet--danger': ''  }}"></span></td>
            <td class="text-center">{{ $project->created_at->format('d M Y') }}</td>
            <td>
                <div class="dashboard-actions">
                    <a href="{{ route('admin.projects.edit', ['project' => $project]) }}">
                        <svg class="icon icon-edit">
                            <use xlink:href="/sprite.svg#edit"></use>
                        </svg>
                    </a>
                    <form action="{{ route('admin.projects.destroy', ['project' => $project]) }}" method="POST" onsubmit="return confirm('Voulez vous vraiment supprimer ce contenu')">
                        @csrf
                        <input type="hidden" name="_method" value="DELETE" />
                        <button type="submit">
                            <svg class="icon icon-delete">
                                <use xlink:href="/sprite.svg#delete"></use>
                            </svg>
                        </button>
                    </form>
                </div>
            </td>
        </tr>
    @endforeach
    </tbody>
</table>

@endsection
