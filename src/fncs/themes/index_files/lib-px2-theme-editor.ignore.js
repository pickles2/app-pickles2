/**
 * lib-px2-theme-editor.js
 */
module.exports = function(main, $elms){
	const it79 = require('iterate79');
	var _this = this;
	var pj = main.getCurrentProject();
	var utils79 = main.utils79;
	var pickles2ThemeEditor;
	var realpathDataDir;
	var realpathThemeCollectionDir;
	var px2all;

	/**
	 * 画面を初期化
	 */
	this.init = function( callback ){

		it79.fnc({}, [
			function(it1){
				pj.px2dthelperGetAll('/', {}, function(result){
					px2all = result;
					realpathDataDir = px2all.realpath_homedir+'_sys/ram/data/';
					realpathThemeCollectionDir = px2all.realpath_theme_collection_dir;
					it1.next();
				});
			},
			function(it1){
				// クライアントリソースをロード
				pj.execPx2(
					'/?PX=px2dthelper.px2te.client_resources',
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
											if( main.getAppearance() == 'dark' ){
												// --------------------------------------
												// ダークモードスタイルを読み込む
												var $link = document.createElement('link');
												$link.href = 'file://'+main.utils79.dirname(resources.css[0])+'/themes/darkmode.css';
												$link.rel = 'stylesheet';
												$link.className = 'px2-darkmode';
												var $head = document.querySelector('head');
												$head.appendChild($link);
											}

											it1.next();
										}
									);
								}
							);

						}
					}
				);
			},
			function(it1){
				pickles2ThemeEditor = new Pickles2ThemeEditor(); // px2te client
				it1.next();
			},
			function(it1){

				pickles2ThemeEditor.init(
					{
						'elmCanvas': $('.contents').get(0), // <- 編集画面を描画するための器となる要素
						'lang': main.getDb().language,
						'gpiBridge': function(input, callback){
							// GPI(General Purpose Interface) Bridge
							// broccoliは、バックグラウンドで様々なデータ通信を行います。
							// GPIは、これらのデータ通信を行うための汎用的なAPIです。

							var testTimestamp = (new Date()).getTime();
							var tmpFileName = '__tmp_'+utils79.md5( Date.now() )+'.json';
							main.fs.writeFileSync( realpathDataDir+tmpFileName, JSON.stringify(input) );

							pj.execPx2(
								'/?PX=px2dthelper.px2te.gpi&appMode=desktop&data_filename='+encodeURIComponent( tmpFileName ),
								{
									complete: function(rtn){
										console.log('--- returned(millisec)', (new Date()).getTime() - testTimestamp);
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
												main.fs.unlinkSync( realpathDataDir+tmpFileName );
												// pj.updateGitStatus(function(){});
												rlv();
											}); })
											.then(function(){ return new Promise(function(rlv, rjt){
												callback( rtn );
											}); })
										;
									}
								}
							);
							return;
						},
						'themeLayoutEditor': function(themeId, layoutId){
							_this.openEditor(themeId, layoutId);
							return;
						},
						'openInFinder': function(path){
							var url = realpathThemeCollectionDir;
							if(path){
								url += path;
							}
							main.fsEx.mkdirsSync( url );
							main.utils.openURL( url );
							pj.updateGitStatus();
						},
						'openInTextEditor': function(path){
							var url = realpathThemeCollectionDir;
							if(path){
								url += path;
							}
							main.openInTextEditor( url );
							pj.updateGitStatus();
						}
					},
					function(){
						// スタンバイ完了したら呼び出されるコールバックメソッドです。
						it1.next();
					}
				);

			} ,
			function(it1){

				$(window).on('resize', function(){
					console.log('window.resized');
					$elms.editor
						.css({
							'height': $(window).innerHeight() - 0
						})
					;
				});

				console.log('Theme Editor: Standby.');
				callback();
			}
		]);

	}

	/**
	 * エディター画面を開く
	 */
	this.openEditor = function( themeId, layoutId ){
		var realpathLayout = realpathThemeCollectionDir+themeId+'/'+layoutId+'.html';
		if( !main.utils79.is_file( realpathLayout ) ){
			alert('ERROR: Layout '+themeId + '/' + layoutId + ' is NOT exists.');
			return;
		}

		main.preview.serverStandby( function(result){
			if(result === false){
				main.message('プレビューサーバーの起動に失敗しました。');
				return;
			}

			window.contApp.closeEditor();//一旦閉じる

			// プログレスモード表示
			main.progress.start({
				'blindness':true,
				'showProgressBar': true
			});

			$elms.editor = $('<div>')
				.css({
					'position':'fixed',
					'top':0,
					'left':0 ,
					'z-index': '1000',
					'width':'100%',
					'height':$(window).height()
				})
				.append(
					$('<iframe>')
						//↓エディタ自体は別のHTMLで実装
						.attr( 'src', '../../mods/editor/index.html'
							+'?theme_id='+encodeURIComponent( themeId )
							+'&layout_id='+encodeURIComponent( layoutId )
						)
						.css({
							'border':'0px none',
							'width':'100%',
							'height':'100%'
						})
				)
				.append(
					$('<a>')
						.html('&times;')
						.attr('href', 'javascript:;')
						.on( 'click', function(){
							window.contApp.closeEditor();
						} )
						.css({
							'position':'absolute',
							'bottom':5,
							'right':5,
							'font-size':'18px',
							'color':'#333',
							'background-color':'#eee',
							'border-radius':'0.5em',
							'border':'1px solid #333',
							'text-align':'center',
							'opacity':0.4,
							'width':'1.5em',
							'height':'1.5em',
							'text-decoration': 'none'
						})
						.hover(function(){
							$(this).animate({
								'opacity':1
							});
						}, function(){
							$(this).animate({
								'opacity':0.4
							});
						})
				)
			;
			$('body')
				.append($elms.editor)
				.css({'overflow':'hidden'})
			;
		} );

		// main.progress.close();
		return;
	} // openEditor()

}

