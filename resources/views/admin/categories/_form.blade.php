@csrf
<section class="stack-large">
    <section>
        <div class="section-title">
            Informations générales
        </div>
        <div class="grid">
            <div class="form-group">
                <label for="">Nom de la technologie</label>
                <input type="text" name="title" value="{{ $category->title }}">
            </div>
            <div class="form-group">
                <label for="">Slug de la technologie</label>
                <input type="text" name="slug" value="{{ $category->slug }}">
            </div>
        </div>
    </section>

    <section>
        <button type="submit" class="btn-gradient">Sauvegarder</button>
    </section>

</section>
