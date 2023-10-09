(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
							tmp_ary_paths_region[i] = main.utils79.trim(tmp_ary_paths_region[i]);
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
							ary_paths_ignore[i] = main.utils79.trim(ary_paths_ignore[i]);
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

},{"../../../fncs/publish/index_files/libs.ignore/progressReport.js":2,"../../../fncs/publish/index_files/libs.ignore/resultReport.js":3}],2:[function(require,module,exports){
/**
 * Publish: progressReport.js
 */
module.exports = function(contApp, px, $){
	var _this = this;
	var _pj = px.getCurrentProject();
	var $results, $phase, $currentTask, $timer, $row, $progressBar;
	var phase;
	var _timer;

	/**
	 * レポート表示の初期化
	 */
	this.init = function(){
		$results = $('#cont_before_publish-progress');
		$timer = $results.find('.cont_progress-timer');
		$row = $results.find('.cont_progress-row');
		$phase = $results.find('.cont_progress-phase').css({'font-weight':'bold'});
		$currentTask = $results.find('.cont_progress-currentTask');
		$progressBar = $results.find('.cont_progress-bar [role=progressbar]');
	}

	/**
	 * 進捗画面をリセットする
	 */
	this.resetView = function(){
		clearTimeout(_timer);
		$phase.text('');
		$currentTask.text('');
		$row.text('');
		$timer.text('');
		$progressBar.attr({'aria-valuenow':0}).css({'width':'0%'});
	}

	/**
	 * 進捗レポート画面を更新する
	 */
	this.updateView = function(data){

		if( !$results.is(':visible') ){
			$('.cont_scene').hide();
			$results.show();
		}

		try {
			var data = data.toString();
			var rows = data.split(new RegExp('(\r\n|\r|\n)+'));
		} catch (e) {
		}

		for( var idx in rows ){
			var row = px.utils79.trim( rows[idx] );
			if( typeof(row) !== typeof('') || !row.length ){
				continue;
			}
			if( row.match( new RegExp('^\\#\\#([\\s\\S]+)$') ) ){
				phase = px.utils79.trim( RegExp.$1 );
				if( phase == 'Start publishing' ){
					$phase.text( 'Publishing...' );
					(function(){
						var startTimestamp = (new Date).getTime();
						function updateTimer(){
							var time = (new Date).getTime() - startTimestamp;
							$timer.text( Math.floor(time/1000) + ' sec' );
							_timer = setTimeout( updateTimer, 25 );
						}
						updateTimer();
					})();
				}else{
					$phase.text( phase );
				}
			}else if( phase == 'Start publishing' ){
				if( row.match( new RegExp('^([0-9]+)\\/([0-9]+)$') ) ){
					$currentTask.text( RegExp.$1 +' / '+ RegExp.$2 );
					var per = RegExp.$1/RegExp.$2*100;
					$progressBar.attr({'aria-valuenow':per}).css({'width':per+'%'});
				}else if( row.match( new RegExp('^\\/([\\s\\S]+)$') ) ){
					$row.text(row);
				}
			}else if( phase == 'Clearing caches' ){
				$row.text(row);
			}else if( phase == 'Making list' ){
				$row.text(row);
			}else if( phase == 'Sync to publish directory.' ){
				clearTimeout(_timer);
				$row.text('');
			}else if( phase == 'done.' ){
				clearTimeout(_timer);
				$row.text('');
			}else{
				$row.text('');
			}
			// console.log( row );
		}
	}

	return this;

}

},{}],3:[function(require,module,exports){
/**
 * Publish: resultReport.js
 */
module.exports = function(contApp, px, $){
	var _this = this;

	var $scene, $results, $rows, $summaries, $spentTime, $totalFileCount, $errorMessage;
	var publishStatus;
	var errorReports = [];

	/**
	 * レポート表示の初期化
	 */
	this.init = function(){
		$scene = $('#cont_after_publish');
		if( !$scene.is(':visible') ){
			$('.cont_scene').hide();
			$scene.show();
		}
		$scene.find('.cont_results-error').removeClass('cont_results-error');

		$canvas = $scene.find('.cont_canvas');
		$results = $canvas.find('.cont_results');
		$canvas
			.height( $(window).height() - $('.theme-h1-container').eq(0).height() - $scene.find('.cont_buttons').height() - 20 )
		;


		$rows = $results.find('.cont_results-rows');
		$summaries = $results.find('.cont_results-summaries');
		$spentTime = $results.find('.cont_results-spentTime span');
		$totalFileCount = $results.find('.cont_results-total_file_count strong');
		$errorMessage = $results.find('.cont_results-errorMessage');

		px.it79.fnc({}, [
			function( it, arg ){
				d3.csv( 'file://'+contApp.getRealpathPublishDir()+"publish_log.csv" )
					.row(function(d) {
						var rtn = {};
						rtn.datetime = d['datetime'];
						rtn.path = d['path'];
						rtn.procType = d['proc_type'];
						rtn.statusCode = d['status_code'];
						return rtn;
					})
					.get(function(error, csv) {
						// console.log(csv);
						arg.publishLogCsv = csv;
						it.next(arg);
					})
				;
			} ,
			function( it, arg ){
				contApp.checkPublishStatus(function(res){
					// console.log(res);
					publishStatus = res;
					it.next(arg);
				});
			} ,
			function( it, arg ){

				arg.alertLogCsv = [];
				if( !publishStatus.alertLogExists ){
					it.next(arg);
					return;
				}

				errorReports = [];
				d3.csv( 'file://'+contApp.getRealpathPublishDir()+"alert_log.csv" )
					.row(function(d) {
						var rtn = {};
						rtn.datetime = d['datetime'];
						rtn.path = d['path'];
						rtn.errorMessage = d['error_message'];
						errorReports.push(rtn);
						return rtn;
					})
					.get(function(error, csv) {
						// console.log(csv);
						arg.alertLogCsv = csv;
						it.next(arg);
					})
				;
			} ,
			function( it, arg ){
				var count = arg.publishLogCsv.length;
				var startDateTime = arg.publishLogCsv[0].datetime;
				var endDateTime = arg.publishLogCsv[arg.publishLogCsv.length-1].datetime;
				var time = Date.parse( endDateTime ) - Date.parse( startDateTime );

				function updateTotalFileCounter( count, i ){
					i ++;
					var t = 50;
					if( t == i ){
						// 全量完了
						$totalFileCount.text( count );

						if( publishStatus.alertLogExists ){
							$results.addClass('cont_results-error');
							var $a = $('<a href="#">');
							$a.text(arg.alertLogCsv.length + '件のエラーが検出されています。');
							$errorMessage
								.html( '' )
								.append( $a )
							;
							$a.on('click', function(){
								_this.openErrorReports();
							});
						}
						return;
					}
					$totalFileCount.text( Math.round(count/t*i) );
					setTimeout( function(){ updateTotalFileCounter( count, i ); }, 2 );
				}
				updateTotalFileCounter( count, 0 );

				function updateSpentTime( time, i ){
					i ++;
					var t = 35;
					if( t == i ){
						// 全量完了
						$spentTime.text( time + ' sec' );
						return;
					}
					$spentTime.text( Math.round(time/t*i) + ' sec' );
					setTimeout( function(){ updateSpentTime( time, i ); }, 4 );
				}
				updateSpentTime( (time/1000), 0 );


				var rows = [];
				var summaries = {
					'procTypes': {} ,
					'statusCodes': {}
				};
				// d3.select( $canvas.get(0) ).html(arg.publishLogCsv);

				px.utils.iterate(
					arg.publishLogCsv,
					function( it2, row2, idx2 ){

						// 行データ
						rows.push( row2 );

						// 統計
						if( !summaries.procTypes[row2.procType] ){ summaries.procTypes[row2.procType] = 0; };
						summaries.procTypes[row2.procType] ++;

						if( !summaries.statusCodes[row2.statusCode] ){ summaries.statusCodes[row2.statusCode] = 0; };
						summaries.statusCodes[row2.statusCode] ++;
						// console.log(summaries);

						(function(){
							var table = d3.select( $summaries.find('table').get(0) );
							table.select('tr.cont_procTypes td')
								.data([summaries.procTypes])
								.html(
									function(d, i){
										var ul = $('<ul>');
										for( var idx in d ){
											ul.append( $('<li>').text( idx + ': ' + d[idx] ) );
										}
										return ul.html();
									}
								)
							;
							table.select('tr.cont_statusCodes td')
								.data([summaries.statusCodes])
								.html(
									function(d, i){
										var ul = $('<ul>');
										for( var idx in d ){
											ul.append( $('<li>').text( idx + ': ' + d[idx] ) );
										}
										return ul.html();
									}
								)
							;
						})();

						setTimeout( function(){
							it2.next();
						}, 0 );

					} ,
					function(){
						it.next(arg);
					}
				);

			}
		]);

	} // this.init();

	/**
	 * エラー内容を表示する
	 */
	this.openErrorReports = function(){

		$body = $('<div>');
		if( !errorReports.length ){
			$body.append('<p>エラーレポートはありません。</p>')
		}else{
			$body.append('<p>'+errorReports.length+'件のエラーがあります。</p>')
			var $table = $('<table class="px2-table"><thead></thead><tbody></tbody></table>');
			$body.append($table);
			$table.find('thead')
				.append( $('<tr>')
					.append( $('<td>').text('時刻') )
					.append( $('<td>').text('パス') )
					.append( $('<td>').text('メッセージ') )
				)
			;
			errorReports.forEach(function(error){
				$table.find('tbody')
					.append( $('<tr>')
						.append( $('<td>').text(error.datetime) )
						.append( $('<td>').text(error.path) )
						.append( $('<td>').text(error.errorMessage) )
					)
				;
			});
		}

		px2style.modal({
			title: 'エラーレポート一覧',
			body: $body,
			width: 880,
			buttons: [
				$('<button class="px2-btn">')
					.text('OK')
					.on('click', function(){
						_this.closeErrorReports();
					})
			]
		});
	}

	/**
	 * エラー内容表示を閉じる
	 */
	this.closeErrorReports = function(){
		px2style.closeModal();
	}

	return this;
}

},{}]},{},[1])