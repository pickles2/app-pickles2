(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function(){
	window.px = window.parent.px;
	var systemInfoCollector = new (require('../../../mods/systeminfo/index_files/libs.ignore/system.js'))(window.px);
	var applicationInfoCollector = new (require('../../../mods/systeminfo/index_files/libs.ignore/application.js'))(window.px);
	var tableTemplate;

	$(window).load( function(){
		px.it79.fnc({}, [
			function(it1, arg){
				console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= System Info =-=-=-=-=-=');
				console.log('------------------- px', px);
				console.log('------------------- process', px.process);
				console.log('------------------- window', window.parent);
				tableTemplate = $('#template-table').html();
				it1.next();
			},
			function(it1, arg){
				// --------------------------------------
				// ボタンアクション設定： フィードバック送信
				$('.cont_support-page-link button')
					.on('click', function(){
						px.utils.openURL( px.packageJson.pickles2.forum.url );
						return false;
					})
					.text(px.packageJson.pickles2.forum.title + ' ページへ、フィードバックを投稿してください。')
				;

				// --------------------------------------
				// ボタンアクション設定： 設定データフォルダを開く
				$('.cont_open-data-dir button')
					.on('click', function(){
						px.openDataDir();
						return false;
					})
				;

				// --------------------------------------
				// ボタンアクション設定： Command Queue のメイン端末を開く
				$('.cont_open-command-queue-main-terminal button')
					.on('click', function(){
						px.commandQueue.show();
						return false;
					})
				;

				// --------------------------------------
				// ボタンアクション設定： 自動更新のチェック
				$('.cont_update-check button')
					.on('click', function(){
						var upd = px.getAutoUpdater().getUpdater();
						// console.log(upd);

						// ------------- Step 1 -------------
						upd.checkNewVersion(function(error, newVersionExists, manifest) {
							if( error ){
								console.error(error);
								return;
							}
							if ( !newVersionExists ) {
								alert('お使いのアプリケーションは最新版です。');

							} else {
								if( !confirm('新しいバージョンが見つかりました。更新しますか？') ){
									return;
								}
								if( !confirm('アプリケーションの更新には、数分かかることがあります。 更新中には作業は行なえません。 いますぐ更新しますか？') ){
									return;
								}
								px.message('インストーラーをダウンロードしています...。');

								// ------------- Step 2 -------------
								upd.download(function(error, filename) {
									if( error ){
										console.error(error);
										return;
									}

									px.message('インストーラーアーカイブを展開しています...。');

									// ------------- Step 3 -------------
									upd.unpack(filename, function(error, newAppPath) {
										if( error ){
											console.error(error);
											return;
										}

										px.message('インストールの準備が整いました。インストーラーを起動します。');
										setTimeout(function(){
											// ------------- Step 4 -------------
											upd.runInstaller(newAppPath, [upd.getAppPath(), upd.getAppExec()],{});
											px.exit();
											return;
										}, 3000);

									}, manifest);

								}, manifest);

							}
						});

						return false;
					})
				;

				it1.next();
			},
			function(it1, arg){
				// --------------------------------------
				// アプリケーション情報テーブル描画
				applicationInfoCollector.getInfo(function(result){
					var html = px.utils.bindEjs(
						tableTemplate,
						{
							"info": result
						}
					);
					$('.cont_application-information-table').html( html );
					it1.next();
				});

			},
			function(it1, arg){
				// --------------------------------------
				// システム情報テーブル描画
				systemInfoCollector.getInfo(function(result){
					var html = px.utils.bindEjs(
						tableTemplate,
						{
							"info": result
						}
					);
					$('.cont_system-information-table').html( html );
					it1.next();
				});

			},
			function(it1, arg){
				console.log('system info done.');
				it1.next();
			}
		]);

	} );

})();

},{"../../../mods/systeminfo/index_files/libs.ignore/application.js":2,"../../../mods/systeminfo/index_files/libs.ignore/system.js":3}],2:[function(require,module,exports){
/**
 * application.js
 */
module.exports = function(px){
	var _this = this;

	this.getInfo = function(callback){
		callback = callback || function(){};
		var systemInfo = [];

		px.it79.fnc({}, [
			function(it1, arg){
				// --------------------------------------
				// 情報収集: Pickles 2 Application Version
				systemInfo.push({'label': 'Pickles 2 Application Version', 'value': px.getVersion()});
				it1.next();
			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: Platform
				systemInfo.push({'label': 'Platform', 'value': px.process.platform + ' - ' + px.getPlatform()});
				it1.next();
			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: Current directory
				systemInfo.push({'label': 'Current directory', 'value': px.process.cwd()});
				it1.next();

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: node version
				systemInfo.push({'label': 'node(inside nw) version', 'value': px.process.versions.node});
				systemInfo.push({'label': 'nw version', 'value': px.process.versions.nw});
				systemInfo.push({'label': 'openssl version', 'value': px.process.versions.openssl});
				it1.next();

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: Preview URL
				systemInfo.push({'label': 'Preview URL', 'value': px.preview.getUrl()});
				it1.next();

			},
			function(it1, arg){
				callback(systemInfo);
			}
		]);

		return;
	}

	return;
}

},{}],3:[function(require,module,exports){
/**
 * system.js
 */
module.exports = function(px){
	var _this = this;

	this.getInfo = function(callback){
		callback = callback || function(){};
		var systemInfo = [];

		px.it79.fnc({}, [
			function(it1, arg){
				// --------------------------------------
				// 情報収集: User name
				px.utils.exec(
					'whoami',
					function(err,stdout,stderr){
						systemInfo.push({'label': 'User name', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: PHP Version
				px.utils.exec(
					px.cmd('php') + ' -v',
					function(err,stdout,stderr){
						systemInfo.push({'label': 'PHP version', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: PHP path
				px.utils.exec(
					(px.cmd('php')=='php'?'which '+px.cmd('php'):'echo '+px.cmd('php')),
					function(err,stdout,stderr){
						systemInfo.push({'label': 'PHP path', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: composer version
				px.utils.exec(
					px.cmd('php') + ' ' + px.cmd('composer') + ' --version',
					function(err,stdout,stderr){
						systemInfo.push({'label': 'composer version', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: git version
				px.utils.exec(
					px.cmd('git') + ' --version',
					function(err,stdout,stderr){
						systemInfo.push({'label': 'git version', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: git path
				px.utils.exec(
					(px.cmd('git')=='git'?'which '+px.cmd('git'):'echo '+px.cmd('git')),
					function(err,stdout,stderr){
						systemInfo.push({'label': 'git path', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: node version
				px.utils.exec(
					'node -v',
					function(err,stdout,stderr){
						systemInfo.push({'label': 'node version', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: npm version
				px.utils.exec(
					'npm -v',
					function(err,stdout,stderr){
						systemInfo.push({'label': 'npm version', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				callback(systemInfo);
			}
		]);

		return;
	}

	return;
}

},{}]},{},[1])