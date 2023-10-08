(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.px = window.parent.main || window.opener.main;
window.main = window.parent.main || window.opener.main;
window.contApp = new (function( px ){
	var _this = this;
	var _pj = px.getCurrentProject();

	var _param = px.utils.parseUriParam( window.location.href );

	var _pageInfo = null;
	var _themeInfo = null;
	if( _param.page_path ){
		_pageInfo = _pj.site.getPageInfo( _param.page_path );
		// if( !_pageInfo ){
		// 	alert('ERROR: Undefined page path.'); return this;
		// }
	}else if( _param.theme_id && _param.layout_id ){
		_themeInfo = {
			'theme_id': _param.theme_id,
			'layout_id': _param.layout_id
		};
	}

	if( window.parent && window.parent.contApp && window.parent.contApp.loadPreview ){
		// 呼び出し元のプレビュー状態を同期する。
		window.parent.contApp.loadPreview(_param.page_path);
	}


	/**
	 * エディターを起動
	 */
	function openEditor(){
		var url = './editor_px2ce_php.html?'

		if( _param.page_path ){
			url += 'page_path='+encodeURIComponent( _param.page_path );
		}else if(_param.theme_id && _param.layout_id){
			url += 'theme_id='+encodeURIComponent( _param.theme_id );
			url += '&layout_id='+encodeURIComponent( _param.layout_id );
		}
		window.location.href = url;
		return true;
	}

	/**
	 * エイリアスページのためのリダイレクト処理
	 */
	function redirectEditor( to ){
		// window.parent.contApp.openEditor( to );
		window.location.href = './index.html?page_path='+encodeURIComponent( to );
		return true;
	}

	/**
	 * 初期化
	 */
	function init( callback ){
		if( _pageInfo && _pageInfo.path.match( new RegExp('^alias[0-9]*\\:(.*)$') ) ){
			// エイリアスはリダイレクトする
			var to = RegExp.$1;
			redirectEditor( to );
			return this;
		}
		openEditor();
		return this;
	}

	$(function(){
		init(function(){});
	})

})( window.parent.main || window.opener.main );

},{}]},{},[1])