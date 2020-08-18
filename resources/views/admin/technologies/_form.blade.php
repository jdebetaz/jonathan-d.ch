@csrf
<section class="stack-large">
    <section>
        <div class="section-title">
            Informations générales
        </div>
        <div class="grid">
            <div class="form-group">
                <label for="">Nom de la technologie</label>
                <input type="text" name="title" value="{{ $technology->title }}">
            </div>
            <div class="form-group">
                <label for="">Slug de la technologie</label>
                <input type="text" name="slug" value="{{ $technology->slug }}">
            </div>
            <div class="form-group">
                <label for="">Image de la technoligie</label>
                <input type="file" name="icon" value="{{ $technology->icon }}">
            </div>
        </div>
    </section>
    <section>
        <div class="section-title">
            Description
        </div>
        <div class="form-group full">
            <label for="content">Contenu</label>
            <textarea id="content" type="text" name="content" is="markdown-editor">{{ $technology->content }}</textarea>
        </div>
    </section>
    <section>
        <button type="submit" class="btn-gradient">Sauvegarder</button>
    </section>

</section>
