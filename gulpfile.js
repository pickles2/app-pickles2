var gulp = require('gulp');
var packageJson = require(__dirname+'/package.json');
var _tasks = [
	'provisional',
	'broccoli-client'
];

// broccoli-client (frontend) を処理
gulp.task("broccoli-client", function() {
	gulp.src(["node_modules/broccoli-html-editor/client/dist/**/*"])
		.pipe(gulp.dest( './app/common/broccoli-html-editor/client/dist/' ))
	;
	gulp.src(["node_modules/broccoli-field-table/dist/**/*"])
		.pipe(gulp.dest( './app/common/broccoli-field-table/dist/' ))
	;
	// gulp.src(["node_modules/broccoli-field-psd/dist/*"])
	// 	.pipe(gulp.dest( './app/common/broccoli-field-psd/dist/' ))
	// ;
});


// 【暫定対応】
// nw-builderがビルドに失敗するようになったので
// 暫定的に、ビルドが通っていたときのライブラリのバックアップから復元する。
gulp.task("provisional", function() {
	gulp.src(["_libs/**/*"])
		.pipe(gulp.dest( './node_modules/' ))
	;
});


// src 中のすべての拡張子を処理(default)
gulp.task("default", _tasks);