@extends('admin.card')

@section('title')
Gestion des technologies
@endsection

@section('content')
    <div class="flex">
        <a href="{{ route('admin.technologies.create') }}" class="dashboard-btn">Ajouter une technologie</a>
        {{ $technologies->links() }}
    </div>
    <table class="table">
        <thead>
            <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Projects</th>
                <th class="text-right">Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach($technologies as $technology)
                <tr>
                    <td class="dashboard-id">
                        <a href="{{ route('admin.technologies.edit', ['technology' => $technology]) }}">{{ $technology->id }}</a>
                    </td>
                    <td>
                        <a href="{{ route('admin.technologies.edit', ['technology' => $technology]) }}" style="display: inline-flex; align-items: center">
                            <img src="{{ $technology->iconUrl }}" alt="" style="width: 30px; margin-right: 8px;" >
                            {{ $technology->title }}
                        </a>
                    </td>
                    <td>
                        <a href="#">
                            {{ $technology->projects()->count() }}
                        </a>
                    </td>
                    <td>
                        <div class="dashboard-actions">
                            <a href="{{ route('admin.technologies.edit', ['technology' => $technology]) }}">
                                <svg class="icon icon-edit">
                                    <use xlink:href="/sprite.svg#edit"></use>
                                </svg>
                            </a>
                            @if($technology->projects()->count() == 0)
                                <form action="{{ route('admin.technologies.destroy', ['technology' => $technology]) }}" method="post" onsubmit="return confirm('Voulez vous vraiment supprimer ce contenu')">
                                    @csrf
                                    <input type="hidden" name="_method" value="DELETE" />
                                    <button type="submit">
                                        <svg class="icon icon-delete">
                                            <use xlink:href="/sprite.svg#delete"></use>
                                        </svg>
                                    </button>
                                </form>
                            @endif
                        </div>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
