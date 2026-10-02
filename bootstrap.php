<?php

defined('ABSPATH') || exit;

use YOOtheme\Builder;
use YOOtheme\Path;

return [
    'extend' => [
        Builder::class => static function (Builder $builder): void {
            $builder->addTypePath(Path::get('./elements/*/element.php'));
        },
    ],
];
