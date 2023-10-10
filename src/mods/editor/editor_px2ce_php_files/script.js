window.px = window.parent.main || window.opener.main;
window.main = window.parent.main || window.opener.main;
window.contApp = new (function( main ){
	var _this = this;
	var px = main;
	var it79 = require('iterate79');
	var utils79 = require('utils79');
	var _pj = px.getCurrentProject();
	var pickles2ContentsEditor; // px2ce client
	var realpathDataDir;
	var resizeTimer;
	var realpathThemeCollectionDir;

	var _param = px.utils.parseUriParam( window.location.href );

	function resizeEvent(){
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(function(){
			fitWindowSize(function(){
				if(pickles2ContentsEditor.redraw){
					pickles2ContentsEditor.redraw();
				}
			});
		}, 500);
		return;
	}
	function fitWindowSize(callback){
		callback = callback||function(){};
		callback();
		return;
	}

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
				_pj.px2dthelperGetAll('/', {}, function(px2all){
					realpathDataDir = px2all.realpath_homedir+'_sys/ram/data/';
					it1.next(arg);
				});
				// console.log(arg);
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
				// クライアントリソースをロード
				_pj.execPx2(
					arg.page_path+'?PX=px2dthelper.px2ce.client_resources',
					{
						complete: function(resources){
							try{
								resources = JSON.parse(resources);
							}catch(e){
								console.error('Failed to parse JSON "client_resources".', e);
							}
							it79.ary(
								resources.css,
								function(it2, row, idx){
									var link = document.createElement('link');
									link.addEventListener('load', function(){
										it2.next();
									});
									$('head').append(link);
									link.rel = 'stylesheet';
									link.href = 'file://'+row;

									if( main.getAppearance() === 'dark' ){
										// --------------------------------------
										// ダークモードスタイルを読み込む
										if( row.match(/\/broccoli\.css$/) ){
											var linkDarkmode = document.createElement('link');
											linkDarkmode.rel = 'stylesheet';
											linkDarkmode.href = 'file://'+main.utils79.dirname(row)+'/themes/darkmode.css';
											$('head').append(linkDarkmode);
										}
										if( row.match(/\/pickles2\-contents\-editor\.css$/) ){
											var linkDarkmode = document.createElement('link');
											linkDarkmode.rel = 'stylesheet';
											linkDarkmode.href = 'file://'+main.utils79.dirname(row)+'/themes/darkmode.css';
											$('head').append(linkDarkmode);
										}
									}
								},
								function(){
									it79.ary(
										resources.js,
										function(it3, row, idx){
											var script = document.createElement('script');
											script.addEventListener('load', function(){
												it3.next();
											});
											$('head').append(script);
											script.src = 'file://'+row;
										},
										function(){
											it1.next(arg);
										}
									);
								}
							);

						}
					}
				);
			},
			function(it1, arg){
				pickles2ContentsEditor = new Pickles2ContentsEditor(); // px2ce client
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

							var realpathBroccoliUserStorageBaseDir = main.px2dtLDA.getAppDataDir('px2dt');

							if( input.api == "broccoliBridge" && input.forBroccoli && input.forBroccoli.api == "saveUserData" ){
								// userStorageの保存要求に対する対応
								console.log('userStorage の保存リクエストを受けました', input.forBroccoli.options, realpathBroccoliUserStorageBaseDir);
								try{
									_pj.appdata.writeCustomDataFile('broccoli-userstorage-modPaletteCondition', input.forBroccoli.options.modPaletteCondition, function(result){
										callback(result);
									});
								}catch(e){
									console.error(e);
									callback(false);
								}
								return;
							}

							// var testTimestamp = (new Date()).getTime();
							var tmpFileName = '__tmp_'+utils79.md5( Date.now() )+'.json';
							px.fs.writeFile(
								realpathDataDir+tmpFileName,
								JSON.stringify(input),
								function(err){
									_pj.execPx2(
										arg.page_path+'?PX=px2dthelper.px2ce.gpi&appMode=desktop&target_mode='+encodeURIComponent(arg.target_mode)+'&data_filename='+encodeURIComponent( tmpFileName ),
										{
											complete: function(rtn){
												// console.log('--- returned(millisec)', (new Date()).getTime() - testTimestamp);
												new Promise(function(rlv){rlv();})
													.then(function(){ return new Promise(function(rlv, rjt){
														try{
															rtn = JSON.parse(rtn);
														}catch(e){
															console.error('Failed to parse JSON String -> ' + rtn);
														}
														rlv();
													}); })
													.then(function(){ return new Promise(function(rlv, rjt){
														if( input.api == "broccoliBridge" && input.forBroccoli && input.forBroccoli.api == "getBootupInfomations" ){
															// userStorageの情報を付加して返す。
															rtn.userData = rtn.userData || {};
															rtn.userData.modPaletteCondition = '{}';
															try{
																_pj.appdata.readCustomDataFile('broccoli-userstorage-modPaletteCondition', function(result){
																	rtn.userData.modPaletteCondition = result;
																	rlv();
																});
															}catch(e){
																console.error(e);
																rlv();
															}
															return;
														}
														rlv();
													}); })
													.then(function(){ return new Promise(function(rlv, rjt){
														px.fs.unlink(
															realpathDataDir+tmpFileName,
															function(err){
																rlv();
															}
														);
														_pj.updateGitStatus(function(){});
													}); })
													.then(function(){ return new Promise(function(rlv, rjt){
														callback( rtn );
													}); })
												;
											}
										}
									);
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
	$(window).on('resize', function(){
		resizeEvent();
	});

})( window.parent.main || window.opener.main );
