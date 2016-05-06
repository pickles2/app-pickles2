window.px = window.parent.px;
window.contApp = new (function( px ){
	var _this = this;
	var it79 = require('iterate79');
	var php = require('phpjs');
	var _pj = px.getCurrentProject();
	var pickles2ContentsEditor = new Pickles2ContentsEditor();

	var _param = px.utils.parseUriParam( window.location.href );

	function resizeEvent(){
	}

	function init(){
		px.cancelDrop( window );
		resizeEvent();

		var _page_url = px.preview.getUrl( _param.page_path );
		var elmA = document.createElement('a');
		elmA.href = _page_url;

		pickles2ContentsEditor.init(
			{
				'page_path': _param.page_path , // <- 編集対象ページのパス
				'elmCanvas': document.getElementById('canvas'), // <- 編集画面を描画するための器となる要素
				'preview':{ // プレビュー用サーバーの情報を設定します。
					'origin': elmA.origin
				},
				'gpiBridge': function(input, callback){
					// GPI(General Purpose Interface) Bridge
					// broccoliは、バックグラウンドで様々なデータ通信を行います。
					// GPIは、これらのデータ通信を行うための汎用的なAPIです。
					window.contAppPx2CEServer(px, input, function(rtn){
						// console.log(rtn);
						callback(rtn);
					});
					return;
				},
				'complete': function(){
					window.parent.contApp.closeEditor();
				},
				'onClickContentsLink': function( uri, data ){
					// console.log(url);
					// console.log(data);
					// function preg_quote(str, delimiter){
					// 	return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
					// }
					_page_url.match(new RegExp('^([a-zA-Z0-9]+\\:\\/\\/[^\\/]+\\/)'));
					var currentDomain = RegExp.$1;

					if( url.match( new RegExp(px.utils.escapeRegExp( currentDomain )) ) ){
						// プレビューサーバーのドメインと一致したら、通す。
					}else if( url.match( new RegExp('^(?:[a-zA-Z0-9]+\\:|\\/\\/)') ) ){
						alert('リンク先('+url+')は管理外のURLです。');
						return;
					}
					var to = url;
					var pathControot = px.preview.getUrl();
					to = to.replace( new RegExp( '^'+px.utils.escapeRegExp( pathControot ) ), '/' );
					to = to.replace( new RegExp( '^\\/+' ), '/' );

					if( to != _param.page_path ){
						if( !confirm( '"'+to+'" へ遷移しますか?' ) ){
							return;
						}
						window.parent.contApp.openEditor( to );
					}
				},
				'onMessage': function( message ){
					px.message(message);
				}
			},
			function(){
				// スタンバイ完了したら呼び出されるコールバックメソッドです。
				console.info('standby!!');
				px.progress.close();
			}
		);

		return this;
	}

	$(function(){
		init();
	})
	$(window).resize(function(){
		resizeEvent();
	});

})( window.parent.px );
