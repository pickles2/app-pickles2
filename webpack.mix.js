const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel applications. By default, we are compiling the CSS
 | file for the application as well as bundling up all the JS files.
 |
 */

mix
	.webpackConfig({
		module: {
			rules:[
				{
					test: /\.txt$/i,
					use: ['raw-loader'],
				},
				{
					test: /\.csv$/i,
					loader: 'csv-loader',
					options: {
						dynamicTyping: true,
						header: false,
						skipEmptyLines: false,
					},
				},
				{
					test:/\.twig$/,
					use:['twig-loader'],
				},
				{
					test: /\.jsx$/,
					exclude: /(node_modules|bower_components)/,
					use: [{
						loader: 'babel-loader',
						options: {
							presets: [
								'@babel/preset-react',
								'@babel/preset-env',
							],
						},
					}]
				}
			]
		},
		resolve: {
			fallback: {
				"fs": false,
				"path": false,
				"crypto": false,
				"stream": false,
			}
		}
	})



	// --------------------------------------
	// SCSS
	.sass('./src/fncs/home/index_files/style.css.scss', './app/fncs/home/index_files/style.css')
	.sass('./src/fncs/contents/index_files/style.css.scss', './app/fncs/contents/index_files/style.css')
	.sass('./src/fncs/files_and_folders/index_files/style.css.scss', './app/fncs/files_and_folders/index_files/style.css')
	.sass('./src/fncs/make_unused_module_list/index_files/style.css.scss', './app/fncs/make_unused_module_list/index_files/style.css')
	.sass('./src/fncs/make_content_file_list/index_files/style.css.scss', './app/fncs/make_content_file_list/index_files/style.css')
	.sass('./src/fncs/composer/index_files/style.css.scss', './app/fncs/composer/index_files/style.css')
	.sass('./src/fncs/styleguide_generator/index_files/style.css.scss', './app/fncs/styleguide_generator/index_files/style.css')
	.sass('./src/fncs/custom_console_extensions/index_files/style.css.scss', './app/fncs/custom_console_extensions/index_files/style.css')
	.sass('./src/fncs/search/index_files/style.css.scss', './app/fncs/search/index_files/style.css')
	.sass('./src/fncs/clearcache/index_files/style.css.scss', './app/fncs/clearcache/index_files/style.css')
	.sass('./src/fncs/publish/index_files/style.css.scss', './app/fncs/publish/index_files/style.css')
	.sass('./src/fncs/sitemaps/index_files/style.css.scss', './app/fncs/sitemaps/index_files/style.css')
	.sass('./src/fncs/move_contents/index_files/style.css.scss', './app/fncs/move_contents/index_files/style.css')
	.sass('./src/fncs/themes/index_files/style.css.scss', './app/fncs/themes/index_files/style.css')
	.sass('./src/fncs/git/index_files/style.css.scss', './app/fncs/git/index_files/style.css')
	.sass('./src/fncs/contents_processor/index_files/style.css.scss', './app/fncs/contents_processor/index_files/style.css')
	.sass('./src/fncs/make_content_files_by_list/index_files/style.css.scss', './app/fncs/make_content_files_by_list/index_files/style.css')
	.sass('./src/index_files/style.css.scss', './app/index_files/style.css')
	// .sass('./src/common/styles/_css/_px2style_v2/_utils/_utils.css.scss', './app/common/styles/_css/_px2style_v2/_utils/_utils.css')
	// .sass('./src/common/styles/_css/_px2style_v2/_header/_header.css.scss', './app/common/styles/_css/_px2style_v2/_header/_header.css')
	.sass('./src/common/styles/contents.css.scss', './app/common/styles/contents.css')
	.sass('./src/mods/systeminfo/index_files/style.css.scss', './app/mods/systeminfo/index_files/style.css')

	// // --------------------------------------
	// // cloverCommon Script
	// .js('src/cloverCommon/cloverCommon.js', 'public/resources/cloverCommon/')
	// .sass('src/cloverCommon/cloverCommon.scss', 'public/resources/cloverCommon/')

	// // --------------------------------------
	// // cloverMain Script
	// .js('src/cloverMain/cloverMain.jsx', 'public/resources/cloverMain/')
	// .sass('src/cloverMain/cloverMain.scss', 'public/resources/cloverMain/')

	// // --------------------------------------
	// // previewFooter Script
	// .js('src/previewFooter/previewFooter.js', 'public/resources/previewFooter/')
	// .sass('src/previewFooter/previewFooter.scss', 'public/resources/previewFooter/')


	// // --------------------------------------
	// // Static Frontend Libraries
	// .copyDirectory('vendor/pickles2/px2style/dist', 'public/resources/px2style')
	// .copyDirectory('vendor/tomk79/remote-finder/dist', 'public/resources/remote-finder')
	// .copyDirectory('node_modules/@tomk79/common-file-editor/dist', 'public/resources/common-file-editor')
	// .copyDirectory('node_modules/gitui79/dist', 'public/resources/gitui79')
;
