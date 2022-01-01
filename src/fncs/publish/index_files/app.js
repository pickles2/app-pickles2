/**
 * Publish: app.js
 */
window.px = window.parent.main;
window.main = window.parent.main;
window.contApp = new (function(main, $){
	var _this = this;
	var _pj, _realpathPublishDir;
	var $cont;
	var _patterns;
	var currentQueueId;
	var justClosedNow;

	this.progressReport = new(require('../../../fncs/publish/index_files/libs.ignore/progressReport.js'))(this, main, $);
	this.resultReport = new(require('../../../fncs/publish/index_files/libs.ignore/resultReport.js'))(this, main, $);

	/**
	 * initialize
	 */
	function init(){
		main.progress.start({
			'blindness':false
		});

		_pj = main.getCurrentProject();
		_realpathPublishDir = main.path.resolve( _pj.get('path')+'/'+_pj.get('home_dir')+'/_sys/ram/publish/' )+'/';
		$cont = $('.contents');
		$cont.html('');

		try {
			// パブリッシュパターンの設定を読み込む。
			_patterns = _pj.getConfig().plugins.px2dt.publish_patterns;
		} catch (e) {
		}

		main.it79.fnc({}, [
			function(it){
				$cont.append( $('#template-scenes').html() ).find('.cont_scene').hide();
				_this.progressReport.init($cont);
				it.next();
			} ,
			function(it){
				_this.checkPublishStatus(function(status){
					if( status.applockExists ){
						// パブリッシュ中だったら
						$cont.find('#cont_on_publish').show();
					}else if( status.publishLogExists && status.htdocsExists ){
						// パブリッシュが完了していたら
						$cont.find('#cont_after_publish').show();
						_this.resultReport.init();
					}else{
						// パブリッシュ前だったら
						$cont.find('#cont_before_publish').show();
					}
					it.next();
				});
			} ,
			function(it){
				main.commandQueue.client.destroyTerminal('publish');
				main.commandQueue.client.createTerminal(null, {
					"name": "publish",
					"tags": [
						'pj-'+_pj.get('id'),
						'pickles2-publish'
					],
					"write": function(message){
						// console.log('terminal message', message);
						if(message.command == 'open'){
							$('.cont_scene').hide();
							$('#cont_before_publish-progress').show();
							currentQueueId = message.queueItemInfo.id;
						}else if(message.command == 'stdout'){
							_this.progressReport.updateView(message.data.join(''));
							currentQueueId = message.queueItemInfo.id;
						}else if(message.command == 'close'){
							currentQueueId = undefined;
							_this.checkPublishStatus(function(status){
								$('.cont_scene').hide();
								if( status.applockExists ){
									// パブリッシュ中だったら
									$cont.find('#cont_on_publish').show();
								}else if( status.publishLogExists && status.htdocsExists ){
									// パブリッシュが完了していたら
									$cont.find('#cont_after_publish').show();
									_this.resultReport.init();
									_this.progressReport.resetView();
								}else{
									// パブリッシュ前だったら
									if(justClosedNow){
										$cont.find('#cont_after_publish-zero_files').show();
									}else{
										$cont.find('#cont_before_publish').show();
									}
								}
								justClosedNow = undefined;
							});
						}
					}
				});
				it.next();
			} ,
			function(it){
				setTimeout(function(){
					main.progress.close();
					it.next();
				}, 10);
			}
		]);
	}

	/**
	 * パブリッシュの状態を調べる
	 */
	this.checkPublishStatus = function(callback){
		callback = callback || function(){};
		var status = {};
		main.it79.fnc({}, [
			function(it){
				main.fs.exists( _realpathPublishDir+'applock.txt', function(result){
					status.applockExists = result;
					it.next();
				} );
			} ,
			function(it){
				status.pid = null;
				status.lastPublishStartedDateTime = null;
				if(!status.applockExists){
					it.next();
					return;
				}
				main.fs.readFile( _realpathPublishDir+'applock.txt', function(err, data){
					if(err){
						it.next();
						return;
					}
					var src = data.toString();
					if(src.match(/ProcessID\=([0-9]*)/)){
						status.pid = Number(RegExp.$1);
					}
					if(src.match(/([0-9]*\-[0-9]{2}\-[0-9]{2} [0-9]{2}\:[0-9]{2}\:[0-9]{2})/)){
						status.lastPublishStartedDateTime = RegExp.$1;
					}
					it.next();
				} );
			} ,
			function(it){
				main.fs.exists( _realpathPublishDir+'publish_log.csv', function(result){
					status.publishLogExists = result;
					it.next();
				} );
			} ,
			function(it){
				main.fs.exists( _realpathPublishDir+'alert_log.csv', function(result){
					status.alertLogExists = result;
					it.next();
				} );
			} ,
			function(it){
				main.fs.exists( _realpathPublishDir+'htdocs/', function(result){
					status.htdocsExists = result;
					it.next();
				} );
			} ,
			function(it){
				callback(status);
			}
		]);
		return;
	}

	/**
	 * パブリッシュを実行する
	 */
	this.publish = function(){
		var $body = $( $('#template-dialog_publish_options').html() );
		try {
			if(_pj.appdata.get().publishOption.last){
				var path_region = [_pj.appdata.get().publishOption.last.path_region];
				path_region = path_region.concat(_pj.appdata.get().publishOption.last.paths_region);
				try {
					$body.find('textarea[name=path_region]').val( path_region.join("\n") );
				} catch (e) {
					$body.find('textarea[name=path_region]').val( '/' );
				}
				try {
					$body.find('textarea[name=paths_ignore]').val( _pj.appdata.get().publishOption.last.paths_ignore.join("\n") );
				} catch (e) {
					$body.find('textarea[name=paths_ignore]').val( '' );
				}
				try {
					$body.find('input[name=keep_cache]').prop("checked", !!(_pj.appdata.get().publishOption.last.keep_cache));
				} catch (e) {
					$body.find('input[name=keep_cache]').prop("checked", false);
				}
			}
		} catch (e) {
		}

		(function(){
			// パブリッシュパターンの選択UIを作る
			var $pattern = $body.find('.cont_form_pattern');
			$pattern.css({
				'margin':'1em auto'
			});
			try {
				// console.log(patterns);
				if( typeof(_patterns) !== typeof([]) || !_patterns.length){
					$pattern.remove();
				}else{
					var $select = $pattern.find('select');
					$select.append('<option value="">select pattern...</option>');
					for( var idx in _patterns ){
						var $opt = $('<option>');
						$opt.attr({'value': idx});
						$opt.text( _patterns[idx].label );
						$select.append($opt);
					}
					$select.change(function(){
						var selectedValue = $(this).val();
						// alert(selectedValue);
						var data = _patterns[selectedValue];
						$(this).val('');
						if( !data ){
							alert('ERROR: 設定を読み込めません。');
							return;
						}
						try {
							$body.find('textarea[name=path_region]').val( data.paths_region.join("\n") );
						} catch (e) {
							$body.find('textarea[name=path_region]').val( '/' );
						}
						try {
							$body.find('textarea[name=paths_ignore]').val( data.paths_ignore.join("\n") );
						} catch (e) {
							$body.find('textarea[name=paths_ignore]').val( '' );
						}
						try {
							$body.find('input[name=keep_cache]').prop("checked", !!(data.keep_cache));
						} catch (e) {
							$body.find('input[name=keep_cache]').prop("checked", false);
						}
						return;
					});
				}
			} catch (e) {
				// 設定されていなかったら選択欄を削除
				$pattern.remove();
			}
		})();

		px2style.modal({
			title: 'パブリッシュ',
			body: $body,
			width: 1024,
			buttons: [
				$('<button>')
					.text('パブリッシュを実行する')
					.attr({'type':'submit'})
					.addClass('px2-btn px2-btn--primary')
					.on('click', function(){
						var str_paths_region_val = $body.find('textarea[name=path_region]').val();
						var str_paths_region = '';
						var tmp_ary_paths_region = str_paths_region_val.split(new RegExp('\r\n|\r|\n','g'));
						var ary_paths_region = [];
						for( var i in tmp_ary_paths_region ){
							tmp_ary_paths_region[i] = main.php.trim(tmp_ary_paths_region[i]);
							if( main.php.strlen(tmp_ary_paths_region[i]) ){
								ary_paths_region.push( tmp_ary_paths_region[i] );
							}
						}
						if( !ary_paths_region.length ){
							alert('パブリッシュ対象が指定されていません。1件以上指定してください。');
							return true;
						}
						var path_region = ary_paths_region.shift();

						var str_paths_ignore_val = $body.find('textarea[name=paths_ignore]').val();
						var str_paths_ignore = '';
						var ary_paths_ignore = str_paths_ignore_val.split(new RegExp('\r\n|\r|\n','g'));
						for( var i in ary_paths_ignore ){
							ary_paths_ignore[i] = main.php.trim(ary_paths_ignore[i]);
							if( !main.php.strlen(ary_paths_ignore[i]) ){
								ary_paths_ignore[i] = undefined;
								delete(ary_paths_ignore[i]);
							}
						}
						if( typeof(ary_paths_ignore) == typeof('') ){
							ary_paths_ignore = [ary_paths_ignore];
						}

						var keep_cache = ( $body.find('input[name=keep_cache]:checked').val() ? 1 : 0 );

						// パブリッシュ条件入力ダイアログを閉じる
						px2style.closeModal();

						_pj.appdata.get().publishOption = _pj.appdata.get().publishOption || {};
						_pj.appdata.get().publishOption.last = {
							"path_region": path_region,
							"paths_region": ary_paths_region,
							"paths_ignore": ary_paths_ignore,
							"keep_cache": keep_cache
						};
						_pj.appdata.save(function(){});

						var px2cmd_options = '';
						px2cmd_options += 'path_region='+encodeURIComponent(path_region);
						for(var idx in ary_paths_region){
							px2cmd_options += '&paths_region[]='+encodeURIComponent(ary_paths_region[idx]);
						}
						for(var idx in ary_paths_ignore){
							px2cmd_options += '&paths_ignore[]='+encodeURIComponent(ary_paths_ignore[idx]);
						}
						if(keep_cache){
							px2cmd_options += '&keep_cache=1';
						}

						// パブリッシュコマンドを発行する
						main.commandQueue.addQueuePxCmdItem(
							'/?PX=publish.run&'+px2cmd_options,
							{
								'cdName': 'default',
								'tags': [
									'pj-'+_pj.get('id'),
									'pickles2-publish'
								],
								'accept': function(queueId){
									// console.log(queueId);
									currentQueueId = queueId;
								},
								'open': function(message){
								},
								'stdout': function(message){
									// _this.updateView(message.data.join(''));
								},
								'stderr': function(message){
									// _this.updateView(message.data.join(''));
								},
								'close': function(message){
									justClosedNow = true;
									if(message.data !== 0){
										main.message( 'パブリッシュが正常に完了できませんでした。ご確認ください。' );
									}else{
										main.message( 'パブリッシュを完了しました。' );
									}
									_pj.updateGitStatus();
									return;
								}
							}
						);
					}),
			],
			buttonsSecondary: [
				$('<button>')
					.text(main.lb.get('ui_label.cancel'))
					.addClass('px2-btn')
					.on('click', function(){
						px2style.closeModal();
						_pj.updateGitStatus();
					})
			]
		});

		return true;
	}

	/**
	 * パブリッシュを中断する
	 */
	this.cancel = function(){
		main.commandQueue.client.killQueueItem(currentQueueId);
		main.fs.unlinkSync( _realpathPublishDir+'applock.txt' );
	}

	/**
	 * 一時パブリッシュ先ディレクトリを開く
	 */
	this.open_publish_tmp_dir = function(){
		window.main.utils.openURL(_pj.get('path')+'/'+_pj.get('home_dir')+'/_sys/ram/publish/');
	}

	/**
	 * パブリッシュ先ディレクトリを開く
	 */
	this.open_publish_dir = function(){
		var conf = _pj.getConfig();
		if( !conf.path_publish_dir ){
			alert('パブリッシュ先ディレクトリは設定されていません。\nプロジェクト設定(config.php) で $conf->path_publish_dir を設定してください。');
			return;
		}

		var path = '';
		if( typeof(conf.path_publish_dir) == typeof('') ){
			path = main.path.resolve( main.php.dirname(_pj.get('path')+'/'+_pj.get('entry_script')), conf.path_publish_dir );
		}
		if( !main.utils.isDirectory(path) ){
			alert('設定されたパブリッシュ先ディレクトリが存在しません。存在する有効なディレクトリである必要があります。\nプロジェクト設定(config.php) で $conf->path_publish_dir を設定してください。');
			return;
		}
		window.main.utils.openURL(path);
	}

	/**
	 * パブリッシュ中状態からの復旧方法の開閉
	 */
	this.toggle_how_to_recovery_on_publish = function(target,a){
		var $this = $(a);
		var $target = $(target);
		$target.toggle('fast',function(){
			$this.removeClass('glyphicon-menu-right').removeClass('glyphicon-menu-down');
			if( $target.is(":hidden") ){
				$this.addClass('glyphicon-menu-right');
			}else{
				$this.addClass('glyphicon-menu-down');
			}
		});
	}

	/**
	 * パブリッシュディレクトリのパスを取得
	 */
	this.getRealpathPublishDir = function(){
		return _realpathPublishDir;
	}


	function windowResized(){
		$('.contents')
			.height( $(window).innerHeight() - $('.theme-h1-container').eq(0).height() - 20 - 15 )
		;
		$('.cont_canvas')
			.height( $(window).innerHeight() - $('.theme-h1-container').eq(0).height() - $cont.find('.cont_buttons').eq(0).height() - 30 - 15 )
		;
	}

	$(window).on('load', function(){
		init();
		windowResized();

		$(window).on('resize', function(){
			windowResized();
		});
	});

	return this;
})(main, $);
