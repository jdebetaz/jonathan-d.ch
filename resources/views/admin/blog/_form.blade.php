@csrf
<div class="grid">
    <div class="form-group">
        <label for="title">Titre de l'article</label>
        <input id="title" type="text" name="title" value="{{ $post->title }}">
    </div>
    <div class="form-group">
        <label for="slug">Slug de l'article</label>
        <input id="slug" type="text" name="slug" value="{{ $post->slug }}">
    </div>
    <div class="form-group">
        <label for="created_at">Date de publication</label>
        <input id="created_at" type="text" name="created_at" value="{{ $post->created_at }}" is="date-picker">
    </div>
    <div class="form-group">
        <label for="user_id">Auteur</label>
        <select name="user_id" id="category_id">
            @foreach($users as $k => $user)
                <option value="{{ $k }}" {{ ($k == $post->user_id) ? 'selected': '' }}>{{ $user }}</option>
            @endforeach
        </select>
    </div>
    <div class="form-group">
        <label for="category_id">Catégorie</label>
        <select name="category_id" id="category_id">
            @foreach($categories as $k => $category)
                <option value="{{ $k }}" {{ ($k == $post->category_id) ? 'selected': '' }}>{{ $category }}</option>
            @endforeach
        </select>
    </div>
    <div class="form-group form-attachment" style="grid-row-start:1;align-self:stretch;">
        <label for="attachment_id">Image de l'article</label>
        <input id="attachment_id" type="text" name="attachment_id" value="{{ $post->attachment_id }}" preview="{{ ($post->attachment !== null) ? $post->attachment->url : '' }}" is="input-attachment">
    </div>
    <div style="grid-column-end: span 2; padding-top: 29px;" class="flex start hstack-large form-group">
        <div class="form-group form-switch" style="align-self: flex-end">
            <input id="online" type="checkbox" name="online" {{ $post->online ? 'checked=""': '' }} is="input-switch">
            <label for="online">En ligne ?</label>
        </div>
    </div>
    <div class="form-group full">
        <label for="content">Contenu</label>
        <textarea id="content" type="text" name="content" is="markdown-editor">{{ $post->content }}</textarea>
    </div>
    <div class="full">
        <button type="submit" class="btn-gradient">Sauvegarder</button>
    </div>
</div>
