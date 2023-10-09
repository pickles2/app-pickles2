window.px = window.parent.main || window.opener.main;
window.main = window.parent.main || window.opener.main;
window.contApp = new (function( px ){
	var _this = this;
	var it79 = require('iterate79');
	var _pj = px.getCurrentProject();
	var pickles2ContentsEditor = new Pickles2ContentsEditor(); // px2ce client
	var resizeTimer;
	var realpathThemeCollectionDir;

	var _param = px.utils.parseUriParam( window.location.href );

	function init(){
		it79.fnc({}, [
			function(it1, arg){
				if( window.opener && window.opener.main ){
					// サブウィンドウで開いた場合に、
					// 位置とサイズを opener と同じにする。
					window.moveTo(window.opener.screenX, window.opener.screenY);
					window.resizeTo(window.opener.outerWidth, window.opener.outerHeight);
				}
				it1.next(arg);
			},
			function(it1, arg){
				px.cancelDrop( window );
				fitWindowSize(function(){
					it1.next(arg);
				});

			},
			function(it1, arg){
				if( _param.page_path ){
					arg.target_mode = 'page_content';
					arg.page_path = _param.page_path;
				}else if( _param.theme_id && _param.layout_id ){
					arg.target_mode = 'theme_layout';
					arg.page_path = require('path').resolve('/'+_param.theme_id+'/'+_param.layout_id+'.html');
				}
				// console.log(arg);
				it1.next(arg);
			},
			function(it1, arg){
				if( arg.target_mode == 'theme_layout' ){
					_pj.px2dthelperGetRealpathThemeCollectionDir(function(result){
						realpathThemeCollectionDir = result;
						it1.next(arg);
					});
					return;
				}
				it1.next(arg);
			},
			function(it1, arg){

				var px2ceInitOptions = {};

				var _page_url = px.preview.getUrl( arg.page_path );
				var elmA = document.createElement('a');
				elmA.href = _page_url;
				var _page_origin = elmA.origin;
				if( arg.target_mode == 'theme_layout' ){
					px2ceInitOptions.target_mode = arg.target_mode;
				}

				window.contAppPx2CEServer(px, arg.page_path, px2ceInitOptions, function(px2ceServer){
					pickles2ContentsEditor.init(
						{
							'target_mode': arg.target_mode,
							'page_path': arg.page_path , // <- 編集対象ページのパス
							'elmCanvas': document.getElementById('canvas'), // <- 編集画面を描画するための器となる要素
							'preview':{ // プレビュー用サーバーの情報を設定します。
								'origin': _page_origin
							},
							'customFields': _pj.mkBroccoliCustomFieldOptionFrontend(window, false),
							'lang': px.getDb().language,
							'gpiBridge': function(input, callback){
								// GPI(General Purpose Interface) Bridge
								// broccoliは、バックグラウンドで様々なデータ通信を行います。
								// GPIは、これらのデータ通信を行うための汎用的なAPIです。
								px2ceServer.gpi(
									input,
									function(rtn){
										callback(rtn);
									}
								);
								return;
							},
							'clipboard': px.clipboard,
							'complete': function(){
								if( window.opener && window.opener.main ){
									window.close();
									return;
								}
								window.parent.contApp.closeEditor();
							},
							'onClickContentsLink': function( url, data ){
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

								if( to != arg.page_path ){
									if( !confirm( '"'+to+'" へ遷移しますか?' ) ){
										return;
									}
									window.parent.contApp.openEditor( to );
								}
							},
							'onMessage': function( message ){
								window.px2style.flashMessage(message);
							}
						},
						function(){
							// スタンバイ完了したら呼び出されるコールバックメソッドです。
							it1.next(arg);
						}
					);
				});
			} ,
			function(it1, arg){
				px.progress.close();
				console.info('standby!!');
			}
		]);

		return;
	}

	$(function(){
		init();
	})
	$(window).resize(function(){
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(function(){
			if(pickles2ContentsEditor.redraw){
				pickles2ContentsEditor.redraw();
			}
		}, 500);
	});

})( window.parent.main || window.opener.main );
