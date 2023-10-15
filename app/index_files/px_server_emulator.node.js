/**
 * Pickles2 webserver emulator
 */
(function(exports){
	var http = require('http');
	var url = require('url');
	var fs = require('fs');
	var path = require('path');
	var express = require('express');
	var expressQueue = require('express-queue');
	var expressPickles2 = require('express-pickles2');
	var morgan = require('morgan');
	var cheerio = require('cheerio');
	var FileStreamRotator = require('file-stream-rotator');
	var _server = express();
	var _path_access_log;
	var _last_realpathEntryScript;

	var _port;
	var _running = false;
	var px;

	/**
	 * 初期化
	 */
	exports.init = function(_px){
		if(px){ return this; }

		px = _px;
		_path_access_log = path.resolve(px.getDataDir()+'/logs/')+'/';
		// console.log(_path_access_log);

		return this;
	}


	/**
	 * broccoli-html-editor が要求するコードを取得
	 */
	function getBroccoliScript(){
		var fin = '';
			fin += '<script data-broccoli-receive-message="yes">'+"\n";
			// fin += 'console.log(window.location);'+"\n";
			fin += 'window.addEventListener(\'message\',(function() {'+"\n";
			fin += 'return function f(event) {'+"\n";
			// fin += 'console.log(event.origin);'+"\n";
			// fin += 'console.log(event.data);'+"\n";
			fin += 'if(window.location.hostname!=\'127.0.0.1\'){alert(\'Unauthorized access.\');return;}'+"\n";
			fin += 'if(!event.data.scriptUrl){return;}'+"\n";
			fin += 'var s=document.createElement(\'script\');'+"\n";
			fin += 'document.querySelector(\'body\').appendChild(s);s.src=event.data.scriptUrl;'+"\n";
			fin += 'window.removeEventListener(\'message\', f, false);'+"\n";
			fin += '}'+"\n";
			fin += '})(),false);'+"\n";
			fin += '</script>'+"\n";
		return fin;
	}

	/**
	 * サーバーを起動
	 */
	exports.start = function(port, callback){
		callback = callback||function(){};
		_port = port;

		if( _running ){
			callback(true);
			return this;
		}

		var accessLogStream;
		(function(){
			// ensure log directory exists
			fs.existsSync(_path_access_log) || fs.mkdirSync(_path_access_log);

			// create a rotating write stream
			accessLogStream = FileStreamRotator.getStream({
				'date_format': 'YYYYMMDD',
				'filename': path.join(_path_access_log, 'access-%DATE%.log'),
				'frequency': 'daily',
				'verbose': false
			});

			// setup the logger
			_server.use(
				morgan(
					'combined',
					{
						'stream': accessLogStream
					}
				)
			);
		})();


		(function(){
			var accessRestriction = 'loopback';
			try {
				accessRestriction = px.getDb().network.preview.accessRestriction;
			} catch (e) {
			}

			if( accessRestriction == 'off' ){
				// 制限をかけない
				return;
			}

			// IPアクセス制限
			// loopback = 127.0.0.1/8, ::1/128
			_server.set('trust proxy', ['loopback']);
			_server.use('/*', function(req, res, next){
				// console.log(req.ip);
				// console.log(req.connection.remoteAddress);

				if( !px.isLoopbackIp( req.ip ) ){
					res
						.set('Content-Type', 'text/html')
						.status(403)
						.type('html')
						.send('Not allowed IP address. (' + req.ip + ')')
						.end()
					;
					return;
				}

				next();
				return;
			} );
		})();

		// Content-type が認識されなくなることがある問題の対応として、
		// etagを出力しないように変更。
		_server.set('etag', false);

		// Express Queue
		_server.use(expressQueue({ activeLimit: 1, queuedLimit: -1 }));

		// setup Pickles 2
		_server.use('/*', expressPickles2(
			null,
			{
				'liveConfig': function(callback){
					var pj = px.getCurrentProject();
					var realpathEntryScript = path.resolve(pj.get('path'), pj.get('entry_script'));
					if( _last_realpathEntryScript !== realpathEntryScript ){
						// console.log(realpathEntryScript);
						_last_realpathEntryScript = realpathEntryScript;
						accessLogStream.write(
							'Switch Project to: ' + realpathEntryScript+"\n",
							'utf-8'
						);
						callback(
							realpathEntryScript,
							{}
						);
						return;
					}else{
						callback(
							realpathEntryScript,
							{}
						);
						return;
					}
				},
				'processor': function(html, ext, callback, response){
					// console.log(response);
					if( ext == 'html' ){

						(function(){
							var $ = cheerio.load(html, {decodeEntities: false});
							$('[data-px2-clover-preview-widget]').remove();
							html = $.html();
						})();

						if( html.match('<script data-broccoli-receive-message="yes">') ){
							// すでに挿入済みの場合はスキップする。
							// `external_preview_server_origin` が導入された際に、
							// px2-px2dthelper にこのタグを挿入する機能が追加された。
							// ただしこれはオプションなので、適用される場合とされない場合がある。
							// なのでここでは、有無をチェックし、挿入されていない場合にのみ、挿入する。
						}else{
							html += getBroccoliScript();

							var errorHtml = '';
							if( response.status != 200 ){
								errorHtml += '<ul style="background-color: #fee; border: 3px solid #f33; padding: 10px; margin: 0.5em; border-radius: 5px;">';
								errorHtml += '<li style="color: #f00; list-style-type: none;">STATUS: '+response.status+' '+response.message+'</li>';
								errorHtml += '</ul>';
							}
							if( response.errors.length ){
								errorHtml += '<ul style="background-color: #fee; border: 3px solid #f33; padding: 10px; margin: 0.5em; border-radius: 5px;">';
								for( var idx in response.errors ){
									errorHtml += '<li style="color: #f00; list-style-type: none;">'+response.errors[idx]+'</li>';
								}
								errorHtml += '</ul>';
							}
							if( errorHtml.length ){
								html += '<div style="position: fixed; top: 10px; left: 5%; width: 90%; font-size: 14px; opacity: 0.8; z-index: 2147483000;" onclick="this.style.display=\'none\';">';
								html += errorHtml;
								html += '</div>';
							}
						}
					}
					callback(html);
					return;
				},
				'bin': px.nodePhpBinOptions.bin,
				'ini': px.nodePhpBinOptions.ini,
				'extension_dir': px.nodePhpBinOptions.extension_dir
			},
			_server
		) );


		// 指定ポートでLISTEN状態にする
		var listenResult;
		var timerListeningCallbackFalse = setTimeout(function(){
			console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=');
			if( !listenResult.listening ){
				console.error( 'Failed to start Pickles 2 server emulator; port: '+_port+', NOT standby;' );
				callback(false);
				return;
			}
			callback(true);
		}, 2000);
		listenResult = _server.listen(_port, function(a){
			clearTimeout(timerListeningCallbackFalse); // 成功したらエラー応答のタイマーをキャンセル
			_running = true;
			console.log( 'Pickles 2 server emulator started;' );
			console.log( 'port: '+_port );
			console.log( 'standby;' );
			callback(true);
		});

		return this;
	}// start();


})(exports);
