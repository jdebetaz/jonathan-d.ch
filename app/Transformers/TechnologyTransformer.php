<?php


namespace App\Transformers;


use App\Technology;
use Illuminate\Support\Str;

class TechnologyTransformer
{

    /**
     * Transform the attribute from the underlying model values.
     *
     * @param $technologies
     * @return mixed
     */
    public function transform($technologies)
    {

        if (!is_array($technologies)) {
            return null;
        }

        return implode(',', array_map(function (array $technology): ?string {
            return $technology['title'];
        }, $technologies));
    }

    /**
     * Transform the attribute to its underlying model values.
     *
     * @param mixed $value
     * @param bool $secondary
     * @return array|string
     */
    public function reverseTransform($value)
    {
        if (empty($value)) {
            return [];
        }

        // On construit un tableau contenant les nom des techno en clef et la version en valeur
        $techno = explode(',', $value);

        // On trouve les technologies depuis la base de données
        $technologies = Technology::findByNames($techno);
        $technologiesByName = collect($technologies)->keyBy(function($t) {
            return $t->title;
        });

        foreach ($techno as $name) {
            // Si la technologie n'existe pas déjà on la crée
            if (!isset($technologiesByName[$name])) {
                $tech = new Technology();
                $tech->title = $name;
                $tech->slug = Str::slug($name);
                $tech->icon = strtolower($name).'.png';
                $tech->save();
                $technologies[] = $tech;
            }
        }
        return $technologies;
    }
}
