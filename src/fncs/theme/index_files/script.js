window.px = window.parent.px;
window.contApp = new (function(){
	if( !px ){ alert('px が宣言されていません。'); }
	var it79 = require('iterate79');
	var _this = this;
	var pj = px.getCurrentProject();
	var status = pj.status();
	var multithemePluginFunctionName = 'tomk79\\pickles2\\multitheme\\theme::exec';
	var px2all,
		themePluginList,
		realpathThemeCollectionDir,
		themeCollection;
	var $elms = {'editor': $('<div>')};

	function init( callback ){
		it79.fnc({}, [
			function(it1, arg){
				// --------------------------------------
				// 依存APIのバージョンを確認
				pj.checkPxCmdVersion(
					{
						px2dthelperVersion: '>=2.0.6'
					},
					function(){
						// API設定OK
						it1.next(arg);
					},
					function( errors ){
						// API設定が不十分な場合のエラー処理
						// エラーだったらここで離脱。
						_this.pageNotEnoughApiVersion(errors);
						callback();
						return;
					}
				);
			},
			function(it1, arg){
				// --------------------------------------
				// Pickles 2 の各種情報から、
				// テーマプラグインの一覧を取得
				pj.px2dthelperGetAll('/', {}, function(result){
					px2all = result;
					// console.log(px2all);
					themePluginList = [];
					try {
						themePluginList = px2all.packages.package_list.themes;
					} catch (e) {
					}
					it1.next(arg);
					return;
				});
			},
			function(it1, arg){
				// --------------------------------------
				// テーマコレクションディレクトリのパスを求める
				pj.px2dthelperGetRealpathThemeCollectionDir(function(result){
					realpathThemeCollectionDir = result;
					it1.next(arg);
				});
			},
			function(it1, arg){
				// --------------------------------------
				// テーマコレクションをリスト化
				if( !px.utils79.is_dir(realpathThemeCollectionDir) ){
					// テーマディレクトリが存在しなければ終了
					var err = 'Theme Collection Dir is NOT exists.';
					console.log(err, realpathThemeCollectionDir);
					_this.pageNotEnoughApiVersion([err]);
					callback();
					return;
				}
				themeCollection = [];
				var ls = px.fs.readdirSync(realpathThemeCollectionDir);
				// console.log(ls);
				for( var idx in ls ){
					if( !px.utils79.is_dir( realpathThemeCollectionDir+ls[idx]+'/' ) ){
						continue;
					}
					themeCollection.push( ls[idx] );
				}
				it1.next(arg);
			},
			function(it1, arg){
				// --------------------------------------
				// スタンバイ完了
				_this.pageHome();
				callback();
			}
		]);
	}

	/**
	 * ホーム画面を開く
	 */
	this.pageHome = function(){
		$('h1').text('テーマ');
		var html = px.utils.bindEjs(
			px.fs.readFileSync('app/fncs/theme/index_files/templates/list.html').toString(),
			{
				'themePluginList': themePluginList,
				'realpathThemeCollectionDir': realpathThemeCollectionDir,
				'themeCollection': themeCollection
			}
		);
		$('.contents').html( html );
	}

	/**
	 * テーマのホーム画面を開く
	 */
	this.pageThemeHome = function(themeId){
		// console.log('Theme: '+themeId);
		$('h1').text('テーマ "'+themeId+'"');
		it79.fnc({}, [
			function(it1, arg){
				var ls = px.fs.readdirSync(realpathThemeCollectionDir+encodeURIComponent(themeId));
				arg.layouts = [];
				for( var idx in ls ){
					var layoutId = ls[idx];
					if( !px.utils79.is_file( realpathThemeCollectionDir+encodeURIComponent(themeId)+'/'+encodeURIComponent(layoutId) ) ){
						continue;
					}
					if( !layoutId.match(/\.html$/) ){
						continue;
					}
					var layoutId = layoutId.replace(/\.[a-zA-Z0-9]+$/i, '');
					var editMode = 'html';
					if( px.utils79.is_file( realpathThemeCollectionDir+encodeURIComponent(themeId)+'/guieditor.ignore/'+encodeURIComponent(layoutId)+'/data/data.json' ) ){
						editMode = 'html.gui';
					}

					arg.layouts.push( {
						'id': layoutId,
						'editMode': editMode
					} );
				}
				it1.next(arg);
			},
			function(it1, arg){
				var html = px.utils.bindEjs(
					px.fs.readFileSync('app/fncs/theme/index_files/templates/theme-home.html').toString(),
					{
						'themeId': themeId,
						'layouts': arg.layouts,
						'realpathThemeCollectionDir': realpathThemeCollectionDir
					}
				);
				$('.contents').html( html );
				it1.next(arg);
			},
			function(it1, arg){
				$('.contents').find('.cont-layout-list a button').on('click', function(e){
					e.stopPropagation();
				});
				it1.next(arg);
			}
		]);
		return;
	}

	/**
	 * 新規レイアウトを作成またはリネームする
	 */
	this.addNewLayout = function(theme_id, layout_id){
		if( !theme_id ){
			return;
		}
		var html = px.utils.bindEjs(
			px.fs.readFileSync('app/fncs/theme/index_files/templates/form-layout.html').toString(),
			{
				'themeId': theme_id,
				'layoutId': layout_id
			}
		);
		var $body = $('<div>').append( html );
		var $form = $body.find('form');

		px2style.modal(
			{
				'title': (layout_id ? 'レイアウトのリネーム' : '新規レイアウト作成'),
				'body': $body,
				'buttons': [
					$('<button class="px2-btn">')
						.text('キャンセル')
						.on('click', function(e){
							px2style.closeModal();
						}),
					$('<button class="px2-btn px2-btn--primary">')
						.text('OK')
						.on('click', function(e){
							$form.submit();
						})
				]
			},
			function(){}
		);

		$form.on('submit', function(e){
			var newLayoutId = $form.find('input[name=layoutId]').val();
			var editMode = $form.find('input[name=editMode]:checked').val();
			var $errMsg = $form.find('[data-form-column-name=layoutId] .cont-error-message')
			if( !newLayoutId.length ){
				$errMsg.text('レイアウトIDを指定してください。');
				return;
			}
			if( !newLayoutId.match(/^[a-zA-Z0-9\_\-]+$/) ){
				$errMsg.text('レイアウトIDに使えない文字が含まれています。');
				return;
			}
			if( newLayoutId.length > 128 ){
				$errMsg.text('レイアウトIDが長すぎます。');
				return;
			}
			if( layout_id ){
				if( layout_id == newLayoutId ){
					$errMsg.text('レイアウトIDが変更されていません。');
					return;
				}
			}
			if( !layout_id ){
				if( !editMode ){
					$errMsg.text('編集方法が選択されていません。');
					return;
				}
				if( editMode != 'html' && editMode != 'html.gui' ){
					$errMsg.text('編集方法が不正です。');
					return;
				}
			}


			var realpathLayout = realpathThemeCollectionDir+theme_id+'/'+encodeURIComponent(newLayoutId)+'.html';
			if( px.utils79.is_file( realpathLayout ) ){
				$errMsg.text('レイアウトID '+newLayoutId+' は、すでに存在します。');
				return;
			}

			if( layout_id ){
				// ファイル名変更
				px.fs.renameSync( realpathThemeCollectionDir+theme_id+'/'+encodeURIComponent(layout_id)+'.html', realpathLayout );
				if( px.utils79.is_dir( realpathThemeCollectionDir+theme_id+'/guieditor.ignore/'+encodeURIComponent(layout_id)+'/' ) ){
					px.fs.renameSync(
						realpathThemeCollectionDir+theme_id+'/guieditor.ignore/'+encodeURIComponent(layout_id)+'/',
						realpathThemeCollectionDir+theme_id+'/guieditor.ignore/'+encodeURIComponent(newLayoutId)+'/'
					);
				}
				if( px.utils79.is_dir( realpathThemeCollectionDir+theme_id+'/theme_files/layouts/'+encodeURIComponent(layout_id)+'/' ) ){
					px.fs.renameSync(
						realpathThemeCollectionDir+theme_id+'/theme_files/layouts/'+encodeURIComponent(layout_id)+'/',
						realpathThemeCollectionDir+theme_id+'/theme_files/layouts/'+encodeURIComponent(newLayoutId)+'/'
					);
				}
			}else{
				// ファイル生成
				px.fs.writeFileSync( realpathLayout, '<!DOCTYPE html>'+"\n" );
				if( editMode == 'html.gui' ){
					px.fsEx.mkdirsSync( realpathThemeCollectionDir+theme_id+'/guieditor.ignore/'+encodeURIComponent(newLayoutId)+'/data/' );
					px.fs.writeFileSync( realpathThemeCollectionDir+theme_id+'/guieditor.ignore/'+encodeURIComponent(newLayoutId)+'/data/data.json', '{}'+"\n" );
				}
			}

			var msg = (layout_id ? 'レイアウト '+layout_id+' を '+newLayoutId+' にリネームしました。' : 'レイアウト '+newLayoutId+' を作成しました。')
			px.message(msg);
			px2style.closeModal();
			_this.pageThemeHome(theme_id);
		});

		return;
	}

	/**
	 * レイアウトをリネームする
	 */
	this.renameLayout = function(theme_id, layout_id){
		return this.addNewLayout(theme_id, layout_id);
	}

	/**
	 * レイアウトを削除する
	 */
	this.deleteLayout = function(theme_id, layout_id){
		var html = px.utils.bindEjs(
			px.fs.readFileSync('app/fncs/theme/index_files/templates/form-layout-delete.html').toString(),
			{
				'themeId': theme_id,
				'layoutId': layout_id
			}
		);
		var $body = $('<div>').append( html );
		var $form = $body.find('form');

		px2style.modal(
			{
				'title': 'レイアウト削除',
				'body': $body,
				'buttons': [
					$('<button class="px2-btn">')
						.text('キャンセル')
						.on('click', function(e){
							px2style.closeModal();
						}),
					$('<button class="px2-btn px2-btn--danger">')
						.text('削除する')
						.on('click', function(e){
							$form.submit();
						})
				]
			},
			function(){}
		);

		$form.on('submit', function(e){
			// ファイルを削除
			px.fs.unlinkSync( realpathThemeCollectionDir+theme_id+'/'+encodeURIComponent(layout_id)+'.html' );
			if( px.utils79.is_dir( realpathThemeCollectionDir+theme_id+'/guieditor.ignore/'+encodeURIComponent(layout_id)+'/' ) ){
				px.fsEx.removeSync( realpathThemeCollectionDir+theme_id+'/guieditor.ignore/'+encodeURIComponent(layout_id)+'/' );
			}
			if( px.utils79.is_dir( realpathThemeCollectionDir+theme_id+'/theme_files/layouts/'+encodeURIComponent(layout_id)+'/' ) ){
				px.fsEx.removeSync( realpathThemeCollectionDir+theme_id+'/theme_files/layouts/'+encodeURIComponent(layout_id)+'/' );
			}

			px.message('レイアウト ' + layout_id + ' を削除しました。');
			px2style.closeModal();
			_this.pageThemeHome(theme_id);
		});

		return;
	}

	/**
	 * APIバージョンが不十分(旧画面)
	 */
	this.pageNotEnoughApiVersion = function( errors ){
		// ↓このケースでは、 `realpathThemeCollectionDir` を返すAPIが利用できないため、
		// 　古い方法でパスを求める。
		realpathThemeCollectionDir = pj.get('path')+'/'+pj.get('home_dir')+'/themes/';

		var html = px.utils.bindEjs(
			px.fs.readFileSync('app/fncs/theme/index_files/templates/not-enough-api-version.html').toString(),
			{'errors': errors}
		);
		$('.contents').html( html );
	}

	/**
	 * エディター画面を開く
	 */
	this.openEditor = function( themeId, layoutId ){
		var realpathLayout = realpathThemeCollectionDir+themeId+'/'+layoutId+'.html';
		if( !px.utils79.is_file( realpathLayout ) ){
			alert('ERROR: Layout '+themeId + '/' + layoutId + ' is NOT exists.');
			return;
		}

		this.closeEditor();//一旦閉じる

		// プログレスモード表示
		px.progress.start({
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
						// if(!confirm('編集中の内容は破棄されます。エディタを閉じますか？')){ return false; }
						_this.closeEditor();
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

		// px.progress.close();
		return;
	} // openEditor()

	/**
	 * エディター画面を閉じる
	 * 単に閉じるだけです。編集内容の保存などの処理は、editor.html 側に委ねます。
	 */
	this.closeEditor = function(){
		$elms.editor.remove();
		$('body')
			.css({'overflow':'auto'})
		;
		return;
	} // closeEditor()

	/**
	 * フォルダを開く
	 */
	this.openInFinder = function( theme_id ){
		var url = realpathThemeCollectionDir;
		if(theme_id){
			url += theme_id+'/';
		}
		px.fsEx.mkdirsSync( url );
		px.utils.openURL( url );
	}

	/**
	 * 外部テキストエディタで開く
	 */
	this.openInTextEditor = function( theme_id, layout_id ){
		var url = realpathThemeCollectionDir;
		if(theme_id){
			url += theme_id+'/';
		}
		if(layout_id){
			url += layout_id+'.html';
		}
		px.openInTextEditor( url );
	}

	/**
	 * ウィンドウリサイズイベントハンドラ
	 */
	function onWindowResize(){
		$elms.editor
			.css({
				'height': $(window).innerHeight() - 0
			})
		;

	}

	/**
	 * イベント
	 */
	$(window).on('load', function(){
		init(function(){
			$(window).on('resize', function(){
				onWindowResize();
			});
			console.log('Standby.');
		});
	});

})();
