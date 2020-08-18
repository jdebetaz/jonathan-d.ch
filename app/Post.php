<?php

namespace App;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use League\CommonMark\GithubFlavoredMarkdownConverter;

class Post extends Model
{
    protected $fillable = ['title', 'slug', 'user_id', 'category_id', 'attachment_id', 'online', 'content', 'created_at'];
    protected $casts = ['online' => 'boolean'];
    protected $appends = ['marked', 'resume'];

    public function getMarkedAttribute() {
        $marked =  new GithubFlavoredMarkdownConverter([
            'html_input' => 'strip',
            'allow_unsafe_links' => false
        ]);
        return $marked->convertToHtml($this->content);
    }

    public function getResumeAttribute() {
        return Str::limit(strip_tags($this->getMarkedAttribute()), 250, '...');
    }

    public function scopePublished($query) {
        return $query
            ->where('online', true)
            ->whereDate('created_at', '<=', Carbon::now('Europe/Zurich'))
            ->orderBy('created_at', 'desc');
    }

    public function attachment () {
        return $this->belongsTo(Attachment::class);
    }

    public function user () {
        return $this->belongsTo(User::class);
    }

    public function category () {
        return $this->belongsTo(Category::class);
    }
}
