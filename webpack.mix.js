const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.webpackConfig({
    'resolve': {
        'alias': {
            'react': 'preact-compat',
            'react-dom': 'preact-compat',
        },
    },
})

mix.react('assets/app.js', 'public/js')
    .sass('assets/css/app.scss', 'public/css');

mix.react('assets/admin.js', 'public/js')
    .sass('assets/css/admin.scss', 'public/css');
