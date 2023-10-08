module.exports = function( window, main, projectInfo, projectId, cbStandby ) {
	var _this = this;
	var px = main;

	this.projectInfo = projectInfo;
	this.projectId = projectId;
	cbStandby = cbStandby||function(){};

	var _config = null;
	var _px2DTConfig = null;
	var _px2proj = null;
	var _path = require('path');
	var _pjError = [];
	var _projectStatus = null;
	var _px2package = {};
	var _gitStatus = null;
	var _cceBroadcastCallback = function( message ){}

	this.appdata = null;
	this.px2proj = null;
	this.site = null;
	this.remoteFinder = null;
	this.wasabiPjAgent = null;

	/**
	 * projectオブジェクトを初期化
	 */
	function init(){

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				// px2package 情報を読み込み
				_px2package = main.px2dtLDA.project(projectId).px2package().getPrimaryProject();
				if(_px2package === false){
					_px2package = {
						'type': 'project',
						'path': '.px_execute.php',
						'path_homedir': 'px-files/'
					};
				}
				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// cmdQueue にカレントディレクトリ情報をセット
				main.commandQueue.server.setCurrentDir( 'default', _this.get('path') );
				main.commandQueue.server.setCurrentDir( 'git', _this.get_realpath_git_root() );
				main.commandQueue.server.setCurrentDir( 'composer', _this.get_realpath_composer_root() );
				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// appdataオブジェクトを生成
				_this.appdata = new (require('./pickles.project.appdata.js'))(px, _this, function(){
					rlv();
				});
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){

				// px2agent から プロジェクト情報を生成
				var px2agentOption = {
					'bin': main.nodePhpBin.getPath(),
					'ini': main.nodePhpBin.getIniPath(),
					'extension_dir': main.nodePhpBin.getExtensionDir()
				};
				// console.log(px2agentOption);
				_px2proj = main.px2agent.createProject(
					_path.resolve( _this.get('path') + '/' + _this.get('entry_script') ) ,
					px2agentOption
				);
				_this.px2proj = _px2proj;

				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				_this.updateProjectStatus(function( tmpStatus ){
					_projectStatus = tmpStatus;
					rlv();
				});
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if( !_projectStatus.pathExists || !_projectStatus.entryScriptExists || !_projectStatus.vendorDirExists || !_projectStatus.composerJsonExists ){
					_px2proj = false;
					_this.px2proj = _px2proj;
					rlv();
					return;
				}
				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if( !_projectStatus.pathExists || !_projectStatus.entryScriptExists || !_projectStatus.vendorDirExists || !_projectStatus.composerJsonExists ){
					_config = false;
					rlv();
					return;
				}

				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if( !_projectStatus.pathExists || !_projectStatus.entryScriptExists || !_projectStatus.vendorDirExists || !_projectStatus.composerJsonExists ){
					_px2DTConfig = false;
					rlv();
					return;
				}

				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if( !_projectStatus.entryScriptExists || !_projectStatus.vendorDirExists || !_projectStatus.composerJsonExists ){
					rlv();
					return;
				}
				if( _config === false ){
					rlv();
					return;
				}

				/**
				 * pj.site
				 */
				_this.site = new (require('./pickles.project.site.js'))(px, _this, function(){
					rlv();
				});
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// remote-finder (=ファイルとフォルダ)
				// Server Side
				_this.remoteFinder = new (require('remote-finder'))({
					"default": _this.get('path')
				},{
					"paths_readonly": [
						'*/.git/*',
						'*/.svn/*',
						'*/vendor/*'
					]
				});
				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// composer パッケージの更新をチェックする。
				main.composerInstallChecker.check(_this, function(checked){});
				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// Checking Git Status
				_this.updateGitStatus(function(){});
				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// Setup WASABI API Client
				_this.wasabiPjAgent = main.wasabiClient.createProjectAgent( _this );
				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				cbStandby();
				rlv();
				return;
			}); })
		;
		return;
	} // init()


	/**
	 * プロジェクトのステータスを調べる
	 */
	this.status = function(){
		return _projectStatus;
	}

	/**
	 * Git の状態を更新する
	 */
	this.updateGitStatus = function( callback ){
		callback = callback || function(){};
		if( !this.status().gitDirExists ){
			_this.updateStatusBar(function(){
				callback();
			});
			return;
		}
		_this.git().parser.git(['status','-uall'], function(result){
			// console.log(result);
			_gitStatus = result;
			_this.updateStatusBar(function(){
				callback();
			});
		});
		return;
	}

	/**
	 * ステータスバーを更新する
	 */
	this.updateStatusBar = function( callback ){
		callback = callback || function(){};
		var contentsL = [];
		var contentsR = [];
		if(this.status().gitDirExists){
			var changes = _gitStatus.staged.deleted.length
				+ _gitStatus.staged.modified.length
				+ _gitStatus.staged.untracked.length
				+ _gitStatus.notStaged.deleted.length
				+ _gitStatus.notStaged.modified.length
				+ _gitStatus.notStaged.untracked.length;

			contentsR = [
				_gitStatus.currentBranchName,
				changes + ' Uncommited Changes',
			];
		}else{
			contentsR = [
				'Git is not initialized.',
			];
		}
		main.statusbar.set( contentsL, contentsR );
		callback();
	}

	/**
	 * プロジェクトステータスを更新する
	 * @param  {Function} callback callback function
	 * @return {Void} Return nothing.
	 */
	this.updateProjectStatus = function( callback ){
		callback = callback || function(){};
		var status = {};
		status.api = {
			"available": false,
			"version": false,
			"is_sitemap_loaded": false
		};
		status.px2dthelper = {
			"available": false,
			"version": false,
			"is_sitemap_loaded": false
		};
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				status.pathExists = main.utils79.is_dir( _this.get('path') );
				status.pathContainsFileCount = false;
				if( status.pathExists ){
					try {
						status.pathContainsFileCount = (function(){
							var filelist = main.fs.readdirSync(_this.get('path'));
							var filelist_length = 0;
							for(var i in filelist){
								switch( filelist[i] ){
									case '.DS_Store':
									case 'Thumbs.db':
										break;
									default:
										filelist_length ++;
										break;
								}
							}
							return filelist_length;
						})();
					} catch (e) {
					}
				}
				status.entryScriptExists = (status.pathExists && main.utils79.is_file( _this.get('path')+'/'+_this.get('entry_script') ) ? true : false);
				var homeDir = _this.get('path')+'/'+_this.get('home_dir');
				status.homeDirExists = (status.pathExists && main.utils79.is_dir( homeDir ) ? true : false);
				// status.confFileExists = (status.homeDirExists && (main.utils79.is_file( homeDir+'/config.php' )||main.utils79.is_file( homeDir+'/config.json' ) ) ? true : false);
				status.confFileExists = false;
				if(typeof(_config) === typeof({})){ status.confFileExists = true; }
				// status.px2DTConfFileExists = (status.homeDirExists && main.utils79.is_file( homeDir+'/px2dtconfig.json' ) ? true : false);
				status.px2DTConfFileExists = false;
				if(typeof(_px2DTConfig) === typeof({})){ status.px2DTConfFileExists = true; }
				status.composerJsonExists = (status.pathExists && main.utils79.is_file( _this.get_realpath_composer_root()+'/composer.json' ) ? true : false);
				status.vendorDirExists = (status.pathExists && main.utils79.is_dir( _this.get_realpath_composer_root()+'/vendor/' ) ? true : false);
				status.isPxStandby = ( status.pathExists && status.entryScriptExists && status.homeDirExists && status.confFileExists && status.composerJsonExists && status.vendorDirExists ? true : false );
				status.gitDirExists = (function(path){
					function checkParentDir(path){
						if( status.pathExists && main.utils79.is_dir( path+'/.git/' ) ){
							return true;
						}
						var nextPath = main.utils.dirname( path );
						if( nextPath == path ){
							return false;
						}
						return checkParentDir( nextPath );
					}
					return checkParentDir(path);
				})( _this.get('path') );

				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// Pickles Framework のバージョンを確認
				// かつ、 PX=api が利用できるか確認
				_config = false;
				_px2DTConfig = false;
				_this.px2dthelperGetAll('/', {'filter': false}, function(pjInfo){
					// console.log('=-=-=-=-=-=', pjInfo);
					if(pjInfo === false){
						console.error('FAILED to getting data from "/?PX=px2dthelper.get.all"');
						rlv();
						return;
					}
					try {
						status.api.version = pjInfo.check_status.pxfw_api.version;
						status.api.available = (pjInfo.check_status.pxfw_api.version ? true : false);
						status.api.is_sitemap_loaded = pjInfo.check_status.pxfw_api.is_sitemap_loaded;

						status.px2dthelper.version = pjInfo.check_status.px2dthelper.version;
						status.px2dthelper.available = (pjInfo.check_status.px2dthelper.version ? true : false);
						status.px2dthelper.is_sitemap_loaded = pjInfo.check_status.px2dthelper.is_sitemap_loaded;

						try{
							_config = pjInfo.config;
							if( _config.plugins && _config.plugins.px2dt ){
								_px2DTConfig = _config.plugins.px2dt;
							}
						}catch(e){
							console.error('FAILED to parse JSON "Pickles 2" config.');
							console.error(data_json_string);
							_this.error( 'FAILED to parse JSON "Pickles 2" config.'+"\n"+'------------'+"\n\n"+data_json_string );
							_config = false;
							_px2DTConfig = false;
						}

						status.customConsoleExtensions = false;
						try{
							if( pjInfo.custom_console_extensions ){
								status.customConsoleExtensions = pjInfo.custom_console_extensions;
							}
						}catch(e){
						}

						status.mainMenu = false;
						try{
							if( _px2DTConfig.main_menu ){
								status.mainMenu = _px2DTConfig.main_menu;
							}
						}catch(e){
						}

						status.appearance = false;
						try{
							if( _px2DTConfig.appearance ){
								status.appearance = _px2DTConfig.appearance;
							}
						}catch(e){
						}

					} catch (e) {
						console.error('FAILED to getting data from "/?PX=px2dthelper.get.all"');
					}
					rlv();
				});
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// console.log(_config);
				if( typeof(_config) == typeof({}) && _config !== null ){
					// コンフィグがロードできていればOK
					rlv();
					return;
				}

				// px2dthelper.get.all が利用できない場合、
				// 旧来のAPIを使って地道にデータを集める。
				new Promise(function(rlv){rlv();})
					.then(function(){ return new Promise(function(rlv2, rjt2){
						_px2proj.query(
							'/?PX=api.get.config',
							{
								"output": "json",
								"complete": function(data_json_string, code){
									// console.log(data_json_string, code);
									if( code == 0 ){
										_config = false;
										_px2DTConfig = false;
										try{
											var _config = JSON.parse(data_json_string);
											if( _config.plugins && _config.plugins.px2dt ){
												_px2DTConfig = _config.plugins.px2dt;
											}
										}catch(e){
											console.error('FAILED to parse JSON "Pickles 2" config.');
											console.error(data_json_string);
											_this.error( 'FAILED to parse JSON "Pickles 2" config.'+"\n"+'------------'+"\n\n"+data_json_string );
											_config = false;
											_px2DTConfig = false;
										}
									}
									rlv2();
									return;
								}
							}
						);
						return;
					}); })
					.then(function(){ return new Promise(function(rlv2, rjt2){
						// console.log('------------------ config loaded', _config);
						rlv();
						return;
					}); })
				;

				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				status.guiEngineName = _this.getGuiEngineName();
				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// console.log(status);
				callback(status);
				return;
			}); })
		;
		return;
	} // updateProjectStatus()

	/** PXコマンドのバージョンが適合するか調べる */
	this.checkPxCmdVersion = function( cond, callbackOk, callbackNg ){
		cond = cond||{};
		callbackOk = callbackOk || function(){};
		callbackNg = callbackNg || function(){};
		var pjStatus = this.status();
		var errors = [];
		var semver = main.semver;

		function versionClean(version){
			if(typeof(version) != typeof('')){return false;}
			version = semver.clean(version);
			version = version.replace( /^([0-9]+\.[0-9]+\.[0-9]+)[\s\S]*$/, '$1' );
			return version;
		}

		if( (cond.apiVersion) ){
			if( !pjStatus.api.available ){
				errors.push( 'PX=api が利用できません。' );
			}
			if( !pjStatus.api.is_sitemap_loaded ){
				errors.push( 'PX=api がサイトマップ情報をロードできません。' );
			}
			var apiVersion = versionClean(pjStatus.api.version);
			if( !semver.valid(apiVersion) || !semver.satisfies(apiVersion, cond.apiVersion) ){
				errors.push( 'pickles2/px-fw-2.x のバージョンを '+cond.apiVersion+' に更新してください。 (ロードされたバージョン: '+pjStatus.api.version+')' );
			}
		}

		if( (cond.px2dthelperVersion) ){
			if( !pjStatus.px2dthelper.available ){
				errors.push( 'PX=px2dthelper が利用できません。' );
			}
			if( !pjStatus.px2dthelper.is_sitemap_loaded ){
				errors.push( 'PX=px2dthelper がサイトマップ情報をロードできません。' );
			}
			var px2dthelperVersion = versionClean(pjStatus.px2dthelper.version);
			if( !semver.valid(px2dthelperVersion) || !semver.satisfies(px2dthelperVersion, cond.px2dthelperVersion) ){
				errors.push( 'pickles2/px2-px2dthelper のバージョンを '+cond.px2dthelperVersion+' に更新してください。 (ロードされたバージョン: '+pjStatus.px2dthelper.version+')' );
			}
		}

		if( errors.length ){
			callbackNg( errors ); return;
		}
		callbackOk();
		return;
	}

	/** プロジェクト情報を取得する */
	this.get = function(key){
		if(key == 'entry_script' && !this.projectInfo[key]){
			if(_px2package.path){
				return _px2package.path;
			}
			return '.px_execute.php';
		}
		if(key == 'home_dir' && !this.projectInfo[key]){
			if(_px2package.path_homedir){
				return _px2package.path_homedir;
			}
			return 'px-files/';
		}
		return this.projectInfo[key];
	}

	/** プロジェクト情報をセットする */
	this.set = function(key, val){
		this.projectInfo[key] = val;
		return this;
	}

	/** サイトマップファイルの一覧を取得する */
	this.getSitemapFilelist = function(){
		var pathDir = this.get('path')+'/'+this.get('home_dir')+'/sitemaps/';
		var filelist = main.fs.readdirSync( pathDir );
		var rtn = [];
		for( var idx in filelist ){
			if( filelist[idx].match( /^\~\$/ ) ){
				// エクセルの編集中のキャッシュファイルのファイル名だからスルー
				continue;
			}
			if( filelist[idx].match( /^\.\~lock\./ ) ){
				// Libre Office, Open Office の編集中のキャッシュファイルのファイル名だからスルー
				continue;
			}

			rtn.push( filelist[idx] );
		}
		return rtn;
	}

	/** サイトマップファイルを削除する */
	this.deleteSitemapFile = function(basefilename, callback){
		callback = callback || function(){};
		var result = true;
		var pathDir = this.get('path')+'/'+this.get('home_dir')+'/sitemaps/';
		var filelist = this.getSitemapFilelist();
		for( var idx in filelist ){
			try {
				var filename = filelist[idx].replace(/\.[a-zA-Z0-9]+$/, '');
				var ext = main.utils.getExtension(filelist[idx]).toLowerCase();
				if( filename == basefilename ){
					main.fs.unlinkSync( pathDir+filelist[idx] );
					if( main.utils79.is_file( pathDir+filelist[idx] ) ){
						result = false; // 消えてない場合
					}
				}
			} catch (e) {
			}
		}
		callback(result);
		return;
	}

	/** プロジェクト設定情報を取得する */
	this.getConfig = function(){
		return _config;
	}

	/** プロジェクト設定情報を更新する (非同期) */
	this.updateConfig = function( callback ){
		callback = callback||function(){};
		this.execPx2(
			'/?PX=api.get.config',
			{
				complete: function(data_json_string){
					_config = false;
					_px2DTConfig = false;
					try{
						_config = JSON.parse(data_json_string);
						if( _config.plugins && _config.plugins.px2dt ){
							_px2DTConfig = _config.plugins.px2dt;
						}
					}catch(e){
						console.error('FAILED to parse JSON "Pickles 2" config.');
						console.error(data_json_string);
						_this.error( 'FAILED to parse JSON "Pickles 2" config.'+"\n"+'------------'+"\n\n"+data_json_string );
						_config = false;
						_px2DTConfig = false;
					}
					callback( _config );
				}
			}
		);
		return this;
	}

	/** Pickles 2 設定情報を取得する */
	this.getPx2DTConfig = function(){
		return _px2DTConfig;
	}

	/** Pickles 2 設定情報を更新する (非同期) */
	this.updatePx2DTConfig = function( callback ){
		callback = callback||function(){};

		var conf = this.getConfig();
		if( conf.plugins && conf.plugins.px2dt ){
			_px2DTConfig = conf.plugins.px2dt;
			callback( _px2DTConfig );
			return this;
		}

		_px2DTConfig = {};
		var path = this.get('path')+'/'+this.get('home_dir')+'/px2dtconfig.json';

		if( !main.utils79.is_file( path ) ){
			callback( null );
			return this;
		}
		main.fs.readFile( path, {}, function(err, data_json_string){
			try{
				_px2DTConfig = JSON.parse( data_json_string.toString() );
			}catch(e){
				console.error('FAILED to parse `px2dtconfig.json`.');
				console.error(data_json_string);
				_this.error( 'FAILED to parse `px2dtconfig.json`.'+"\n"+'------------'+"\n\n"+data_json_string );
				_px2DTConfig = false;
			}
			callback( _px2DTConfig );
		} );
		return this;
	}

	/** サイトマップを取得する */
	this.getSitemap = function(){
		return this.site.getSitemap();
	}

	/** サイトマップを更新する (非同期) */
	this.updateSitemap = function( callback ){
		return this.site.updateSitemap( callback );
	}

	/** Pickles 2 を実行する (非同期) */
	this.execPx2 = function( cmd, opts ){
		opts = opts||{};
		opts.complete = opts.complete||function(){};
		if( _px2proj === false ){
			opts.complete(false);
			return this;
		}
		var queryOptions = {
			"output": "json",
			"userAgent": "Mozilla/5.0",
			"complete": function(data, code){
				opts.complete(data);
			}
		};
		if( opts.method ){
			queryOptions.method = opts.method;
		}
		if( opts.body ){
			queryOptions.body = opts.body;
		}
		if( opts.bodyFile ){
			queryOptions.bodyFile = opts.bodyFile;
		}
		_px2proj.query(
			cmd,
			queryOptions
		);
		return this;
	}

	/**
	 * composerを実行する
	 *
	 * node-php-bin の PHP などを考慮して、
	 * -c, -d オプションの解決を自動的にやっている前提で、
	 * composer コマンドを実行します。
	 * 基本的には main.execComposer() をラップするメソッドですが、
	 * cwd オプションを自動的に付与する点が異なります。
	 *
	 * @param  {Array}  cmd  `php`, `composer` を含まないコマンドオプションの配列
	 * @param  {Object} opts [description]
	 * @return {[type]}      [description]
	 */
	this.execComposer = function( cmd, opts ){
		opts = opts||{};
		opts.success = opts.success||function(){};
		opts.error = opts.error||function(){};
		opts.complete = opts.complete||function(){};
		opts.cwd = this.get_realpath_composer_root();
		main.execComposer(
			cmd ,
			opts
		);
		return this;
	}
	/**
	 * プロジェクトのフォルダを開く
	 */
	this.open = function(){
		return window.main.utils.openURL(this.get('path'));
	}

	/**
	 * `?PX=px2dthelper.get.all` を実行する
	 */
	this.px2dthelperGetAll = function(path, options, callback){
		callback = callback || function(){};
		if( !path ){
			path = '/';
		}
		options = options || {};
		options.filter = !!options.filter;
		_px2proj.query(
			'/?PX=px2dthelper.get.all&path='+encodeURIComponent(path)+'&filter='+(options.filter?'true':'false'),
			{
				"output": "json",
				"complete": function(data, code){
					// console.log(data, code);
					var pjInfo = false;
					try {
						pjInfo = JSON.parse(data);
					} catch (e) {
					}
					callback(pjInfo);
					return;
				}
			}
		);

		return;
	}

	/**
	 * テーマコレクションディレクトリのパスを得る
	 */
	this.px2dthelperGetRealpathThemeCollectionDir = function( callback ){
		var multithemePluginFunctionName = 'tomk79\\pickles2\\multitheme\\theme::exec';
		var realpathThemeCollectionDir = false;
		_this.px2dthelperGetAll('/', {}, function(px2all){
			realpathThemeCollectionDir = px2all.realpath_homedir+'themes/';
			_this.px2proj.query(
				'/?PX=px2dthelper.plugins.get_plugin_options&func_div=processor.html&plugin_name='+encodeURIComponent(multithemePluginFunctionName),
				{
					"output": "json",
					"complete": function(result, code){
						try {
							result = JSON.parse(result);
							// console.log(result);
							if( result[0].options.path_theme_collection ){
								realpathThemeCollectionDir = require('path').resolve( px2all.realpath_docroot + px2all.path_controot, result[0].options.path_theme_collection )+'/';
							}
						} catch (e) {
						}
						// console.log(realpathThemeCollectionDir);
						callback(realpathThemeCollectionDir);
						return;
					}
				}
			);
		});
		return;
	}

	/**
	 * ページパスからコンテンツを探す
	 */
	this.findPageContent = function( pagePath ){
		var pageInfo = this.site.getPageInfo( pagePath );
		var contLocalpath = pagePath;
		if( pageInfo ){
			contLocalpath = pageInfo.content;
		}

		for( var tmpExt in _config.funcs.processor ){
			if( main.fs.existsSync( this.get_realpath_controot()+'/'+contLocalpath+'.'+ tmpExt) ){
				contLocalpath = contLocalpath+'.'+ tmpExt;
				break;
			}
		}
		return contLocalpath;
	}

	/**
	 * コンテンツパスが、2重拡張子か調べる
	 */
	this.isContentDoubleExtension = function( contentPath ){
		var rtn = false;
		for( var tmpExt in _config.funcs.processor ){
			if( contentPath.match( new RegExp( '\\.[a-zA-Z0-9\\_\\-]+?\\.'+main.utils.escapeRegExp(tmpExt)+'$' ) ) ){
				rtn = true;
				break;
			}
		}
		return rtn;
	}

	/**
	 * ページパスからコンテンツの種類(編集モード)を取得する (非同期)
	 */
	this.getPageContentEditorMode = function( pagePath, callback ){
		callback = callback || function(){};

		_px2proj.query(
			'/?PX=px2dthelper.check_editor_mode&path='+encodeURIComponent(this.getConcretePath(pagePath)), {
				"output": "json",
				"complete": function(data, code){
					// console.log(data, code);
					var rtn = JSON.parse(data);
					callback(rtn);
					return;
				}
			}
		);
		return;
	}// getPageContentEditorMode()

	/**
	 * コンテンツパスから専有リソースディレクトリパスを探す
	 */
	this.getContentFilesByPageContent = function( contentPath ){
		var conf = this.getConfig();
		var rtn = conf.path_files;
		if( typeof(rtn) !== typeof('') ){
			rtn = '{$dirname}/{$filename}_files/'; // <- default
		}
		var $data = {
			'dirname': main.utils.dirname(contentPath),
			'filename': main.utils.basename(main.utils.trim_extension(main.utils.trim_extension(contentPath))),
			'ext': main.utils.getExtension(contentPath).toLowerCase(),
		};
		rtn = rtn.replace( '{$dirname}', $data['dirname'], rtn );
		rtn = rtn.replace( '{$filename}', $data['filename'], rtn );
		rtn = rtn.replace( '{$ext}', $data['ext'], rtn );
		rtn = rtn.replace( /^\/*/, '/', rtn );
		rtn = rtn.replace( /\/*$/, '', rtn )+'/';
		return rtn;
	} // getContentFilesByPageContent

	/**
	 * 具体的なパスを取得する
	 */
	this.getConcretePath = function(pagePath){
		if( pagePath.match( /^alias[0-9]*\:([\s\S]+)/ ) ){
			//  エイリアスを解決
			pagePath = RegExp.$1;
		}else if( pagePath.match( /\{[\s\S]+\}/ ) ){
			//  ダイナミックパスをバインド
			var $tmp_path = pagePath;
			pagePath = '';
			while( 1 ){
				if( !$tmp_path.match( /^([\s\S]*?)\{(\$|\*)([a-zA-Z0-9\_\-]*)\}([\s\S]*)$/ ) ){
					pagePath += $tmp_path;
					break;
				}
				pagePath += RegExp.$1;
				var paramName = RegExp.$3;
				$tmp_path = RegExp.$4;

				if( typeof(paramName) != typeof('') || !paramName.length ){
					//無名のパラメータはバインドしない。
				}else{
					pagePath += paramName;
				}
				continue;
			}
		}
		return pagePath;
	}

	/**
	 * GUI編集エンジンの種類を取得する
	 *
	 * 旧GUI編集(legacy)から、新GUI編集エンジン(broccoli-html-editor)に移行する
	 * 過渡期に使用する一時的な機能として実装します。
	 * Pickles2 の config.php に、plugins.px2dt.guiEngine を設定すると、
	 * GUI編集エンジンを切り替えることができます。
	 *
	 * 設定できる値は、以下です。
	 * - legacy = 旧GUI編集 (このオプションは 2.0.0-beta.17 で廃止されました)
	 * - broccoli-html-editor = NodeJS版 内蔵 Broccoliエンジン (default)
	 * - broccoli-html-editor-php = PHP版 Broccoliエンジン (Pickles 2 v2.0.0-beta.20 で追加されました)
	 */
	this.getGuiEngineName = function(){
		var engineName = 'broccoli-html-editor';
		try {
			var conf = this.getConfig();
			if( conf && conf.plugins && conf.plugins.px2dt && conf.plugins.px2dt.guiEngine ){
				switch(conf.plugins.px2dt.guiEngine){
					case 'legacy': // Obsoleted Option
						console.error('[Notice] guiEngine "legacy" is a obsoleted option. Selected "broccoli-html-editor" instead.');
						// return conf.plugins.px2dt.guiEngine;
						break;
					case 'broccoli-html-editor-php':
						engineName = 'broccoli-html-editor-php';
						break;
					default:
						break;
				}
			}
		} catch (e) {
			console.error(e);
		}
		return engineName;
	}

	/**
	 * GUI編集のコンテンツをビルドする
	 */
	this.buildGuiEditContent = function( pagePath, callback ){
		callback = callback||function(){};
		var pj = this;
		this.getPageContentEditorMode(pagePath, function(editorMode){
			if( editorMode != 'html.gui' ){
				callback(false);
				return;
			}

			var guiEngine = pj.getGuiEngineName();

			if(guiEngine == 'broccoli-html-editor-php'){
				// broccoli-html-editor-php (PHP版) の処理
				var options = {
					'api': 'broccoliBridge',
					'forBroccoli': {
						'api': 'updateContents',
						'options': {
							'lang': 'ja'
						}
					},
					'page_path': pagePath
				};
				options = main.utils79.base64_encode(JSON.stringify(options));
				var PxCommand = 'PX=px2dthelper.px2ce.gpi&appMode=desktop&data='+encodeURIComponent(options);

				_px2proj.query(
					pj.getConcretePath(pagePath)+'?'+PxCommand, {
						"output": "json",
						"complete": function(data, code){
							// console.log(data, code);
							var rtn = false;
							try{
								rtn = JSON.parse(data);
							}catch(e){}
							callback(rtn);
							return;
						}
					}
				);
			}else{
				// broccoli-html-editor (旧JS版) の処理
				pj.createBroccoliServer(pagePath, function(broccoli){
					broccoli.updateContents(
						function(result){
							callback(result);
						}
					);
				});
			}
		});
		return this;
	}// buildGuiEditContent()

	/**
	 * broccoli(サーバーサイド)を生成する
	 */
	this.createBroccoliServer = function(page_path, callback){
		callback = callback || function(){};
		_this.createPickles2ContentsEditorServer(page_path, {}, function(px2ce){
			px2ce.createBroccoli(function(broccoli){
				callback(broccoli);
			});
		});
		return this;
	}

	/**
	 * pickles2-contents-editor(サーバーサイド)を生成する
	 */
	this.createPickles2ContentsEditorServer = function(page_path, options, callback){
		alert('deprecated (createPickles2ContentsEditorServer())');
		return;
		options = options || {};
		callback = callback || function(){};
		var Px2CE = require('pickles2-contents-editor');
		var _pj = this;

		// pickles2-contents-editor setup.
		var px2ce = new Px2CE();

		// console.log(broccoli);
		// console.log(require('path').resolve('/', './'+page_path));

		var initOption = {
			'target_mode': (options.target_mode || 'page_content'),
			'page_path': page_path,
			'appMode': 'desktop', // 'web' or 'desktop'. default to 'web'
			'entryScript': require('path').resolve( _pj.get('path'), _pj.get('entry_script') ),
			'customFields': _pj.mkBroccoliCustomFieldOptionBackend() ,
			'customFieldsIncludePath': _pj.mkBroccoliCustomFieldIncludePathOptionBackend() ,
			'log': function(msg){
				main.log(msg);
			},
			'commands':{
				'php': main.nodePhpBinOptions
			}
		};

		px2ce.init(
			initOption,
			function(){
				callback(px2ce);
			}
		);

		return this;
	}

	/**
	 * broccoli-html-editorのカスタムフィールドオプションを生成する (frontend)
	 */
	this.mkBroccoliCustomFieldOptionFrontend = function(window, isLoadProjectCustomField){
		var rtn = {
			'href': window.BroccoliFieldHref,
			// 'psd': window.BroccoliFieldPSD,
			'table': window.BroccoliFieldTable
		};

		if( !isLoadProjectCustomField ){
			// プロジェクトカスタムフィールドをロードしない場合
			return rtn;
		}

		var confCustomFields = {};
		try {
			confCustomFields = this.getConfig().plugins.px2dt.guieditor.custom_fields;
			for( var fieldName in confCustomFields ){
				try {
					if( confCustomFields[fieldName].frontend.file && confCustomFields[fieldName].frontend.function ){
						// console.log(eval( confCustomFields[fieldName].frontend.function ));
						rtn[fieldName] = eval( confCustomFields[fieldName].frontend.function );
					}else{
						console.error( 'FAILED to load custom field: ' + fieldName + ' (frontend);' );
						console.error( 'unknown type' );
					}
				} catch (e) {
					console.error( 'FAILED to load custom field: ' + fieldName + ' (frontend);' );
					console.error(e);
				}
			}
		} catch (e) {
		}

		return rtn;
	}

	/**
	 * broccoli-html-editorのカスタムフィールドオプションを生成する (backend)
	 */
	this.mkBroccoliCustomFieldOptionBackend = function(){
		var rtn = {
			'href': require('./../common/broccoli/broccoli-field-href/server.js'),
			// 'psd': require('broccoli-field-psd'),
			'table': require('broccoli-field-table').get({
				'php': main.nodePhpBinOptions
			})
		};

		var confCustomFields = {};
		try {
			confCustomFields = this.getConfig().plugins.px2dt.guieditor.custom_fields;
			for( var fieldName in confCustomFields ){
				try {
					if( confCustomFields[fieldName].backend.require ){
						rtn[fieldName] = require( require('path').resolve(this.get_realpath_controot(), confCustomFields[fieldName].backend.require) );
					}else{
						console.error( 'FAILED to load custom field: ' + fieldName + ' (backend);' );
						console.error( 'unknown type' );
					}
				} catch (e) {
					console.error( 'FAILED to load custom field: ' + fieldName + ' (backend);' );
					console.error(e);
				}
			}
		} catch (e) {
		}

		return rtn;
	}

	/**
	 * px2cdのカスタムフィールドインクルードパスオプションを生成する (backend)
	 */
	this.mkBroccoliCustomFieldIncludePathOptionBackend = function(){
		var rtn = [];
		var entryScript = _path.resolve( this.get('path') + '/' + this.get('entry_script') );

		var confCustomFields = [];
		try {
			var confCustomFields = this.getConfig().plugins.px2dt.guieditor.custom_fields;
			for(var fieldName in confCustomFields){
				var file = confCustomFields[fieldName].frontend.file;
				var dir = confCustomFields[fieldName].frontend.dir;
				var fnc = confCustomFields[fieldName].frontend.function;
				if( file && fnc ){
					if( typeof(file) == typeof('') ){
						file = [file];
					}
					for(var idx in file){
						var filePath = '.';
						if( typeof(dir) == typeof('') && main.utils79.is_dir(require('path').resolve(entryScript, '..', dir)) ){
							filePath = dir;
						}
						var pathJs = require('path').resolve(entryScript, '..', filePath, file[idx]);
						rtn.push( 'file://'+pathJs );
					}
				}
			}

		} catch (e) {
			console.error(e);
		}
		// console.log('=-=-=-=-=-=-=-=-=-=', rtn);

		return rtn;
	}

	/**
	 * pickles2-module-editor(サーバーサイド)を生成する
	 */
	this.createPickles2ModuleEditorServer = function(callback){
		alert('depricated (createPickles2ModuleEditorServer())');
		return;
		callback = callback || function(){};
		var Px2ME = require('pickles2-module-editor');
		var _pj = this;

		// pickles2-module-editor setup.
		var px2me = new Px2ME();

		px2me.init(
			{
				'appMode': 'desktop', // 'web' or 'desktop'. default to 'web'
				'entryScript': require('path').resolve( _pj.get('path'), _pj.get('entry_script') ),
				'log': function(msg){
					main.log(msg);
				},
				'commands':{
					'php': main.nodePhpBinOptions
				}
			},
			function(){
				callback(px2me);
			}
		);

		return this;
	}

	/**
	 * broccoli-processor オブジェクトを生成する
	 * @param  {Function} callback [description]
	 * @return {Void}            [description]
	 */
	this.createBroccoliProcessor = function( page_path, callback ){
		callback = callback || function(){};
		var BroccoliProcessor = require('broccoli-processor');

		var broccoliProcessorOptions = {};
		if( this.getGuiEngineName() == 'broccoli-html-editor-php' ){
			broccoliProcessorOptions.saveResourceDb = function(resourceDb, callbackSaveResourceDb){
				// console.log('=-=-=-=-=-= callbackSaveResourceDb', page_path);
				_this.px2dthelperGetAll('/', {}, function(px2all){
					main.it79.ary(
						resourceDb,
						function( itAry, resInfo, resKey ){
							// console.log(resKey, resInfo);
							var realpathDataDir = px2all.realpath_homedir+'_sys/ram/data/';
							var gpiOptions = {
								'api': 'broccoliBridge',
								'forBroccoli': {
									'api': 'resourceMgr.updateResource',
									'options': {
										'resKey': resKey,
										'resInfo': resInfo,
										'lang': 'ja'
									}
								},
								'page_path': page_path
							};

							var tmpFileName = '__tmp_'+main.utils79.md5( Date.now() )+'.json';
							main.fs.writeFileSync( realpathDataDir+tmpFileName, JSON.stringify(gpiOptions) );
							var PxCommand = 'PX=px2dthelper.px2ce.gpi&appMode=desktop&data_filename='+encodeURIComponent(tmpFileName);
							_px2proj.query(
								_this.getConcretePath(page_path)+'?'+PxCommand, {
									"output": "json",
									"complete": function(data, code){
										console.log('------result:', data, code);
										main.fs.unlinkSync( realpathDataDir+tmpFileName );
										itAry.next();
										return;
									}
								}
							);
						},
						function(){
							callbackSaveResourceDb(true);
						}
					);
				});
			};
			broccoliProcessorOptions.rebuild = function(callbackRebuild){
				// console.log('=-=-=-=-=-= callbackRebuild', page_path);
				_this.buildGuiEditContent(page_path, function(){
					callbackRebuild(true);
				});
			};
			broccoliProcessorOptions.jsonIndentSize = 4;
		}

		this.createPickles2ContentsEditorServer( page_path, {}, function(px2ce){
			px2ce.createBroccoli(function(broccoli){
				var broccoliProcessor = new BroccoliProcessor(broccoli, broccoliProcessorOptions);
				callback( broccoliProcessor );
			});
		} );
		return;
	}

	/**
	 * コンテンツをコピーする
	 */
	this.copyContentsData = function( pathFrom, pathTo, callback ){
		callback = callback || function(){};
		_px2proj.query(
			this.getConcretePath(pathTo)+'?PX=px2dthelper.copy_content&from='+this.getConcretePath(pathFrom)+'&to='+this.getConcretePath(pathTo)+'&force=1', {
				"output": "json",
				"complete": function(data, code){
					// console.log(data, code);
					var rtn = JSON.parse(data);
					callback(rtn);
					return;
				}
			}
		);
		return;
	}

	/**
	 * gitディレクトリの絶対パスを得る
	 *
	 * @return string gitディレクトリのパス(.git の親ディレクトリ)
	 */
	this.get_realpath_git_root = function(){
		return (function(path){
			function checkParentDir(path){
				if( main.utils79.is_dir( path ) && main.utils79.is_dir( path+'/.git/' ) ){
					return main.fs.realpathSync(path)+'/';
				}
				var nextPath = main.utils.dirname( path );
				if( nextPath == path ){
					return false;
				}
				return checkParentDir( nextPath );
			}
			return checkParentDir(path);
		})( this.get_realpath_controot() );
	}// get_realpath_git_root()

	/**
	 * composerのルートの絶対パスを得る
	 *
	 * @return string composer のルートディレクトリのパス(composer.json の親ディレクトリ)
	 */
	this.get_realpath_composer_root = function(){
		return (function(path){
			function checkParentDir(path){
				if( main.utils79.is_dir( path ) && main.utils79.is_file( path+'/composer.json' ) ){
					return main.fs.realpathSync(path)+'/';
				}
				var nextPath = main.utils.dirname( path );
				if( nextPath == path ){
					return false;
				}
				return checkParentDir( nextPath );
			}
			return checkParentDir(path);
		})( this.get_realpath_controot() );
	}// get_realpath_composer_root()


	/**
	 * npmのルートの絶対パスを得る
	 *
	 * @return string npm のルートディレクトリのパス(package.json の親ディレクトリ)
	 */
	this.get_realpath_npm_root = function(){
		return (function(path){
			function checkParentDir(path){
				if( main.utils79.is_dir( path ) && main.utils79.is_file( path+'/package.json' ) ){
					return main.fs.realpathSync(path)+'/';
				}
				var nextPath = main.utils.dirname( path );
				if( nextPath == path ){
					return false;
				}
				return checkParentDir( nextPath );
			}
			return checkParentDir(path);
		})( this.get_realpath_controot() );
	}// get_realpath_npm_root()


	/**
	 * コンテンツルートの絶対パスを得る
	 *
	 * @return string コンテンツルートディレクトリの絶対パス(.px_execute.php の親ディレクトリ)
	 */
	this.get_realpath_controot = function(){
		var pathBase = this.get('path');
		if( main.utils79.is_file( this.get('path')+'/'+this.get('entry_script') ) ){
			pathBase = main.utils.dirname( main.fs.realpathSync( this.get('path')+'/'+this.get('entry_script') ) )+'/';
		}
		return pathBase;
	}// get_realpath_controot()



	/**
	 * directory_index(省略できるファイル名) の一覧を得る。
	 *
	 * @return array ディレクトリインデックスの一覧
	 */
	this.get_directory_index = function(){
		var $tmp_di = _config.directory_index;
		var directory_index = [];
		for( var idx in $tmp_di ){
			var $file_name = $tmp_di[idx];
			$file_name = main.php.trim( $file_name );
			if( !$file_name.length ){ continue; }
			directory_index.push( $file_name );
		}
		if( !directory_index.length ){
			directory_index.push( 'index.html' );
		}
		return directory_index;
	} // get_directory_index()

	/**
	 * directory_index のいずれかにマッチするためのpregパターン式を得る。
	 *
	 * @return string pregパターン
	 */
	this.get_directory_index_preg_pattern = function(){
		var $directory_index = this.get_directory_index();
		for( var $key in $directory_index ){
			var $row = $directory_index[$key];
			$directory_index[$key] = main.utils.escapeRegExp($row);
		}
		var $rtn = '(?:'+$directory_index.join( '|' )+')';
		return $rtn;
	} // get_directory_index_preg_pattern()


	/**
	 * 最も優先されるインデックスファイル名を得る。
	 *
	 * @return string 最も優先されるインデックスファイル名
	 */
	this.get_directory_index_primary = function(){
		var $directory_index = this.get_directory_index();
		return $directory_index[0];
	} // get_directory_index_primary()


	/**
	 * ファイルの処理方法を調べる。
	 *
	 * @param string $path パス
	 * @return string 処理方法
	 * - ignore = 対象外パス
	 * - direct = 加工せずそのまま出力する(デフォルト)
	 * - その他 = process名を格納して返す
	 */
	this.get_path_proc_type = function( $path ){
		var $rtn = [];
		if( $path === null || $path === undefined ){
			$path = '/';
		}
		$path = main.utils.get_realpath( '/'+$path );
		if( main.utils79.is_dir('./'+$path) ){
			$path += '/';
		}
		$path = main.utils.normalize_path( $path );

		if( typeof($rtn[$path]) === typeof(true) ){
			return $rtn[$path];
		}

		for( var $row in _config.paths_proc_type ){
			var $type = _config.paths_proc_type[$row];
			if(typeof($row) !== typeof('')){continue;}
			var $preg_pattern = main.utils.escapeRegExp( main.utils.normalize_path( main.utils.get_realpath($row) ) );
			if( $preg_pattern.match( new RegExp('\\*') ) ){
				// ワイルドカードが使用されている場合
				$preg_pattern = main.utils.escapeRegExp($row);
				$preg_pattern = $preg_pattern.replace( new RegExp( main.utils.escapeRegExp('\\*'),'g'), '(?:.*?)');//ワイルドカードをパターンに反映
				$preg_pattern = $preg_pattern+'$';//前方・後方一致
			}else if(main.utils79.is_dir($row)){
				$preg_pattern = main.utils.escapeRegExp( main.utils.normalize_path( main.utils.get_realpath($row) )+'/');
			}else if(main.utils79.is_file($row)){
				$preg_pattern = main.utils.escapeRegExp( main.utils.normalize_path( main.utils.get_realpath($row) ));
			}
			if( $path.match( new RegExp('^'+$preg_pattern) ) ){
				$rtn[$path] = $type;
				return $rtn[$path];
			}
		}
		$rtn[$path] = 'direct';// <- default
		return $rtn[$path];
	} // get_path_proc_type();


	/**
	 * コンテンツルートディレクトリのパス(=install path) を取得する
	 * @return string コンテンツディレクトリのパス
	 */
	this.get_path_controot = function(){
		var $rtn = '/';

		if( main.utils.strlen( _config.path_controot ) ){
			$rtn = _config.path_controot;
			$rtn = $rtn.replace(new RegExp('^(.*?)\\/*$'), '$1/');
			$rtn = main.utils.normalize_path($rtn);
			return $rtn;
		}

		$rtn = main.utils.normalize_path($rtn);
		return $rtn;
	}


	/**
	 * コンテンツファイルの初期化(=なかったものを新規作成)
	 */
	this.initContentFiles = function( pagePath, opt ){
		opt = opt||{};
		opt.success = opt.success||function(){};
		opt.error = opt.error||function(){};
		opt.complete = opt.complete||function(){};
		opt.proc_type = opt.proc_type||'html';

		var pageInfo = this.site.getPageInfo(pagePath);
		if( pageInfo == null ){
			opt.error("Page not Exists.");
			opt.complete();
			return false;
		}
		var contPath = this.findPageContent(pagePath);
		if( main.fs.existsSync( this.get_realpath_controot() + contPath ) ){
			opt.error("Content Already Exists.");
			opt.complete();
			return false;
		}
		switch( opt.proc_type ){
			case 'html.gui':
			case 'html':
			case 'md':
				// OK
				break;
			default:
				opt.error('Unknown proc_type "'+opt.proc_type+'".');
				opt.complete();
				return false;
				break;
		}

		var pathInfo = main.utils.parsePath( this.get_realpath_controot() + contPath );
		var prop = {}
		prop.realpath_cont = pathInfo.path;
		prop.realpath_resource_dir = this.get_realpath_controot() + this.getContentFilesByPageContent(contPath);
		prop.proc_type = opt.proc_type;
		if( prop.proc_type == 'md' ){
			prop.realpath_cont += '.'+prop.proc_type;
		}

		main.utils.iterateFnc([
			function(it, prop){
				// 格納ディレクトリを作る
				if( main.utils79.is_dir( main.utils.dirname( prop.realpath_cont ) ) ){
					it.next(prop);
					return;
				}
				// 再帰的に作る mkdirAll()
				if( !main.utils.mkdirAll( main.utils.dirname( prop.realpath_cont ) ) ){
					opt.error(err);
					opt.complete();
					return;
				}
				it.next(prop);
			} ,
			function(it, prop){
				// コンテンツ自体を作る
				main.fs.writeFile( prop.realpath_cont, '', function(err){
					if( err ){
						opt.error(err);
						opt.complete();
						return;
					}
					it.next(prop);
				} );
			} ,
			function(it, prop){
				// リソースディレクトリを作る
				if( !main.utils79.is_dir( prop.realpath_resource_dir ) ){
					main.utils.mkdirAll( prop.realpath_resource_dir );
				}
				if( prop.proc_type == 'html.gui' ){
					try {
						main.fs.mkdirSync( prop.realpath_resource_dir + '/guieditor.ignore/' );
					} catch (e) {
						it.next(prop);
					} finally {
						main.fs.writeFile( prop.realpath_resource_dir + '/guieditor.ignore/data.json', '{}', function(err){
							if( err ){
								opt.error(err);
								opt.complete();
								return;
							}
							it.next(prop);
						} );
					}

				}else{
					it.next(prop);
				}
			} ,
			function(it, prop){
				opt.success();
				opt.complete();
				return;
				it.next(prop);
			}
		]).start(prop);

		return true;
	}

	/**
	 * 検索オブジェクトを生成・取得する
	 */
	this.createSearcher = function(){
		return new (require('./pickles.project.searcher.js'))(px, this);
	}

	/**
	 * git操作オブジェクトを生成・取得する
	 */
	this.git = function(){
		return new (require('./pickles.project.git.js'))(px, this);
	}

	/**
	 * px2-git操作オブジェクトを生成・取得する
	 */
	this.px2GitPhp = function(){
		return new (require('./pickles.project.px2GitPhp.js'))(px, this);
	}

	/**
	 * コンフィグ編集オブジェクトを生成・取得する
	 */
	this.configEditor = function(){
		return new (require('./pickles.project.configEditor.js'))(px, this);
	}

	/**
	 * プロジェクト個人設定編集画面を開く
	 */
	this.editProjectIndividualConfig = function(callback){
		var individualConfig = require('./pickles.project.individualConfig.js');
		individualConfig(main, this, callback);
	}

	/**
	 * Custom Console Extensions: サーバーサイドからの非同期イベントを受信する
	 */
	this.recieveCceEvents = function(eventType, content){
		// console.log(eventType, content);
		if( eventType == 'async' ){
			// --------------------
			// Async

			_this.px2dthelperGetAll('/', {}, function(px2all){
				var realpathDataDir = px2all.realpath_homedir+'_sys/ram/data/';
				var watchDir = main.cceWatcher.getWatchDir();
				// console.log('watchDir:', watchDir);

				var getParam = '';
				getParam += 'PX=px2dthelper.custom_console_extensions_async_run'
					+'&appMode=desktop'
					+'&asyncMethod=file'
					+'&asyncDir='+watchDir+'async/'+_this.projectInfo.id+'/'
					+'&broadcastMethod=file'
					+'&broadcastDir='+watchDir+'broadcast/'+_this.projectInfo.id+'/';
				// console.log(getParam);

				var testTimestamp = (new Date()).getTime();
				var tmpFileName = '__tmp_'+main.utils79.md5( Date.now() )+'.json';
				// console.log('=-=-=-=-=-=-=-=', realpathDataDir+tmpFileName, getParam);
				main.fs.writeFileSync( realpathDataDir+tmpFileName, getParam );

				_this.execPx2(
					'/?'+getParam,
					{
						'method': 'post',
						'bodyFile': tmpFileName,
						'complete': function(rtn){
							// console.log('--- returned(millisec)', (new Date()).getTime() - testTimestamp);
							// console.log(rtn);
							main.fsEx.unlinkSync( realpathDataDir+tmpFileName );
						}
					}
				);
			});

		}else if( eventType == 'broadcast' ){
			// --------------------
			// Broadcast
			console.log('*** Broadcast:', content);
			_cceBroadcastCallback( content );
		}
		return;
	}
	this.onCceBroadcast = function(callback){
		_cceBroadcastCallback = callback;
	}

	/**
	 * エラーメッセージを報告
	 */
	this.error = function( message ){
		// console.error( message );
		_pjError.push( {
			'message': message
		} );
		return true;
	}

	/**
	 * エラーメッセージを取得
	 */
	this.getErrors = function(){
		return _pjError;
	}

	/**
	 * エラーメッセージを消去
	 */
	this.clearErrors = function(){
		_pjError = [];
		return true;
	}

	// オブジェクトを初期化
	init();
	return this;

};
