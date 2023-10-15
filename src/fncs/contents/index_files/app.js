window.px = window.parent.main;
window.main = window.parent.main;
window.contApp = new (function( main ){
	if( !main ){ alert('px が宣言されていません。'); }
	var it79 = require('iterate79');

	var _this = this;
	var app = this;
	var $elms = {};

	var _param = main.utils.parseUriParam( window.location.href );
	var _pj = this.pj = main.getCurrentProject();
	var _currentPagePath;
	var _currentPageInfo;

	var contentsComment,
		wasabiComment,
		pageDraw,
		pageSearch;

	this.gitUi = new px2dtGitUi(main, _pj);

	/**
	 * 初期化
	 */
	function init(callback){
		callback = callback || function(){};
		it79.fnc({},[
			function(it1, arg){
				// 依存APIのバージョンを確認
				_this.pj.checkPxCmdVersion(
					{
						apiVersion: '>=2.0.30',
						px2dthelperVersion: '>=2.0.6'
					},
					function(){
						// API設定OK
						it1.next(arg);
					},
					function( errors ){
						// API設定が不十分な場合のエラー処理
						var html = main.utils.bindEjs(
							document.getElementById('template-not-enough-api-version').innerHTML,
							{errors: errors}
						);
						$('.contents').html( html );
						// エラーだったらここで離脱。
						callback();
						return;
					}
				);
			},
			function(it1, arg){
				// broccoli-html-editor-php エンジン利用環境の要件を確認
				_this.pj.checkPxCmdVersion(
					{
						px2dthelperVersion: '>=2.0.8'
					},
					function(){
						// API設定OK
						it1.next(arg);
					},
					function( errors ){
						// API設定が不十分な場合のエラー処理
						var html = main.utils.bindEjs(
							main.fs.readFileSync('app/common/templates/broccoli-html-editor-php-is-not-available.html').toString(),
							{errors: errors}
						);
						$('.contents').html( html );
						// エラーだったらここで離脱。
						callback();
						return;
					}
				);
				return;
			},
			function(it1, arg){
				$elms.editor = $('<div>');
				$elms.sitemapParent = $('.cont_sitemap_parent');
				$elms.brosList = $('.cont_sitemap_broslist');
				$elms.searchList = $('.cont_sitemap_search');
				$elms.preview = $('.cont_preview');
				$elms.previewIframe = $elms.preview.find('iframe');
				$elms.pageinfo = $('.cont_page_info');
				$elms.commentView = $('.cont_comment_view');
				$elms.wasabiView = $('.cont-wasabi-view');
				$elms.workspaceSearch = $('.cont_workspace_search');
				$elms.breadcrumb = $('.cont_breadcrumb');

				// bootstrap
				$('*').tooltip();

				it1.next(arg);
			},
			function(it1, arg){
				$elms.preview
					.css({
						'height': 600
					})
				;
				$elms.previewIframe
					.on('load', function(){
						// console.log('=-=-=-=-=-=-=-= iframe loaded.');
						var currentPagePath;

						it79.fnc({}, [
							function(it, prop){
								main.cancelDrop( $elms.previewIframe.get(0).contentWindow );

								currentPagePath = app.extractPagePathFromPreviewLocation();

								it.next(prop);
							},
							function(it, prop){
								var preWin = ( $elms.previewIframe.get(0).contentWindow );
								$(preWin.document).find('a')
									.removeAttr('target')
									.on('click', function(e){
										var attrHref = $(this).attr('href');
										if( attrHref.match(/^[a-zA-Z0-9]+\:/i) && !attrHref.match(/^(?:javascript|data)\:/i) ){
											if(confirm( 'サイト外のURLです。'+"\n"+attrHref+"\n"+'ブラウザで開きますか？' )){
												main.utils.openURL(attrHref);
											}
											return false;
										}
										return true;
									});
								it.next(prop);
							},
							function(it, prop){
								// px2-clover のウィジェットを削除する
								var preWin = ( $elms.previewIframe.get(0).contentWindow );
								$(preWin.document).find('[data-px2-clover-preview-widget]').remove();
								it.next(prop);
							},
							function(it, prop){
								app.goto( currentPagePath, {}, function(){
									it.next(prop);
								} );
							},
							function(){
								callback();
							}
						]);

					})
				;
				it1.next(arg);
			},
			function(it1, arg){
				contentsComment = new (require('../../../fncs/contents/index_files/libs.ignore/contentsComment.js'))(_this, px, _pj);
				wasabiComment = new (require('../../../fncs/contents/index_files/libs.ignore/wasabi.js'))(_this, px, _pj);
				pageDraw = new (require('../../../fncs/contents/index_files/libs.ignore/pageDraw.js'))(_this, px, _pj, $elms, contentsComment, wasabiComment);
				pageSearch = new (require('../../../fncs/contents/index_files/libs.ignore/pageSearch.js'))(_this, px, _pj, $elms);
				it1.next(arg);
			},
			function(it1, arg){
				// フィルター機能を初期化
				pageSearch.init( function(){
					it1.next(arg);
				} );
			},
			function(it1, arg){
				// ページ情報を初期化
				pageDraw.init( function(){
					it1.next(arg);
				} );
			},
			function(it1, arg){
				// 最初のページ情報を描画
				var startPage = _param.page_path;
				// var startPage = '/hoge/fuga/notfound.html';
				app.goto( startPage, {'force':true}, function(){
					it1.next(arg);
				} );
			},
			function(it1, arg){
				$(window).resize();
				it1.next(arg);
			},
			function(it1, arg){
				callback();
			}
		]);

	}

	/**
	 * 素材フォルダを開く
	 */
	this.openMaterialsDirectory = function( path ){
		var pathFiles = _pj.getContentFilesByPageContent( _pj.findPageContent( path ) );
		var realpathFiles = _pj.get_realpath_controot()+pathFiles;
		if( !main.utils.isDirectory( realpathFiles ) ){
			main.fs.mkdirSync( realpathFiles );
			if( !main.utils.isDirectory( realpathFiles ) ){
				return false;
			}
		}
		var realpath_matDir = realpathFiles + 'materials.ignore/';
		if( !main.utils.isDirectory( realpath_matDir ) ){
			main.fs.mkdirSync( realpath_matDir );
			if( !main.utils.isDirectory( realpath_matDir ) ){
				return false;
			}
		}
		main.utils.openURL( realpath_matDir );
		return this;
	}

	/**
	 * リソースフォルダを開く
	 */
	this.openResourcesDirectory = function( path ){
		var pathFiles = _pj.getContentFilesByPageContent( _pj.findPageContent( path ) );
		var realpathFiles = _pj.get_realpath_controot()+pathFiles;
		if( !main.utils.isDirectory( realpathFiles ) ){
			main.fs.mkdirSync( realpathFiles );
			if( !main.utils.isDirectory( realpathFiles ) ){
				return false;
			}
		}
		main.utils.openURL( realpathFiles );
		return this;
	}

	/**
	 * コンテンツをコミットする
	 */
	this.commitContents = function( page_path ){
		this.gitUi.commit('contents', {'page_path': page_path}, function(result){
			_pj.updateGitStatus();
			console.log('(コミットを実行しました)', result);
		});
		return this;
	}


	/**
	 * コンテンツのコミットログを表示する
	 */
	this.logContents = function( page_path ){
		this.gitUi.log('contents', {'page_path': page_path}, function(result){
			console.log('(コミットログを表示しました)', result);
		});
		return this;
	}

	/**
	 * プレビューのURL から ページパスを抽出する
	 */
	this.extractPagePathFromPreviewLocation = function(previewLocation){
		if( !previewLocation ){
			previewLocation = $elms.previewIframe.get(0).contentWindow.location;
		}
		switch( previewLocation.href ){
			case 'blank':
			case 'about:blank':
			case 'data:text/html,chromewebdata': // <- サーバーが立ち上がってないとき、chromeがこのURLを返す模様
				return;
		}
		var to = previewLocation.pathname;
		var pathControot = _pj.getConfig().path_controot;
		to = to.replace( new RegExp( '^'+main.utils.escapeRegExp( pathControot ) ), '' );
		to = to.replace( new RegExp( '^\\/*' ), '/' );
		to = to.replace( /\/$/, '/index.html' );

		var page_path = to;
		return page_path;
	}

	/**
	 * カレントページの情報を取得する
	 */
	this.getCurrentPageInfo = function(){
		return _currentPageInfo;
	}

	/**
	 * カレントページのパスを取得する
	 */
	this.getCurrentPagePath = function(){
		return _currentPagePath;
	}

	/**
	 * 指定ページへ移動する
	 */
	this.goto = function( page_path, options, callback ){
		// console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-= goto');
		// console.log(_currentPagePath, page_path);
		callback = callback || function(){};
		options = options || {};
		if(page_path === undefined){
			page_path = '';
		}
		if(page_path === ''){
			try{
				page_path = _pj.getConfig().path_top;
			}catch(e){}
		}
		// console.log(_currentPagePath, page_path);
		if( removeHash(_currentPagePath) === removeHash(page_path) && !options.force ){
			// 遷移先がカレントページを同じければ処理しない。
			callback();
			return;
		}

		// 直接表示できないパスを解決してリダイレクトする
		function redirectPage(page_path, options, callback){
			_pj.px2proj.href(page_path, function(href){
				// console.log(href);
				var path_controot = '/';
				try {
					path_controot = _currentPageInfo.config.path_controot;
				} catch (e) {
				}
				href = removeHash(href);
				href = href.replace(new RegExp('^'+main.utils.escapeRegExp(path_controot)), '/');
				// console.log(href);
				main.progress.close();
				app.goto(href, options, callback);
			});
			return;
		}

		if( page_path.match(new RegExp('^alias[0-9]*\\:')) ){
			main.message( 'このページはエイリアスです。' );
			redirectPage(page_path, options, callback);
			return;
		}

		main.progress.start({"showProgressBar":false, 'blindness':false});

		_currentPagePath = page_path;

		_pj.px2dthelperGetAll(page_path, {'filter': false}, function(pjInfo){
			// console.log(pjInfo);
			_currentPageInfo = pjInfo;

			if(_currentPageInfo.page_info === false){
				// var pageInfo = _pj.site.getPageInfo( page_path );
				// console.log(pageInfo);
				// redirectPage(page_path, options, callback);
				alert('Error: ページ情報がロードされませんでした。');
				main.progress.close();
				callback();
				return;
			}

			// 描画・プレビューロードをキック
			pageDraw.redraw( _currentPageInfo, options, function(){
				if( _currentPageInfo.path_type == 'alias' ){
					// エイリアスはロードしない
					main.progress.close();
					callback();
					return;
				}

				if( !_currentPageInfo.page_info ){
					// ページ情報が正常にロードされていない場合
					main.progress.close();
					callback();
					return;
				}

				app.loadPreview( _currentPageInfo.page_info.path, options, function(){
					main.progress.close();
					callback();
				} );
			} );
		});


		return;
	}

	/**
	 * URLからHashを削除する
	 */
	function removeHash(url){
		if(typeof(url) !== typeof('')){
			return url;
		}
		var rtn = url.replace(/\#[\s\S]*$/g, '');
		// console.log(url, rtn);
		return rtn;
	}

	/**
	 * プレビューウィンドウにページを表示する
	 */
	this.loadPreview = function( page_path, options, callback ){
		// console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= loadPreview');
		// console.log(page_path);
		callback = callback || function(){};
		if(!options){ options = {}; }
		if(!options.force){ options.force = false; }

		if( !page_path ){
			page_path = _pj.getConfig().path_top;
		}

		var currentPreviewPagePath = this.extractPagePathFromPreviewLocation();
		var gotoUrl = main.preview.getUrl(page_path);
		var currentPreviewPageUrl = main.preview.getUrl(currentPreviewPagePath);
		// console.log(currentPreviewPageUrl, gotoUrl);

		if( removeHash(currentPreviewPageUrl) === removeHash(gotoUrl) && !options.force ){
			// 現在表示中の `page_path` と同じなら、リロードをスキップ
			// console.log('skipped :', page_path);
			callback();
			return;
		}
		// $elms.pageinfo.html('<div style="text-align:center;">now loading ...</div>');

		main.preview.serverStandby( function(result){
			if(result === false){
				main.message('プレビューサーバーの起動に失敗しました。');
				callback();
				return;
			}
			$elms.previewIframe.attr( 'src', gotoUrl );
			_pj.updateGitStatus();
			callback();
		} );
		return;
	} // loadPreview()

	/**
	 * エディター画面を開く
	 */
	this.openEditor = function( pagePath ){
		pagePath = removeHash(pagePath);
		var pageInfo = _pj.site.getPageInfo( pagePath );
		if( !pageInfo ){
			alert('ERROR: Undefined page path. - ' + pagePath);
			return this;
		}

		this.closeEditor();//一旦閉じる

		// プログレスモード表示
		main.progress.start({
			'blindness':true,
			'showProgressBar': true
		});

		var contPath = _pj.findPageContent( pagePath );
		var contRealpath = _pj.get('path')+'/'+contPath;
		var pathInfo = main.utils.parsePath(contPath);
		var pagePath = pageInfo.path;
		if( _pj.site.getPathType( pageInfo.path ) == 'dynamic' ){
			var dynamicPathInfo = _pj.site.get_dynamic_path_info(pageInfo.path);
			pagePath = dynamicPathInfo.path;
		}

		if( main.fs.existsSync( contRealpath ) ){
			contRealpath = main.fs.realpathSync( contRealpath );
		}

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
						+'?page_path='+encodeURIComponent( pagePath )
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
					.on('click', function(){
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

		return this;
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
		_this.loadPreview( _currentPagePath, {'force':true}, function(){
			_pj.updateGitStatus();
			pageDraw.redraw(_currentPageInfo, {}, function(){
			});
		} );
		return this;
	} // closeEditor()

	/**
	 * ウィンドウリサイズイベントハンドラ
	 */
	function onWindowResize(){
		$elms.editor
			.css({
				'height': $(window).innerHeight() - 0
			})
		;

		var heightBreadcrumb = $elms.breadcrumb.outerHeight();

		var $workspaceContainer = $('.cont_workspace_container');
		$workspaceContainer
			.css({
				'height': $(window).innerHeight() - $('.theme-h1-container').eq(0).outerHeight() - ( $elms.commentView.is(':visible') ? $elms.commentView.outerHeight() + 10 : 0 ) - ( $elms.wasabiView.is(':visible') ? $elms.wasabiView.outerHeight() + 10 : 0 ) - $elms.workspaceSearch.outerHeight() - heightBreadcrumb - 20 - 15,
				'margin-top': 10
			})
		;
		$elms.brosList
			.css({
				'height': $workspaceContainer.innerHeight() - $elms.sitemapParent.outerHeight()
			})
		;
		$elms.preview
			.css({
				'height': $workspaceContainer.parent().outerHeight() - $elms.pageinfo.outerHeight() - heightBreadcrumb
			})
		;

	}

	// 初期化処理開始
	$(window).on('load', function(){
		init();
		$(window).on('resize', function(){
			onWindowResize();
		});

	});

})( window.parent.main );
