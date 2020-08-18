@csrf
<section class="stack-large">
    <section>
        <div class="section-title">
            Informations générales
        </div>
        <div class="grid">
            <div class="form-group">
                <label for="title">Titre du projet</label>
                <input id="title" type="text" name="title" value="{{ $project->title }}">
            </div>
            <div class="form-group">
                <label for="slug">Slug du projet</label>
                <input id="slug" type="text" name="slug" value="{{ $project->slug }}">
            </div>
            <div class="form-group">
                <label for="created_at">Date de publication</label>
                <input id="created_at" type="text" name="created_at" value="{{ $project->created_at }}" is="date-picker">
            </div>
            <div class="form-group">
                <label for="user_id">Auteur</label>
                <select name="user_id" id="category_id">
                    @foreach($users as $k => $user)
                        <option value="{{ $k }}" {{ ($k == $project->user_id) ? 'selected': '' }}>{{ $user }}</option>
                    @endforeach
                </select>
            </div>
            <div class="form-group">
                <label for="source">Source</label>
                <input type="text" name="source" value="{{ $project->source }}">
            </div>
            <div class="form-group">
                <label for="source">Démo</label>
                <input type="text" name="demo" value="{{ $project->demo }}">
            </div>
            <div class="form-group form-attachment" style="grid-row-start:1;align-self:stretch;">
                <label for="attachment_id">Image du projet</label>
                <input id="attachment_id" type="text" name="attachment_id" value="{{ $project->attachment_id }}" preview="{{ ($project->attachment !== null) ? $project->attachment->url : '' }}" is="input-attachment">
            </div>
            <div style="grid-column-end: span 2; padding-top: 29px;" class="flex start hstack-large form-group">

            </div>
            <div class="full grid" style="--col: 400px;">
                <div class="form-group">
                    <label for="">Technologies principales</label>
                    <input type="text" name="mainTech" is="input-choices" value="{{ $project->mainTech }}">
                </div>
                <div class="form-group">
                    <label for="">Technologies secondaires</label>
                    <input type="text" name="secondaryTech" is="input-choices" value="{{ $project->secondaryTech }}">
                </div>
                <div class="form-group form-switch" style="align-self: flex-end">
                    <input id="online" type="checkbox" name="online" {{ $project->online ? 'checked=""': '' }} is="input-switch">
                    <label for="online">En ligne ?</label>
                </div>
            </div>
        </div>
    </section>
    <section>
        <div class="section-title">
            Description
        </div>
        <div class="form-group full">
            <label for="content">Contenu</label>
            <textarea id="content" type="text" name="content" is="markdown-editor">{{ $project->content }}</textarea>
        </div>
    </section>
    <section>
        <div class="full">
            <button type="submit" class="btn-gradient">Sauvegarder</button>
        </div>
    </section>
</section>

