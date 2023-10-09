window.px = window.parent.main;
window.main = window.parent.main;
window.contApp = new (function( main ){
	var _this = this;
	var _pj = main.getCurrentProject();
	var remoteFinder;
	var $elms = {};
	$elms.editor = $('<div>');
	$elms.remoteFinder = $('<div>');
	var mkfile = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/mkfile.js'))(this, main, _pj, $);
	var mkdir = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/mkdir.js'))(this, main, _pj, $);
	var open = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/open.js'))(this, main, _pj, $);
	var copy = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/copy.js'))(this, main, _pj, $);
	var rename = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/rename.js'))(this, main, _pj, $);
	var remove = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/remove.js'))(this, main, _pj, $);

	/**
	 * 初期化
	 */
	$(window).on('load', function(){
		main.it79.fnc({}, [
			function(it){
				if( main.getAppearance() == 'dark' ){
					// --------------------------------------
					// ダークモードスタイルを読み込む
					var $link = document.createElement('link');
					$link.href = '../../common/remote-finder/dist/themes/darkmode.css';
					$link.rel = 'stylesheet';
					$link.className = 'px2-darkmode';
					var $head = document.querySelector('head');
					$head.appendChild($link);
				}
				it.next();
			},
			function(it){
				$elms.remoteFinder = $('#cont_finder');
				remoteFinder = new RemoteFinder(
					document.getElementById('cont_finder'),
					{
						"gpiBridge": function(input, callback){
							// console.log(input);
							_pj.remoteFinder.gpi(input, function(result){
								callback(result);
							});
						},
						"mkfile": mkfile.mkfile,
						"mkdir": mkdir.mkdir,
						"open": open.open,
						"copy": copy.copy,
						"rename": rename.rename,
						"remove": remove.remove
					}
				);
				remoteFinder.init('/', {}, function(){
					console.log('ready.');
				});

				$(window).on('resize', function(){
					onWindowResize();
				});
				onWindowResize();

				it.next();
			},
		]);
	});

	/**
	 * エディター画面を開く
	 */
	this.openEditor = function( pagePath ){

		this.closeEditor();//一旦閉じる

		// プログレスモード表示
		main.progress.start({
			'blindness':true,
			'showProgressBar': true
		});

		var contPath = _pj.findPageContent( pagePath );
		var contRealpath = _pj.get('path')+'/'+contPath;
		var pathInfo = main.utils.parsePath(contPath);
		if( _pj.site.getPathType( pagePath ) == 'dynamic' ){
			var dynamicPathInfo = _pj.site.get_dynamic_path_info(pagePath);
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
	}

	/**
	 * エディター画面を閉じる
	 * 単に閉じるだけです。編集内容の保存などの処理は、editor.html 側に委ねます。
	 */
	this.closeEditor = function(){
		$elms.editor.remove();
		$('body')
			.css({'overflow':'auto'})
		;
		_pj.updateGitStatus();
		return this;
	}


	/**
	 * ファイルのパスを、Pickles 2 の外部パス(path)に変換する。
	 *
	 * Pickles 2 のパスは、 document_root と cont_root を含まないが、
	 * ファイルのパスはこれを一部含んでいる可能性がある。
	 * これを確認し、必要に応じて除いたパスを返却する。
	 */
	this.parsePx2FilePath = function( filepath, callback ){
		var pxExternalPath = filepath;
		var pageInfoAll;
		var path_type;
		var realpath_file = _pj.get('path')+'/'+filepath;
		realpath_file = normalizePath( realpath_file );
		realpath_file = require('path').resolve('/', realpath_file);
		realpath_file = normalizePath( realpath_file );
		main.it79.fnc({}, [
			function(it1){
				_pj.execPx2(
					'/?PX=px2dthelper.get.all',
					{
						complete: function(_pageInfoAll){
							try{
								_pageInfoAll = JSON.parse(_pageInfoAll);
							}catch(e){
								console.error('Failed to parse JSON "pageInfoAll".', e);
							}
							// console.log(_pageInfoAll);
							pageInfoAll = _pageInfoAll;
							it1.next();
						}
					}
				);

			},
			function(it1){
				// 外部パスを求める
				pageInfoAll.realpath_docroot = normalizePath(pageInfoAll.realpath_docroot);
				if( realpath_file.indexOf(pageInfoAll.realpath_docroot) === 0 ){
					pxExternalPath = realpath_file.replace(pageInfoAll.realpath_docroot, '/');
					pxExternalPath = pxExternalPath.split(/[\/]{1,}/).join('/');
				}else{
					pxExternalPath = false;
					it1.next();
					return;
				}
				pageInfoAll.path_controot = normalizePath(pageInfoAll.path_controot);
				if( pxExternalPath.indexOf(pageInfoAll.path_controot) === 0 ){
					pxExternalPath = pxExternalPath.replace(pageInfoAll.path_controot, '/');
					pxExternalPath = pxExternalPath.split(/[\/]{1,}/).join('/');
				}else{
					pxExternalPath = false;
					it1.next();
					return;
				}
				pxExternalPath = normalizePath(require('path').resolve('/', pxExternalPath));
				it1.next();
			},
			function(it1){
				// パスの種類を求める
				// theme_collection, home_dir, contents, or unknown
				path_type = 'unknown';
				var realpath_target = normalizePath(realpath_file);
				var realpath_homedir = normalizePath(pageInfoAll.realpath_homedir);
				var realpath_theme_collection_dir = normalizePath(pageInfoAll.realpath_theme_collection_dir);
				var realpath_docroot = normalizePath(pageInfoAll.realpath_docroot);
				if( realpath_target.indexOf(realpath_theme_collection_dir) === 0 ){
					path_type = 'theme_collection';
				}else if( realpath_target.indexOf(realpath_homedir) === 0 ){
					path_type = 'home_dir';
				}else if( realpath_target.indexOf(realpath_docroot) === 0 && pxExternalPath ){
					path_type = 'contents';
				}
				it1.next();
			},
			function(it1){
				callback(pxExternalPath, path_type);
				it1.next();
			}
		]);
		return;
	}

	/**
	 * Windows風絶対パスをLinux風絶対パスに変換
	 */
	function normalizePath(path){
		path = path.replace(/^[a-zA-Z]\:/, '');
		path = require('path').resolve(path);
		path = path.split(/[\/\\\\]+/).join('/');
		return path;
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
		$elms.remoteFinder
			.css({
				'height': $(window).innerHeight() - $('.container').eq(0).innerHeight() - 10
			})
		;
	}

})( window.parent.main );
