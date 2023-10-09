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
	.sass('./src/common/styles/contents-darkmode.css.scss', './app/common/styles/contents-darkmode.css')
	.sass('./src/mods/systeminfo/index_files/style.css.scss', './app/mods/systeminfo/index_files/style.css')

	.copy('./src/fncs/rebuild_guiedit_contents/index_files/style.css', './app/fncs/rebuild_guiedit_contents/index_files/style.css')
	.copy('./src/fncs/modules/index_files/style.css', './app/fncs/modules/index_files/style.css')
	.copy('./src/mods/editor/index_files/style.css', './app/mods/editor/index_files/style.css')
	.copy('./src/mods/editor/editor_px2ce_php_files/style.css', './app/mods/editor/editor_px2ce_php_files/style.css')
	.copy('./src/mods/editor/editor_px2ce_files/style.css', './app/mods/editor/editor_px2ce_files/style.css')

	.copyDirectory('./node_modules/px2style/dist/', './app/common/px2style/dist/')
	.copyDirectory('./node_modules/cmd-queue/dist/', './app/common/cmd-queue/dist/')
	.copyDirectory('./node_modules/remote-finder/dist/', './app/common/remote-finder/dist/')
	.copyDirectory('./node_modules/gitui79/dist/', './app/common/gitui79/dist/')
	.copyDirectory('./node_modules/gitparse79/dist/', './app/common/gitparse79/dist/')
	.copyDirectory('./node_modules/@tomk79/pickles2-code-search/dist/', './app/common/pickles2-code-search/dist/')
	.copyDirectory('./submodules/ace-builds/src-noconflict/', './app/common/ace-builds/src-noconflict/')

	.copy('./src/fncs/home/index.html', './app/fncs/home/index.html')
	.copy('./src/fncs/contents/index.html', './app/fncs/contents/index.html')
	.copy('./src/fncs/files_and_folders/index.html', './app/fncs/files_and_folders/index.html')
	.copy('./src/fncs/rebuild_guiedit_contents/index.html', './app/fncs/rebuild_guiedit_contents/index.html')
	.copy('./src/fncs/make_unused_module_list/index.html', './app/fncs/make_unused_module_list/index.html')
	.copy('./src/fncs/make_content_file_list/index.html', './app/fncs/make_content_file_list/index.html')
	.copy('./src/fncs/composer/index.html', './app/fncs/composer/index.html')
	.copy('./src/fncs/styleguide_generator/index.html', './app/fncs/styleguide_generator/index.html')
	.copy('./src/fncs/custom_console_extensions/index.html', './app/fncs/custom_console_extensions/index.html')
	.copy('./src/fncs/search/index.html', './app/fncs/search/index.html')
	.copy('./src/fncs/clearcache/index.html', './app/fncs/clearcache/index.html')
	.copy('./src/fncs/publish/index.html', './app/fncs/publish/index.html')
	.copy('./src/fncs/sitemaps/index.html', './app/fncs/sitemaps/index.html')
	.copy('./src/fncs/move_contents/index.html', './app/fncs/move_contents/index.html')
	.copy('./src/fncs/modules/index.html', './app/fncs/modules/index.html')
	.copy('./src/fncs/themes/index.html', './app/fncs/themes/index.html')
	.copy('./src/fncs/themes/index_files/templates/not-enough-api-version.html', './app/fncs/themes/index_files/templates/not-enough-api-version.html')
	.copy('./src/fncs/themes/index_files/templates/form-layout-delete.html', './app/fncs/themes/index_files/templates/form-layout-delete.html')
	.copy('./src/fncs/themes/index_files/templates/form-layout.html', './app/fncs/themes/index_files/templates/form-layout.html')
	.copy('./src/fncs/themes/index_files/templates/list.html', './app/fncs/themes/index_files/templates/list.html')
	.copy('./src/fncs/themes/index_files/templates/form-theme.html', './app/fncs/themes/index_files/templates/form-theme.html')
	.copy('./src/fncs/themes/index_files/templates/form-theme-delete.html', './app/fncs/themes/index_files/templates/form-theme-delete.html')
	.copy('./src/fncs/themes/index_files/templates/theme-home.html', './app/fncs/themes/index_files/templates/theme-home.html')
	.copy('./src/fncs/git/index.html', './app/fncs/git/index.html')
	.copy('./src/fncs/contents_processor/index.html', './app/fncs/contents_processor/index.html')
	.copy('./src/fncs/make_content_files_by_list/index.html', './app/fncs/make_content_files_by_list/index.html')
	.copy('./src/mods/systeminfo/index.html', './app/mods/systeminfo/index.html')
	.copy('./src/mods/editor/index.html', './app/mods/editor/index.html')
	.copy('./src/mods/editor/editor_px2ce_php.html', './app/mods/editor/editor_px2ce_php.html')
	.copy('./src/mods/editor/editor_px2ce.html', './app/mods/editor/editor_px2ce.html')


	.js('./src/fncs/home/index_files/app.webpack.js', './app/fncs/home/index_files/app.js')
	.js('./src/common/styles/contents.webpack.js', './app/common/styles/contents.js')

	// .js('./src/fncs/contents/index_files/app.js', './app/fncs/contents/index_files/app.js')
	// .js('./src/fncs/files_and_folders/index_files/script.js', './app/fncs/files_and_folders/index_files/script.js')
	// .js('./src/fncs/rebuild_guiedit_contents/index_files/script.js', './app/fncs/rebuild_guiedit_contents/index_files/script.js')
	// .js('./src/fncs/make_unused_module_list/index_files/script.js', './app/fncs/make_unused_module_list/index_files/script.js')
	// .js('./src/fncs/make_content_file_list/index_files/script.js', './app/fncs/make_content_file_list/index_files/script.js')
	// .js('./src/fncs/composer/index_files/script.js', './app/fncs/composer/index_files/script.js')
	// .js('./src/fncs/styleguide_generator/index_files/app.js', './app/fncs/styleguide_generator/index_files/app.js')
	// .js('./src/fncs/custom_console_extensions/index_files/script.js', './app/fncs/custom_console_extensions/index_files/script.js')
	// .js('./src/fncs/search/index_files/app.js', './app/fncs/search/index_files/app.js')
	// .js('./src/fncs/clearcache/index_files/app.js', './app/fncs/clearcache/index_files/app.js')
	// .js('./src/fncs/publish/index_files/app.js', './app/fncs/publish/index_files/app.js')
	// .js('./src/fncs/sitemaps/index_files/app.js', './app/fncs/sitemaps/index_files/app.js')
	// .js('./src/fncs/move_contents/index_files/script.js', './app/fncs/move_contents/index_files/script.js')
	// .js('./src/fncs/modules/index_files/app.js', './app/fncs/modules/index_files/app.js')
	// .js('./src/fncs/themes/index_files/script.js', './app/fncs/themes/index_files/script.js')
	// .js('./src/fncs/git/index_files/app.js', './app/fncs/git/index_files/app.js')
	// .js('./src/fncs/contents_processor/index_files/script.js', './app/fncs/contents_processor/index_files/script.js')
	// .js('./src/fncs/make_content_files_by_list/index_files/script.js', './app/fncs/make_content_files_by_list/index_files/script.js')
	// .js('./src/mods/systeminfo/index_files/script.js', './app/mods/systeminfo/index_files/script.js')
	// .js('./src/mods/editor/index_files/script.js', './app/mods/editor/index_files/script.js')
	// .js('./src/mods/editor/editor_px2ce_php_files/script.js', './app/mods/editor/editor_px2ce_php_files/script.js')
	// .js('./src/mods/editor/editor_px2ce_files/server.js', './app/mods/editor/editor_px2ce_files/server.js')
	// .js('./src/mods/editor/editor_px2ce_files/script.js', './app/mods/editor/editor_px2ce_files/script.js')
;
