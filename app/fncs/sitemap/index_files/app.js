(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.px = window.parent.px;
window.contApp = new (function(px, $){
	var _this = this;
	var pj = px.getCurrentProject();
	var filelist = pj.getSitemapFilelist();
	this.git = pj.git();
	// console.log(git);
	this.gitUi = new px2dtGitUi(px, pj);

	/**
	 * initialize
	 * @return {void} no return;
	 */
	function init(){

		$('.cont_filelist_sitemap')
			.html('')
			.append( $('<ul>').addClass('listview') )
		;

		filelistLoop:for( var i in filelist ){
			switch( px.utils.getExtension(filelist[i]) ){
				case 'csv':
				case 'xlsx':
					break;
				default:
					continue filelistLoop;
			}

			$('.cont_filelist_sitemap ul').append( $('<li>')
				.append( $('<a>')
					.attr('href', 'javascript:;')
					.data('filename', filelist[i] )
					.data('num', i)
					.click( function(e){
						var path = pj.get('path')+'/'+pj.get('home_dir')+'/sitemaps/'+$(this).data('filename');
						px.utils.openURL( path );
					} )
					.text( filelist[i] )
				)
			);
		}
		// $('.cont_filelist_sitemap ul').listview();

	}

	/**
	 * サイトマップをコミットする
	 */
	this.commitSitemap = function(){
		this.gitUi.commit('sitemaps', {}, function(result){
			console.log('(コミット完了しました)');
		});
		return this;
	}

	/**
	 * サイトマップのコミットログを表示する
	 */
	this.logSitemap = function(){
		this.gitUi.log('sitemaps', {}, function(result){
			console.log('(コミットログを表示しました)');
		});
		return this;
	}

	/**
	 * フォルダを開く
	 */
	this.openInFinder = function(){
		px.utils.openURL( pj.get('path')+'/'+pj.get('home_dir')+'/sitemaps/' );
	}

	/**
	 * 初期化イベント発火
	 */
	$(function(){
		init();
	});

})(px, $);

},{}]},{},[1])