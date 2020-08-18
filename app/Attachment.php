<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Attachment extends Model
{
    protected $appends = ['url'];

    public function scopeFindYearsMonths($query) {
        $rows = $query->select(DB::raw('EXTRACT(MONTH FROM created_at) as month, EXTRACT(YEAR FROM created_at) as year, COUNT(id) as count'))
            ->groupBy('month', 'year')
            ->orderBy('month', 'DESC')
            ->orderBy('year', 'DESC')
            ->getQuery()
            ->get()
            ->toArray();

        return array_map(function ($row) {
            return [
                'path' => $row->year . '/' . str_pad($row->month, 2, '0', STR_PAD_LEFT),
                'count' => $row->count,
            ];
        }, $rows);
    }

    public function scopeSearch ($query, string $q) {
        return $query->where('filename LIKE :search')
            ->orderBy('created_at', 'DESC')
            ->setMaxResults(25)
            ->setParameter('search', "%$q%")
            ->getQuery()
            ->get()->toArray();
    }

    public function scopeFindForPath($query, $path) {
        $parts = explode('/', $path);
        $start = new \DateTimeImmutable("{$parts[0]}-{$parts[1]}-01");
        $end = $start->modify('+1 month -1 second');

        return $query
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('created_at', 'DESC')
            ->limit(50)
            ->getQuery()
            ->get()->toArray();
    }

    public function getUrlAttribute() {
        return "/uploads/attachments/{$this->created_at->format('Y')}/{$this->filename}";
    }
}
