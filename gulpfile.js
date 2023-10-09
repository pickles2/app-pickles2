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


// src 中の *.js を処理
gulp.task('.js', function(){
	return gulp.src(["src/**/*.js","!src/**/*.ignore*","!src/**/*.ignore*/*","!src/**/*.webpack.js"])
		.pipe(plumber())
		.pipe(browserify({}))
		.pipe(gulp.dest( './app/' ))
	;
});


let _tasks = gulp.parallel(
	'.js',
);

// src 中のすべての拡張子を監視して処理
gulp.task("watch", function() {
	return gulp.watch(["src/**/*"], _tasks);
});


// src 中のすべての拡張子を処理(default)
gulp.task("default", _tasks);
