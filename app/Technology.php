<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use League\CommonMark\GithubFlavoredMarkdownConverter;

class Technology extends Model
{
    protected $fillable = ['title', 'slug', 'icon', 'content'];
    protected $appends = ['iconUrl', 'marked'];

    public function getIconUrlAttribute() {
        return "/uploads/icons/{$this->icon}";
    }

    public function getMarkedAttribute() {
        $marked =  new GithubFlavoredMarkdownConverter([
            'html_input' => 'strip',
            'allow_unsafe_links' => false
        ]);
        return $marked->convertToHtml($this->content);
    }

    public function scopeFindByNames($query, $values) {
        return $query->whereIn('title', $values)->get();
    }
    public function projects () {
        return $this->belongsToMany(Project::class, 'technology_usage');
    }
}
