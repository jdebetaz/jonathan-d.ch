<?php

namespace App;

use App\Transformers\TechnologyTransformer;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use League\CommonMark\Environment;
use League\CommonMark\GithubFlavoredMarkdownConverter;

class Project extends Model
{
    protected $fillable = ['title', 'slug', 'attachment_id', 'user_id', 'online', 'content', 'source', 'demo', 'created_at'];
    protected $appends = ['mainTech', 'secondaryTech', 'marked'];

    public function scopePublished($query) {
        return $query
            ->where('online', true)
            ->whereDate("{$this->getTable()}.created_at", '<=', Carbon::now('Europe/Zurich'))
            ->orderBy("{$this->getTable()}.created_at", 'desc');
    }

    public function attachment () {
        return $this->belongsTo(Attachment::class);
    }

    public function mainTechnologies () {
        return $this->belongsToMany(Technology::class, 'technology_usage')->withPivotValue('secondary', false);
    }

    public function secondaryTechnologies () {
        return $this->belongsToMany(Technology::class, 'technology_usage')->withPivotValue('secondary', true);
    }

    public function getMainTechAttribute () {
        return (new TechnologyTransformer())->transform($this->mainTechnologies()->get()->toArray());
    }

    public function getSecondaryTechAttribute () {
        return (new TechnologyTransformer())->transform($this->secondaryTechnologies()->get()->toArray());
    }

    public function getMarkedAttribute() {
        $marked =  new GithubFlavoredMarkdownConverter([
            'html_input' => 'strip',
            'allow_unsafe_links' => false
        ]);
        return $marked->convertToHtml($this->content);
    }
}
