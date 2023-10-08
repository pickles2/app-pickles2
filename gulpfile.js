let fsx = require('fs-extra');
let gulp = require('gulp');
let sass = require('gulp-sass');//CSSコンパイラ
let plumber = require("gulp-plumber");//コンパイルエラーが起きても watch を抜けないようになる
let concat = require('gulp-concat');//ファイルの結合ツール
let rename = require("gulp-rename");//ファイル名の置き換えを行う
let browserify = require("gulp-browserify");//NodeJSのコードをブラウザ向けコードに変換
let webpack = require('webpack');
let webpackStream = require('webpack-stream');
let packageJson = require(__dirname+'/package.json');

// client-libs (frontend) を処理
gulp.task("client-libs:broccoli-html-editor", function() {
	return gulp.src(["node_modules/broccoli-html-editor/client/dist/**/*"])
		.pipe(gulp.dest( './app/common/broccoli-html-editor/client/dist/' ))
	;
});
gulp.task("client-libs:broccoli-field-table", function() {
	return gulp.src(["node_modules/broccoli-field-table/dist/**/*"])
		.pipe(gulp.dest( './app/common/broccoli-field-table/dist/' ))
	;
});
gulp.task("client-libs:px2style", function() {
	return gulp.src(["node_modules/px2style/dist/**/*"])
		.pipe(gulp.dest( './app/common/px2style/dist/' ))
	;
});
gulp.task("client-libs:cmd-queue", function() {
	return gulp.src(["node_modules/cmd-queue/dist/**/*"])
		.pipe(gulp.dest( './app/common/cmd-queue/dist/' ))
	;
});
gulp.task("client-libs:remote-finder", function() {
	return gulp.src(["node_modules/remote-finder/dist/**/*"])
		.pipe(gulp.dest( './app/common/remote-finder/dist/' ))
	;
});
gulp.task("client-libs:gitui79.js", function() {
	return gulp.src(["node_modules/gitui79/dist/**/*"])
		.pipe(gulp.dest( './app/common/gitui79/dist/' ))
	;
});
gulp.task("client-libs:node-git-parser", function() {
	return gulp.src(["node_modules/gitparse79/dist/**/*"])
		.pipe(gulp.dest( './app/common/gitparse79/dist/' ))
	;
});
gulp.task("client-libs:pickles2-code-search", function() {
	return gulp.src(["node_modules/@tomk79/pickles2-code-search/dist/**/*"])
		.pipe(gulp.dest( './app/common/pickles2-code-search/dist/' ))
	;
});
gulp.task("client-libs:ace-builds", function() {
	return gulp.src(["submodules/ace-builds/src-noconflict/**/*"])
		.pipe(gulp.dest( './app/common/ace-builds/src-noconflict/' ))
	;
});


// src 中の *.html を処理
gulp.task('.html', function(){
	return gulp.src(["src/**/*.html","!src/**/*.ignore*","!src/**/*.ignore*/*"])
		.pipe(plumber())
		.pipe(gulp.dest( './app/' ))
	;
});

// src 中の *.js を処理
gulp.task('.js', function(){
	return gulp.src(["src/**/*.js","!src/**/*.ignore*","!src/**/*.ignore*/*","!src/**/*.webpack.js"])
		.pipe(plumber())
		.pipe(browserify({}))
		.pipe(gulp.dest( './app/' ))
	;
});

// Webpack: common/styles/contents.js を処理
gulp.task("webpack:common/styles/contents.js", function() {
	return webpackStream({
		mode: 'production',
		entry: "./src/common/styles/contents.webpack.js",
		output: {
			filename: "contents.js"
		},
		module:{
			rules:[
				{
					test:/\.html$/,
					use:['html-loader']
				},
				{
					test: /\.(jpg|png)$/,
					use: ['url-loader']
				}
			]
		}
	}, webpack)
		.pipe(plumber())
		.pipe(gulp.dest( './app/common/styles/' ))
		.pipe(concat('contents.js'))
	;
});

// Webpack: home を処理
gulp.task("webpack:home", function() {
	return webpackStream({
		mode: 'production',
		entry: "./src/fncs/home/index_files/app.webpack.js",
		output: {
			filename: "app.js"
		},
		module:{
			rules:[
				{
					test:/\.html$/,
					use:['html-loader']
				},
				{
					test: /\.(jpg|png)$/,
					use: ['url-loader']
				}
			]
		}
	}, webpack)
		.pipe(plumber())
		.pipe(gulp.dest( './app/fncs/home/index_files/' ))
		.pipe(concat('app.js'))
	;
});


// src 中の *.css を処理
gulp.task('.css', function(){
	return gulp.src(["src/**/*.css","!src/**/*.ignore*","!src/**/*.ignore*/*"])
		.pipe(plumber())
		.pipe(gulp.dest( './app/' ))
	;
});


let _tasks = gulp.parallel(
	"client-libs:broccoli-html-editor",
	"client-libs:broccoli-field-table",
	"client-libs:px2style",
	"client-libs:cmd-queue",
	"client-libs:remote-finder",
	"client-libs:gitui79.js",
	"client-libs:node-git-parser",
	"client-libs:pickles2-code-search",
	"client-libs:ace-builds",
	
	'.html',
	'.js',
	'webpack:common/styles/contents.js',
	'webpack:home',
	'.css',
);

// src 中のすべての拡張子を監視して処理
gulp.task("watch", function() {
	return gulp.watch(["src/**/*"], _tasks);
});


// src 中のすべての拡張子を処理(default)
gulp.task("default", _tasks);
