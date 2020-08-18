@extends('admin.card')

@section('title')
Gestion des catégories
@endsection

@section('content')
    <div class="flex">
        <a href="{{ route('admin.categories.create') }}" class="dashboard-btn">Ajouter une catégorie</a>
        {{ $categories->links() }}
    </div>
    <table class="table">
        <thead>
            <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Articles</th>
                <th class="text-right">Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach($categories as $category)
                <tr>
                    <td class="dashboard-id">
                        <a href="{{ route('admin.categories.edit', ['category' => $category]) }}">{{ $category->id }}</a>
                    </td>
                    <td>
                        <a href="{{ route('admin.categories.edit', ['category' => $category]) }}" style="display: inline-flex; align-items: center">
                            <img src="{{ $category->iconUrl }}" alt="" style="width: 30px; margin-right: 8px;" >
                            {{ $category->title }}
                        </a>
                    </td>
                    <td>
                        <a href="#">
                            {{ $category->posts()->count() }}
                        </a>
                    </td>
                    <td>
                        <div class="dashboard-actions">
                            <a href="{{ route('admin.categories.edit', ['category' => $category]) }}">
                                <svg class="icon icon-edit">
                                    <use xlink:href="/sprite.svg#edit"></use>
                                </svg>
                            </a>
                            @if($category->posts()->count() == 0)
                                <form action="{{ route('admin.categories.destroy', ['category' => $category]) }}" method="post" onsubmit="return confirm('Voulez vous vraiment supprimer ce contenu')">
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
