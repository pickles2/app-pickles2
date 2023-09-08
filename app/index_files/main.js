new (function($, window){

	// ↓自署名証明書のSSLを許容する設定
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

	// pickles
	var _this = this;
	window.main = this;
	window.px = this;//old: window.px は window.main に改名されました。
	this.px2style = window.px2style;

	// node.js
	this.process = process;

	this.cwd = process.cwd();

	// NW.js
	this.nw = nw;
	this.nwWindow = nw.Window.get();

	// jQuery
	this.$ = $;

	// utils
	var _utils79 = require('utils79');
	this.utils79 = _utils79;
	var _utils = require('./index_files/_utils.node.js');
	this.utils = _utils;

	// package.json
	var _packageJson = require('../package.json');
	this.packageJson = _packageJson;

	// data
	var _path_data_dir = (function(){
		var rtn = (process.env.HOME||process.env.LOCALAPPDATA) + '/'+_packageJson.extra.dataDirName;
		var tmp_path_data_dir = localStorage.getItem("realpath_data_dir");
		if( tmp_path_data_dir && _utils79.is_dir(tmp_path_data_dir) ){
			return tmp_path_data_dir;
		}
		return rtn;
	})();



	/**
	 * アプリケーションのバージョン情報を取得する。
	 *
	 * バージョン番号発行の規則は、 Semantic Versioning 2.0.0 仕様に従います。
	 * - [Semantic Versioning(英語原文)](http://semver.org/)
	 * - [セマンティック バージョニング(日本語)](http://semver.org/lang/ja/)
	 *
	 * *[ナイトリービルド]*<br />
	 * バージョン番号が振られていない、開発途中のリビジョンを、ナイトリービルドと呼びます。<br />
	 * ナイトリービルドの場合、バージョン番号は、次のリリースが予定されているバージョン番号に、
	 * ビルドメタデータ `+dev` を付加します。
	 * 通常は、プレリリース記号 `alpha` または `beta` を伴うようにします。
	 * - 例：1.0.0-beta.12+dev (=1.0.0-beta.12リリース前のナイトリービルド)
	 *
	 * @return string バージョン番号を示す文字列
	 */
	this.getVersion = function(){
		return _packageJson.version;
	}

	// filesystem
	var _fs = require('fs');
	this.fs = _fs;
	var _fsEx = require('fs-extra');
	this.fsEx = _fsEx;
	var _path = require('path');
	this.path = _path;
	// var _git = require('nodegit');
	// this.git = _git;
	var _mkdirp = require('mkdirp');
	this.mkdirp = _mkdirp;
	var _glob = require('glob');
	this.glob = _glob;
	var _SearchInDir = require('search-in-directory');
	this.SearchInDir = _SearchInDir;

	// versioning
	var _semver = require('semver');
	this.semver = _semver;

	// template engines
	var _twig = require('twig');
	this.twig = _twig;
	var _ejs = require('ejs');
	this.ejs = _ejs;
	var _csv = require('csv');
	this.csv = _csv;

	// Pickles 2
	var _px2agent = require('px2agent');
	this.px2agent = _px2agent;
	var _px2dtLDA = new (require('px2dt-localdata-access'))(
		_path_data_dir,
		{
			"updated": function(updatedEvents){
				console.log('Px2DTLDA Data Updated:', updatedEvents);
			}
		}
	);
	this.px2dtLDA = _px2dtLDA;

	// broccoli-html-editor
	var _BroccoliStuleGuideGen = require('broccoli-styleguide-generator');
	this.BroccoliStuleGuideGen = _BroccoliStuleGuideGen;

	// DOM Parser for NodeJS
	var _cheerio = require('cheerio');
	this.cheerio = _cheerio;

	// Keyboard Util
	var _Keypress = {};
	this.Keypress = _Keypress;


	// var _OS = require("os");
	// console.log(_OS.freemem());//<-free memory
	// console.log(_OS.totalmem());//<-total memory
	// console.log(_OS.platform());//<-darwin
	// console.log(_OS.hostname());//<-domain

	var _platform = (function(){
		var platform = 'unknown';
		console.log('process.platform:', process.platform);
		if(process.platform == 'win32'){return 'win';}
		if(process.platform == 'darwin'){return 'mac';}
		if(process.platform == 'linux'){return 'linux';}
		console.log('unknown platform:', process.platform);
		return platform;
	})();
	console.log('platform: '+_platform);
	var _current_app = null;
	var _selectedProject = null;
	var _pj = null;

	var _php = require('phpjs');
	this.php = _php;

	var _it79 = require('iterate79');
	this.it79 = _it79;

	var _nw_gui = require('nw.gui');
	var _appName = _packageJson.window.title;
	window.document.title = _appName;

	this.progress = new require('./index_files/pickles.progress.js').init(this, $);

	this.textEditor = window.textEditor;

	this.nodePhpBin = {};//init内で初期化される

	var $header, $statusbar, $main, $contents, $shoulderMenu;
	var _menu = [];

	this.cookie = $.cookie;

	// Auto Updater
	var updater = (function(px){
		var Updater = require('./index_files/updater.js');
		return new Updater(px, $);
	})(this);
	this.updater = updater;

	// WASABI API Client
	this.wasabiClient = null;

	// Subwindows
	var subWindows = [];

	/**
	 * アプリケーションの初期化
	 */
	function init(callback){
		_it79.fnc({},
			[
				function(it1){
					// updater: Installer Mode
					if( updater.isInstallerMode() ) {
						updater.doAsInstallerMode();
						return;
					}
					it1.next();
				},
				function(it1){
					// データディレクトリを初期化
					$('.splash__message p').text('データファイルを初期化中...');
					main.px2dtLDA.initDataDir(function(result){
						if( !result ){
							console.error('FAILED to Initialize data directory. - '+_path_data_dir);
						}
						main.px2dtLDA.db.commands.php = main.px2dtLDA.db.commands.php || '';
						main.px2dtLDA.db.commands.git = main.px2dtLDA.db.commands.git || '';
						main.px2dtLDA.db.language = main.px2dtLDA.db.language || 'ja';
						main.px2dtLDA.db.appearance = main.px2dtLDA.db.appearance || null;
						main.px2dtLDA.db.apps.texteditor = main.px2dtLDA.db.apps.texteditor || '';
						main.px2dtLDA.db.apps.texteditorForDir = main.px2dtLDA.db.apps.texteditorForDir || '';
						main.px2dtLDA.db.network.preview = main.px2dtLDA.db.network.preview || {};
						main.px2dtLDA.db.network.preview.port = main.px2dtLDA.db.network.preview.port || _packageJson.extra.network.preview.port;
						main.px2dtLDA.db.network.preview.accessRestriction = main.px2dtLDA.db.network.preview.accessRestriction || "loopback";
						main.px2dtLDA.db.network.appserver = main.px2dtLDA.db.network.appserver || {};
						main.px2dtLDA.db.network.appserver.port = main.px2dtLDA.db.network.appserver.port || _packageJson.extra.network.appserver.port;

						main.px2dtLDA.db.extra = main.px2dtLDA.db.extra || {};
						main.px2dtLDA.db.extra.px2dt = main.px2dtLDA.db.extra.px2dt || {};
						main.px2dtLDA.db.extra.px2dt.checkForUpdate = main.px2dtLDA.db.extra.px2dt.checkForUpdate || 'autoCheck';

						main.px2dtLDA.save(function(){
							it1.next();
						});
					});
				},
				function(it1){
					// db.json の読み込み
					$('.splash__message p').text('データを読み込んでいます...');
					main.load(function(){
						setTimeout(function(){
							it1.next();
						}, 500);
						return;
					});
					return;
				},
				function(it1){
					if( main.getAppearance() == 'dark' ){
						$('html').addClass('px2-darkmode');
						document.querySelector('.px2style-theme').href = './common/px2style/dist/themes/darkmode.css';
					}
					setTimeout(function(){
						it1.next();
					}, 500);
				},
				function(it1){
					// Command Queue をセットアップ
					$('.splash__message p').text('Command Queue をセットアップ...');
					var CommandQueue = require('./index_files/cmdQueueCtrl.js');
					_this.commandQueue = new CommandQueue(_this, window);
					it1.next();
				},
				function(it1){
					// node-webkit の標準的なメニューを出す
					$('.splash__message p').text('メニューをセットアップ...');

					(function(){
						var win = _nw_gui.Window.get();
						var nativeMenuBar = new _nw_gui.Menu({ type: "menubar" });
						try {
							nativeMenuBar.createMacBuiltin( _appName );
							win.menu = nativeMenuBar;
							// win.menu.append(new _nw_gui.MenuItem({
							// 	type: "normal",
							// 	label: 'Item 1',
							// 	click: function() {
							// 		console.log('Click on Item 1');
							// 	}
							// }));
						} catch (ex) {
							console.log(ex.message);
						}

						// ↓Macのメニューバーの右側に並ぶメニューのこと
						// var tray = new _nw_gui.Tray({ icon: './common/images/appicon.png' });
						// tray.title = 'Love Tray';
						// tray.tooltip = 'Love Tooltip';

					})();

					main.log( 'Application start;' );
					it1.next();
					return;
				},
				function(it1){
					// 各国語言語切替機能のロード
					$('.splash__message p').text('各国語言語切替機能のロード...');
					var LangBank = require('langbank');
					main.lb = new LangBank( require('path').resolve('./app/common/language/language.csv'), function(){
						main.lb.setLang(main.px2dtLDA.getLanguage());
						// console.log(main.lb.get('welcome'));
						it1.next();
					}); // new LangBank()
					return;
				},
				function(it1){
					// ヒント機能のロード
					$('.splash__message p').text('ヒントのロード...');
					var Px2Hint = require('./index_files/pickles.hint.js');
					main.hint = new Px2Hint( px, require('path').resolve('./app/common/language/hint.csv'), function(){
						main.hint.setLang(main.px2dtLDA.getLanguage());
						it1.next();
					}); // new LangBank()
					return;
				},
				function(it1){
					// File Watcher をロード
					$('.splash__message p').text('File Watcher をロード...');
					var FileWatcher = require('./index_files/pickles.watcher.js');
					main.watcher = new FileWatcher( px );
					it1.next();
					return;
				},
				function(it1){
					// Custom Console Extensions Watcher をロード
					$('.splash__message p').text('Custom Console Extensions Watcher をロード...');
					var CceWatcher = require('./index_files/pickles.cceWatcher.js');
					main.cceWatcher = new CceWatcher( px );
					main.cceWatcher.start();
					it1.next();
					return;
				},
				function(it1){
					$('.splash__message p').text('composer パッケージをチェックしています...');
					var ComposerInstallChecker = require('./index_files/pickles.composerInstallChecker.js');
					main.composerInstallChecker = new ComposerInstallChecker( px, function(){
						it1.next();
					});
					return;
				},
				function(it1){
					// CSS拡張
					$('#px2-appearance-base')
						.html(
							':root {'
							+'--px2-main-color: '+_packageJson.extra.colors.defaultKeyColor+';'
							+'}'
						);
					it1.next();
					return;
				},
				function(it1){
					// setup PHP command line environment
					$('.splash__message p').text('PHPラッパーをロードしています...');
					main.NodePhpBin = require('./index_files/node-php-bin/node-php-bin.js');
					main.nodePhpBinOptions = {
						// パスが通った php コマンドで初期化
						'bin': 'php' ,
						'ini': null
					};
					if( main.px2dtLDA.db.commands && main.px2dtLDA.db.commands['php'] ){
						main.nodePhpBinOptions = {
							'bin': main.px2dtLDA.db.commands['php'] ,
							'ini': null
						};
					}
					main.nodePhpBin = main.NodePhpBin.get(main.nodePhpBinOptions);
					it1.next();
					return;
				},
				function(it1){
					// メニュー設定
					$('.splash__message p').text('メニューを設定しています...');
					var gmenu = require('./index_files/globalmenu.js');
					_menu = new gmenu(px);
					it1.next();
				},
				function(it1){
					// 開発者のための隠しコマンド
					// Ctrl + Opt + R で トップフレームを再読込する
					$('.splash__message p').text('キーボードショートカット...');
					$(window).on('keypress', function(e){
						// console.log(e);
						if(e.keyCode == 18 && e.ctrlKey && e.altKey ){
							window.location.href='./index.html';
						}
					});
					it1.next();
				},
				function(it1){
					// ウィンドウ位置とサイズの初期化
					$('.splash__message p').text('ウィンドウ位置とサイズの初期化...');
					var db = main.px2dtLDA.getData();
					var winPosition = {
						"x": 0,
						"y": 0,
						"width": window.screen.width,
						"height": window.screen.height
					};
					try{
						if( typeof(db.extra.px2dt.windowPosition) === typeof({}) ){
							winPosition = db.extra.px2dt.windowPosition;
						}
						// 位置ずれ補正
						if( winPosition.width < 100 ){
							winPosition.width = 100;
						}
						if( winPosition.height < 100 ){
							winPosition.height = 100;
						}
						if( winPosition.x > window.screen.width - 50 || winPosition.y > window.screen.height - 50 ){
							winPosition.x = 0;
							winPosition.y = 0;
						}
					}catch(e){}
					main.nwWindow.moveTo(winPosition.x, winPosition.y);
					main.nwWindow.resizeTo(winPosition.width, winPosition.height);

					it1.next();
					return;
				},
				function(it1){
					// セッティング状態をチェックする 
					$('.splash__message p').text('コマンドの設定をチェックしています...');
					var SettingConditionChecker = require('./index_files/settingConditionChecker.js');
					var settingConditionChecker = new SettingConditionChecker(_this, window);
					settingConditionChecker.check(() => {
						it1.next();
					});
				},
				function(it1){
					// アプリの更新を自動チェック
					if( main.px2dtLDA.db.extra.px2dt.checkForUpdate == 'autoCheck' ){
						main.updater.checkNewVersion(function(error, newVersionExists, manifest){
							setTimeout(function(){
								if( error ){
									console.error('最新版の情報を取得できませんでした。通信状態のよい環境で時間をあけて再度お試しください。');
									return;
								}
								if ( newVersionExists ) {
									if( !confirm('新しいバージョンが見つかりました。'+"\n"+'・最新バージョン: '+manifest.version+"\n"+'・お使いのバージョン: '+main.packageJson.version+"\n"+'更新しますか？') ){
										return;
									}
									if( !confirm('アプリケーションの更新には、数分かかることがあります。'+"\n"+'更新中には作業は行なえません。'+"\n"+'いますぐ更新しますか？') ){
										return;
									}

									// 更新を実行する
									main.updater.update(manifest);
								}
							}, 3000);
						});
						it1.next();
						return;
					}
					it1.next();
				},
				function(it1){
					// HTMLコードを配置
					$('body').html( document.getElementById('template-outer-frame').innerHTML );
					px2styleV2Header.init({"current":""});
					it1.next();
				},
				function(it1){
					// WASABI API Client
					var wasabiClient = require('./index_files/wasabi/wasabi-client.js');
					_this.wasabiClient = new wasabiClient(_this);
					it1.next();
				},

				function(it1){
					callback();
				}

			]
		);
		return;
	}

	/**
	 * APP_KEY を取得する
	 * 生成されていない場合は、生成して記憶します。
	 */
	this.getAppKey = function(){
		// あれば取得して返す
		var appkey = localStorage.getItem('app_key');
		if( appkey && appkey.length ){
			return this.utils79.base64_decode(appkey);
		}

		// なければ生成して返す
		appkey = this.utils79.md5((new Date().getTime())+'-'+Math.floor( Math.random() * 1000000 ));
		localStorage.setItem('app_key', this.utils79.base64_encode(appkey));
		return this.utils79.base64_decode(localStorage.getItem('app_key'));
	}

	/**
	 * DBをロードする
	 */
	this.load = function(callback){
		callback = callback || function(){};
		// db.json の読み込み・初期化
		main.px2dtLDA.load(function(){
			callback();
		})
		return;
	}

	/**
	 * DBを保存する
	 */
	this.save = function(callback){
		callback = callback || function(){};

		if( updater.isInstallerMode() ) {
			// インストールモード時には保存しない。
			// 上書きして破壊してしまう恐れがあるため。
			callback();
			return;
		}

		var db = main.px2dtLDA.getData();
		var winPosition = {
			"x": main.nwWindow.x,
			"y": main.nwWindow.y,
			"width": main.nwWindow.window.outerWidth,
			"height": main.nwWindow.window.outerHeight
		};

		db.extra = db.extra || {};
		db.extra.px2dt = db.extra.px2dt || {};
		db.extra.px2dt.windowPosition = winPosition;
		main.px2dtLDA.setData(db);

		main.px2dtLDA.save(function(){
			// プロジェクト別のアプリケーションデータを削除する
			var pjAll = main.px2dtLDA.getProjectAll();
			var pjAllIds = {};
			for(let idx in pjAll){
				pjAllIds[pjAll[idx].id] = true;
			}
			var baseDir = main.px2dtLDA.getAppDataDir('px2dt');
			var filelist = main.fs.readdirSync(baseDir);
			for(let idx in filelist){
				var filename = filelist[idx];
				var filenamePjId = filename.replace(/\.[a-zA-Z0-9]+$/g, '');
				try {
					if( filenamePjId == 'wasabi' ){
						continue;
					}
					if( !pjAllIds[filenamePjId] ){
						main.fs.unlinkSync(baseDir+'/'+filename);
					}
				} catch (e) {
					console.error(e);
				}
			}

			callback();
		});
		return;
	}

	/**
	 * プラットフォーム名を得る。
	 * Pickles 2 が動作しているPCのOS名。
	 */
	this.getPlatform = function(){
		return _platform;
	}

	/**
	 * ローカルのデータディレクトリのパスを得る。
	 */
	this.getDataDir = function(){
		return _path_data_dir;
	}

	/**
	 * ローカルのデータディレクトリを開く
	 */
	this.openDataDir = function(){
		return main.utils.openURL( _path_data_dir );
	}

	/**
	 * プロジェクト一覧を取得する
	 */
	this.getProjectList = function(callback){
		callback = callback || function(){};
		var projects = this.px2dtLDA.getProjectAll();
		// var rtn = main.px2dtLDA.db.projects;
		callback(projects);
		return;
	}

	/**
	 * プロジェクトを追加する
	 */
	this.createProject = function(projectInfo, opt){
		projectInfo = projectInfo||{};
		opt = opt||{};
		opt.success = opt.success||function(){};
		opt.error = opt.error||function(){};
		opt.complete = opt.complete||function(){};

		if( typeof(projectInfo.home_dir) != typeof('') || !projectInfo.home_dir.length ){
			projectInfo.home_dir = '';
		}
		if( typeof(projectInfo.entry_script) != typeof('') || !projectInfo.entry_script.length ){
			projectInfo.entry_script = '';
		}

		var result = this.validateProjectInfo(projectInfo);
		if( result.isError ){
			opt.error(result.errorMsg);
			opt.complete();
			return false;
		}

		var result = main.px2dtLDA.addProject( projectInfo );
		if( result === false ){
			opt.error({'common': 'Unknown ERROR'});
			opt.complete();
			return false;
		}
		main.save(function(){
			opt.success();
			opt.complete();
		});

		return true;
	}

	/**
	 * プロジェクト情報の入力値を検証する
	 */
	this.validateProjectInfo = function(projectInfo){
		var result = {
			isError: false,
			errorMsg: {}
		};

		// name
		if( typeof(projectInfo.name) != typeof('') || !projectInfo.name.length ){
			result.errorMsg.name = 'name は必須項目です。 name is required.';
			result.isError = true;
		}

		// path
		if( typeof(projectInfo.path) != typeof('') || !projectInfo.path.length ){
			result.errorMsg.path = 'path は必須項目です。 path is required.';
			result.isError = true;
		}else if( !main.utils79.is_dir(projectInfo.path) ){
			result.errorMsg.path = '存在するディレクトリを選択してください。 path is required as a existed directory path.';
			result.isError = true;
		}else if( !main.utils79.is_file(projectInfo.path+'/composer.json') ){
			var path_filelist = require('fs').readdirSync(projectInfo.path);
			var filelist_length = 0;
			for(var i in path_filelist){
				switch( path_filelist[i] ){
					case '.DS_Store':
					case 'Thumbs.db':
					case 'composer.json':
						break;
					default:
						filelist_length ++;
						break;
				}
			}
			if( filelist_length ){
				result.errorMsg.path = '内容が空のディレクトリか、または composer.json が置かれているディレクトリを選択してください。';
				result.isError = true;
			}
		}
	
		return result;
	}

	/**
	 * プロジェクト情報を更新する
	 */
	this.updateProject = function(projectId, projectInfo){
		if( typeof(projectId) !== typeof(0) ){
			return false;
		}
		projectInfo = JSON.parse( JSON.stringify( projectInfo ) );

		var result = this.validateProjectInfo(projectInfo);
		if( result.isError ){
			return false;
		}

		main.px2dtLDA.db.projects[projectId] = projectInfo;
		return true;
	}

	/**
	 * プロジェクトを削除する
	 */
	this.deleteProject = function(projectId, callback){
		callback = callback || function(){};
		var result = main.px2dtLDA.removeProject( projectId );
		this.deselectProject();
		this.save(function(){
			callback();
		});
		return true;
	}

	/**
	 * プロジェクトを選択する
	 */
	this.selectProject = function( num, callback ){
		callback = callback||function(){}
		if( typeof(num) != typeof(0) ){
			var errorMsg = '[ERROR] main.selectProject() given a non number parametor; Given value is "'+num+'" as a ' + typeof(num) + '.';
			main.log( errorMsg );
			console.error( errorMsg );
			alert(errorMsg);
			callback();
			return false;
		}
		_selectedProject = num;

		main.log( 'selectProject(' + num + ')' );
		this.loadProject(function(){
			main.log( 'project "' + _pj.get('name') + '" is loaded.' );
			callback();
		});
		return true;
	}

	/**
	 * 選択されたプロジェクトをロードする
	 */
	this.loadProject = function( callback ){
		callback = callback||function(){}
		if( typeof(_selectedProject) != typeof(0) ){
			main.log( '[ERROR] FAILED to selectProject(' + typeof(num) + ')' );
			return false;
		}

		// ファイル監視の停止
		main.watcher.stop();

		// alert(num);
		_pj = new (require('./index_files/pickles.project.js'))(
			window,
			this,
			main.px2dtLDA.db.projects[_selectedProject],
			_selectedProject,
			function(){
				// ファイル監視を開始
				main.watcher.start(_pj);

				console.log( 'project "' + _pj.get('name') + '" is reloaded.' );

				// アピアランスを反映する
				var $appearance = $('#px2-appearance');
				var status = _pj.status();
				if( status && status.appearance && status.appearance.main_color ){
					$appearance.html(':root {--px2-main-color:' + status.appearance.main_color + ';}');
				}else{
					$appearance.html('');
				}

				callback();
			}
		);
		return true;
	}

	/**
	 * プロジェクトの選択を解除する
	 */
	this.deselectProject = function(){
		main.watcher.stop(); // ファイル監視の停止
		_this.closeAllSubWindows(); // サブウィンドウをすべて閉じる
		_selectedProject = null;
		_pj = null;
		$('#px2-appearance').html('');
		return true;
	}

	/**
	 * 選択中のプロジェクトの情報を得る
	 */
	this.getCurrentProject = function(){
		if( _selectedProject === null ){
			return null;
		}
		return _pj;
	}

	/**
	 * コマンドのパスを取得する
	 */
	this.cmd = function(cmd){
		if( cmd == 'composer' ){
			return _path_data_dir+'/commands/composer/composer.phar';
		}
		if( cmd == 'open' ){
			if(_platform=='win'){
				return 'explorer';
			}
			if(_platform=='linux'){
				return 'xdg-open';
			}
		}
		if( main.px2dtLDA.db.commands && main.px2dtLDA.db.commands[cmd] ){
			return main.px2dtLDA.db.commands[cmd];
		}
		if( cmd == 'php' ){
			return this.nodePhpBin.getPath();
		}
		return cmd;
	}

	/**
	 * composerを実行する
	 * node-php-bin の PHP などを考慮して、
	 * -c, -d オプションの解決を自動的にやっている前提で、
	 * composer コマンドを実行します。
	 * @param  {Array}  cmd  `php`, `composer` を含まないコマンドオプションの配列
	 * @param  {Object} opts [description]
	 * @return {[type]}      [description]
	 */
	this.execComposer = function( cmd, opts ){
		opts = opts||{};
		opts.success = opts.success||function(){};
		opts.error = opts.error||function(){};
		opts.complete = opts.complete||function(){};
		if( typeof(cmd) == typeof('') ){
			cmd = [cmd];
		}
		cmd.unshift(main.cmd('composer'));
		main.nodePhpBin.script(
			cmd ,
			{
				'cwd': opts.cwd
			} ,
			{
				'success': opts.success,
				'error': opts.error,
				'complete': opts.complete
			}
		);
		return this;
	}

	/**
	 * DBデータまるごと取得
	 */
	this.getDb = function(){
		return main.px2dtLDA.getData();
	}


	/**
	 * ブラウザで開く
	 */
	this.openInBrowser = function(){
		var px = this;
		var main = this;

		// 外部プレビューサーバーの設定があるか調べる
		var pj = main.getCurrentProject();
		if(pj){
			var px2dtLDA_Pj = main.px2dtLDA.project(pj.projectId);
			var external_preview_server_origin = px2dtLDA_Pj.getExtendedData('external_preview_server_origin');
			if( typeof(external_preview_server_origin)==typeof('') && external_preview_server_origin.match(/^https?\:\/\//i) ){
				// 外部プレビューサーバーが設定されていたら、
				// 内蔵サーバーの起動はせず、ブラウザを呼び出す。
				main.utils.openURL( main.preview.getUrl() );
				return;
			}
		}

		this.preview.serverStandby(function(result){
			if(result === false){
				main.message('プレビューサーバーの起動に失敗しました。');
				return;
			}
			main.utils.openURL( main.preview.getUrl() );
		});
		return;
	}

	/**
	 * パブリッシュされたサイトをブラウザで開く
	 */
	this.openAppInBrowser = function(){
		var px = this;
		var main = this;

		// 外部プレビューサーバーの設定があるか調べる
		var pj = main.getCurrentProject();
		if(pj){
			var px2dtLDA_Pj = main.px2dtLDA.project(pj.projectId);
			var external_app_server_origin = px2dtLDA_Pj.getExtendedData('external_app_server_origin');
			if( typeof(external_app_server_origin)==typeof('') && external_app_server_origin.match(/^https?\:\/\//i) ){
				// 外部プレビューサーバーが設定されていたら、
				// 内蔵サーバーの起動はせず、ブラウザを呼び出す。
				main.utils.openURL( main.appPreview.getUrl() );
				return;
			}
		}

		this.appPreview.serverStandby(function(result){
			if(result === false){
				main.message('プレビューサーバーの起動に失敗しました。');
				return;
			}
			main.utils.openURL( main.appPreview.getUrl() );
		});
		return;
	}

	/**
	 * ヘルプページを開く
	 */
	this.openHelp = function(){
		main.utils.openURL( 'https://pickles2.pxt.jp/manual/' );
		return;
	}

	/**
	 * 新しいサブウィンドウでURLを開く
	 */
	this.openInNewSubWindow = function(url){
		var newWin = window.open(url);
		subWindows.push(newWin);
		return;
	}

	/**
	 * サブウィンドウをすべて閉じる
	 */
	this.closeAllSubWindows = function(){
		for(var idx in subWindows){
			subWindows[idx].close();
		}
		return;
	}

	/**
	 * 外部テキストエディタで開く
	 */
	this.openInTextEditor = function( path ){
		var pathEditor = '';
		var targetType = null;
		var externalAppName;
		if( this.utils.isDirectory(path) ){
			targetType = 'dir';
			externalAppName = 'texteditorForDir';
			pathEditor = this.getDb().apps.texteditorForDir;
		}else if( main.utils.isFile(path) ){
			targetType = 'file';
			externalAppName = 'texteditor';
			pathEditor = this.getDb().apps.texteditor;
		}else{
			alert('編集対象のパスが存在しません。'+"\n"+path);
			console.error('ERROR: '+'編集対象のパスが存在しません。'+"\n"+path);
			return false;
		}

		var msgSudgestSetting = _appName+'設定 メニューから、アプリケーション "外部テキストエディタ'+(targetType=='dir'?'(ディレクトリを開く)':'')+'" を設定してください。';
		if( !this.getDb().apps || ( !pathEditor.length && !this.utils.isDirectory(pathEditor) && !this.utils.isFile(pathEditor) ) ){
			alert('外部テキストエディタが設定されていないか、存在しません。' + "\n" + msgSudgestSetting);
			console.error('ERROR: '+'外部テキストエディタが設定されていないか、存在しません。');
			return false;
		}
		main.px2dtLDA.startApp(externalAppName, {PATH: path});
		return true;
	}

	/**
	 * 外部Gitクライアントで開く
	 */
	this.openInGitClient = function( path ){
		var pathEditor = '';
		var targetType = null;
		var externalAppName;
		if( this.utils.isDirectory(path) ){
			targetType = 'dir';
			externalAppName = 'gitClient';
			pathEditor = this.getDb().apps.gitClient;
		}else{
			alert('編集対象のパスが存在しません。'+"\n"+path);
			console.error('ERROR: '+'編集対象のパスが存在しません。'+"\n"+path);
			return false;
		}

		var msgSudgestSetting = _appName+'設定 メニューから、アプリケーション "外部Gitクライアント" を設定してください。';
		if( !this.getDb().apps || ( !pathEditor.length && !this.utils.isDirectory(pathEditor) && !this.utils.isFile(pathEditor) ) ){
			alert('外部Gitクライアントが設定されていないか、存在しません。' + "\n" + msgSudgestSetting);
			console.error('ERROR: '+'外部Gitクライアントが設定されていないか、存在しません。');
			return false;
		}
		main.px2dtLDA.startApp(externalAppName, {PATH: path});
		return true;
	}

	/**
	 * ターミナルで開く
	 */
	this.openInTerminal = function( path ){
		if( !this.utils.isDirectory(path) && !main.utils.isFile(path) ){
			alert('編集対象のパスが存在しません。'+"\n"+path);
			console.error('ERROR: '+'編集対象のパスが存在しません。'+"\n"+path);
			return false;
		}

		if(_platform=='win'){
			main.utils.exec( 'start cmd /K cd "'+ path + '"' );
		}else{
			var termProgram = 'Terminal';
			try {
				if( process.env.TERM_PROGRAM ){
					termProgram = process.env.TERM_PROGRAM;
				}
			} catch (e) {
			}

			main.utils.spawn(
				main.cmd('open'),
				[
					'-a',
					termProgram,
					path
				],
				{}
			);
		}
		return true;
	}


	/**
	 * ループバックIPアドレスかどうか調べる
	 */
	this.isLoopbackIp = function( ip ){
		switch( ip ){
			case '127.0.0.1':
			case '::127.0.0.1':
			case '::ffff:127.0.0.1':
			case '::1':
			case '0::1':
			case '0000::0001':
			case '0:0:0:0:0:0:0:1':
			case '0000:0000:0000:0000:0000:0000:0000:0001':
				// ホワイトリスト: ローカルIPは通す
				// ↑もっといい書き方ないか？
				return true;
				break;
			default:
				return false;
				break;
		}
		return false;
	}

	/**
	 * サブアプリケーション
	 */
	this.subapp = function(appName){
		var $cont = $('.contents').eq(0);
		$cont.html('<p style="text-align:center; margin: 4em auto;">Loading...</p>');

		if( typeof(_selectedProject) != typeof(0) ){
			appName = '';
			main.commandQueue.server.setCurrentDir( 'default', process.cwd() ); // current dir を初期化
		}else if( !appName && typeof(_selectedProject) == typeof(0) ){
			appName = 'fncs/home/index.html';
		}

		if( appName ){
			px2styleV2Header.init({"current":appName});
			this.loadProject(function(){ // プロジェクトオブジェクトをリロードする。
				var projectStatus = _pj.status();
				// console.log(projectStatus);
				if( !projectStatus.isPxStandby ){
					switch(appName){
						case 'fncs/home/index.html':
						case 'fncs/config/index.html':
						case 'fncs/composer/index.html':
						case 'fncs/git/index.html':
							// プロジェクトの準備が整っていなかったら、
							// これ以外の画面には行けない。
							break;
						default:
							appName = 'fncs/home/index.html';
							break;
					}
				}
				$cont
					.html('')
					.append(
						$('<iframe>')
							.attr('src', './'+appName)
					)
				;

				_current_app = appName;
				layoutReset();
				$contents.scrollTop(0);
			});
			return;

		}else{
			// プロジェクト選択画面を描画
			px2styleV2Header.init({"current":""});
			$cont.html( $('script#template-selectProject-page').html() );
			$cont.find('.cont_top_footer')
				.html('')
				.append( $('<p>').text(_packageJson.extra.credit) )
				.append( $('<p>').text('version: ' + _this.getVersion()) )
			;
			_this.statusbar.set([], []);
			_this.closeAllSubWindows(); // サブウィンドウをすべて閉じる

			this.getProjectList(function(list){
				if( list.length ){
					var $ul = $('<div class="list-group">');
					for( var i = 0; i < list.length; i++ ){
						$ul.append(
							$('<a class="list-group-item">')
								.attr({
									'href': 'javascript:;',
									'data-name': list[i].getName(),
									'data-path': list[i].getPath(),
									'data-num': i
								})
								.on('click', function(){
									var timer = setTimeout(function(){
										main.progress.start({"showProgressBar":true, 'blindness':true});
									}, 1000);
									var listNumb = $(this).attr('data-num');
									listNumb = Number(listNumb);
									main.selectProject( listNumb, function(){
										clearTimeout(timer);
										main.progress.close();
										main.subapp();
									} );
								} )
								.text( list[i].getName() )
						);
					}

					$('.cont_project_list', $cont)
						.html('')
						.append($ul)
					;

					(function(){
						var filterTimer;
						var $list = $('.cont_project_list a', $cont);
						var filterUpdate = function(){
							clearTimeout(filterTimer);
							filterTimer = setTimeout(function(){
								var keyword = $('.cont_project-list-filter input[name=cont_project-list-filter__keyword]').val();
								var keywordLowerCase = keyword.toLowerCase();
								$list.each(function(num){
									var name = $(this).attr('data-name');
									var nameLowerCase = name.toLowerCase();
									if( !keywordLowerCase.length ){
										$(this).show();
									}else if( nameLowerCase.match(keywordLowerCase) ){
										$(this).show();
									}else{
										$(this).hide();
									}
								});
							}, 300);
						};
						$('.cont_project-list-filter form')
							.on('submit', function(){
								filterUpdate(); return false;
							})
						;
						$('.cont_project-list-filter input[name=cont_project-list-filter__keyword]')
							.on('keyup', function(){
								filterUpdate();
							})
							.on('change', function(){
								filterUpdate();
							})
						;
						$('.cont_project-list-filter button')
							.on('click', function(){
								$('.cont_project-list-filter input[name=cont_project-list-filter__keyword]').val('');
								filterUpdate();
							})
						;
					})();

				}else{
					$('.cont_project-list-filter').hide();
					$('.cont_project_list', $cont)
						.html('<p>プロジェクトは登録されていません。</p>')
					;
				}
				_current_app = appName;
				layoutReset();
				$contents.scrollTop(0);
			});
			return;
		}
	}


	/**
	 * ドロップ操作を無効化する
	 * @param  {element} $elm element object.
	 * @return {[type]}     [description]
	 */
	this.cancelDrop = function($elm){
		$($elm)
			.bind( 'drop', function(e){
				// ドロップ操作を無効化
				// console.log(456);
				e.preventDefault();
				e.stopPropagation();
				return false;
			} )
			.bind( 'dragenter', function(e){
				// ドロップ操作を無効化
				// console.log(45645);
				e.preventDefault();
				e.stopPropagation();
				return false;
			} )
			.bind( 'dragover', function(e){
				// ドロップ操作を無効化
				// console.log(23456);
				e.preventDefault();
				e.stopPropagation();
				return false;
			} )
		;
		return $elm;
	}

	/**
	 * ブラウザ(OS)のライトモード/ダークモードを判定
	 */
	this.getAppearance = function(){
		let rtn = 'light';
		if( main.px2dtLDA.db.appearance == 'light' || main.px2dtLDA.db.appearance == 'dark' ){
			return main.px2dtLDA.db.appearance;
		}
		return 'light'; // TODO: ダークモードが開発中のため、デフォルトはライトモード。ダークモード成立後には、デフォルトはOSの標準に従うようにする。

		try{
			var isOsLightMode = window.matchMedia('(prefers-color-scheme: light)').matches;
			if( !isOsLightMode ){
				rtn = 'dark';
			}
		}catch(e){
			console.error('[ERROR] Failed to check Browser Light Mode.', e);
		}
		return rtn;
	}

	/**
	 * レイアウトをリセット
	 */
	function layoutReset(){
		var cpj = main.getCurrentProject();
		var cpj_s = null;
		if( cpj !== null ){
			cpj_s = cpj.status()
		}
		if(!$shoulderMenu){
			return;
		}

		$('.px2-header__global-menu').html( $('<ul>')
			.append( $('<li>') )
		);
		$shoulderMenu.find('ul').html('');
		_menu.drawGlobalMenu($shoulderMenu, _current_app);

		if( cpj === null ){
			$('.px2-header__id')
				.css({"opacity":0})
			;
		}else{
			$('.px2-header__id')
				.html('')
				.append( $('<div>')
					.text( /* '-> ' + */ cpj.get('name') )
				)
				.css({"opacity":1})
			;
		}

		$('body')
			.css({
				'margin':'0 0 0 0' ,
				'padding':'0 0 0 0' ,
				'width':'auto',
				'height':'auto',
				'min-height':0,
				'max-height':10000,
				'overflow':'hidden'
			})
		;
		$contents
			.css({
				'margin':'0 0 0 0' ,
				'padding':'0 0 0 0' ,
				'position':'fixed' ,
				'left':0 ,
				'top': $header.outerHeight()+0 ,
				'right': 0 ,
				'height': $(window).height() - $header.outerHeight() - $statusbar.outerHeight() - 0
			})
		;
		$contents.find('>iframe')
			.css({
				'height': $contents.innerHeight() - 0
			})
		;
		px2styleV2Header.init({"current":_current_app});
	}

	/**
	 * ログをファイルに出力
	 */
	this.log = function( msg ){
		console.info(msg);
		return main.px2dtLDA.log(msg);
	}

	/**
	 * 診断ツール
	 */
	this.healthCheck = function(){
		var Px2DtHealthCheck = require('px2dt-health-check');
		var $body = $('<div>'
			+'<div class="px2-loading"></div>'
			+'</div>');
		var $result = $('<div>'
			+'<p>次のテキストを選択してコピーするか、<a href="javascript:;">ファイルに保存</a>してください。</p>'
			+'<p>お使いのコンピューター内部の情報を含む場合があります。取り扱いにご注意ください。</p>'
			+'<p><textarea class="form-control" readonly="readonly" style="height: 340px;"></textarea></p>'
			+'</div>');
		var $textarea = $result.find('textarea');

		px2style.modal(
			{
				title: '診断ツール',
				body: $body
			},
			function(){
				var px2DtHealthCheck = new Px2DtHealthCheck();
				px2DtHealthCheck.checkDt(
					_path_data_dir,
					_selectedProject,
					function(result){
						console.info('--- px2dt-health-check - result', result);
						var filename = 'pickles2-debug.json';
						var jsonString = JSON.stringify(result, null, "\t");
						$body.html('').append($result);
						$textarea.val(jsonString);
						$result.find('a').on('click', function(e){
	 						// ファイルとして保存する
							var blob = new Blob([ jsonString ], { "type" : "text/json" });
							if (window.navigator.msSaveBlob) {
								window.navigator.msSaveBlob(blob, filename);

								// msSaveOrOpenBlobの場合はファイルを保存せずに開ける
								window.navigator.msSaveOrOpenBlob(blob, filename);
							} else {
								$(this).attr('download', filename);
								this.href = window.URL.createObjectURL(blob);
							}
						});
					}
				);
			}
		);
	}

	/**
	 * アプリケーションを終了する
	 */
	this.exit = function(){
		console.log( 'main.exit() called.' );
		main.save(function(){
			// if(!confirm('exit?')){return;}
			try {
				nw.App.quit();
			} catch (e) {
				console.error('Unknown Error on main.exit()');
			}
		});
	}

	/**
	 * イベントセット
	 */
	this.nwWindow.on( 'close', function(e){
		main.exit();
	});
	process.on( 'exit', function(e){
		main.log( 'Application exit;' );
	});
	process.on( 'uncaughtException', function(e){
		// alert('ERROR: Uncaught Exception');
		console.error('ERROR: Uncaught Exception');
		console.error(e);
		main.log( 'ERROR: Uncaught Exception' );
		main.log( e );
	} );
	$(window).on( 'resize', function(e){
		layoutReset();
	} );
	// $(document).on( 'dblclick', function(e){
	// 	e.stopPropagation();
	// 	e.preventDefault();
	// 	return false;
	// } );


	/**
	 * アプリケーションを初期化
	 */
	$(window).on('load', function(){
		_it79.fnc({}, [
			function(it, arg){
				// init
				init(function(){
					it.next(arg);
				});
			} ,
			function(it, arg){

				// DOMスキャン
				$header   = $('.px2-header');
				$contents = $('.contents');
				$statusbar   = $('.theme-statusbar');
				// $dialog   = $('<div>');
				$shoulderMenu = $('.px2-header__shoulder-menu');

				$header.css({
					'border-bottom-color': _packageJson.extra.colors.defaultKeyColor,
					'color': _packageJson.extra.colors.defaultKeyColor
				});
				$header.find('.px2-header__px2logo a')
					.html(function(){
						var src = _fs.readFileSync('./app/common/images/logo.svg').toString();
						return src;
					})
					.find('path')
					.attr({'fill':_packageJson.extra.colors.defaultKeyColor})
				;

				it.next(arg);

			} ,
			function(it1, arg){
				// ステータスバー設定
				var statusbar = require('./index_files/statusbar.js');
				_this.statusbar = new statusbar(_this, $statusbar);
				_this.statusbar.set([], []);
				it1.next(arg);
			},
			function(it, arg){
				var $ul = $shoulderMenu.find('ul').hide();
				$shoulderMenu
					.css({
						'width': 50,
						'height': $header.height()
					})
					.on('click', function(){
						if( $ul.css('display') == 'block' ){
							$ul.hide();
							$shoulderMenu
								.css({
									'width':50 ,
									'height':$header.height()
								})
							;

						}else{
							$ul.show().height( $(window).height()-$header.height() );
							$shoulderMenu
								.css({
									'width':'100%' ,
									'height':$(window).height()
								})
							;

						}
					}
				);
				it.next(arg);
			} ,
			function(it, arg){
				_Keypress = new window.keypress.Listener();
				this.Keypress = _Keypress;

				_Keypress.simple_combo("backspace", function(e) {
					// バックスペースキーで編集画面などが閉じてしまう問題の対策。
					// main.message("You pressed backspace");
					switch(e.target.tagName.toLowerCase()){
						case 'input': case 'textarea':
							if(!$(e.target).attr('readonly')){
								return true;
							}
							break;
					}
					e.preventDefault();
					e.stopPropagation();
					return false;
				});
				_Keypress.simple_combo("delete", function(e) {
					// バックスペースキーで編集画面などが閉じてしまう問題の対策。
					// main.message("You pressed delete");
					switch(e.target.tagName.toLowerCase()){
						case 'input': case 'textarea':
							if(!$(e.target).attr('readonly')){
								return true;
							}
							break;
					}
					e.preventDefault();
					e.stopPropagation();
					return false;
				});
				// _Keypress.simple_combo("escape", function(e) {
				// 	// main.message("You pressed escape");
				// 	e.preventDefault();
				// });

				_this.cancelDrop('html, body');

				it.next(arg);
			} ,
			function(it, arg){
				layoutReset();
				main.subapp();

				it.next(arg);
			}
		]);

		window.focus();
	});

	return this;
})(jQuery, window);
