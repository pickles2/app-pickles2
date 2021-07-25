/**
 * Setting Condition Checker
 */
module.exports = function(main, window){
	var _this = this;
	var $ = window.jQuery;
	var px2style = window.px2style;
	var it79 = main.it79;

	/**
	 * 状態をチェックする
	 */
	this.check = function(callback){
		it79.fnc({}, [
			function(it79){
				setTimeout(function(){
					it79.next();
				}, 50);
			},
			function(it79){
				checkCmd('php', function(res){
					console.log('php:', res);
					if( !res.available ){
						alert('phpコマンドが利用できません。'+"\n"+'アプリケーション設定から、phpコマンドのパスの設定を見直してください。');
					}
					it79.next();
				});
			},
			function(it79){
				checkCmd('git', function(res){
					console.log('git:', res);
					if( !res.available ){
						alert('gitコマンドが利用できません。'+"\n"+'アプリケーション設定から、gitコマンドのパスの設定を見直してください。');
					}
					it79.next();
				});
			},
			function(){
				callback();
			},
		]);
	}


	/**
	 * コマンドが利用可能かチェックする
	 */
	function checkCmd(cmd, callback){
		var res = {
			"available": false,
			"stdout": '',
			"stderr": '',
			"code": false,
		};

		var subCmd = ['-v'];
		if( cmd == 'git' ){
			subCmd = ['--version'];
		}
		var targetCmd = cmd;

		if( main.px2dtLDA.db.commands && main.px2dtLDA.db.commands[cmd] ){
			targetCmd = main.px2dtLDA.db.commands[cmd];
		}
		console.log('--- cmd:', targetCmd + ' ' + subCmd.join(' '));

		window.px.utils.spawn(
			targetCmd,
			subCmd,
			{
				success: function(data){
					res.stdout = data.toString();
					res.available = true;
					// console.log(res.stdout);
				} ,
				error: function(data){
					res.stderr = data.toString();
					// console.error(data.toString());
				} ,
				complete: function(code){
					// console.log(code);
					res.code = code;
					if( !res.available || res.code !== 0 ){
						cmdSettingDialog(cmd, res, function(){
							checkCmd(cmd, callback);
							return;
						});
						return;
					}
					callback(res);
				}
			}
		);

		return;
	}


	/**
	 * コマンドが利用できない状態の場合に、設定画面を表示する
	 */
	function cmdSettingDialog( cmd, res, callback ){
		var targetCmd = cmd;
		if( main.px2dtLDA.db.commands && main.px2dtLDA.db.commands[cmd] ){
			targetCmd = main.px2dtLDA.db.commands[cmd];
		}

		var $body = $('<div>');
		$body
			.append( $('<p>').text('ようこそ！') )
			.append( $('<p>').text('このアプリケーションでは、 ' + cmd + ' コマンドを利用します。') )
			.append( $('<p>').text('現在、このコマンドは利用できる準備が整っていません。 ' + cmd + ' コマンドの有効なパスを設定してください。') )
			.append( $('<p>').text('お使いの環境に '+cmd+' コマンドがインストールされていない場合は、先にインストールしてください。') )
			.append( $('<p>')
				.append( $('<input type="text" name="cmd-new-path" value="" class="px2-input px2-input--block" />').val(targetCmd) )
			)
			.append( $('<pre>')
				.append( $('<code>').text(res.stdout + res.stderr) )
			)
		;

		px2style.modal({
			'title': cmd + ' コマンドのパス設定',
			'body': $body,
			'buttons':[
				$('<button class="px2-btn px2-btn--primary">')
					.text('OK')
					.on('click', function(){
						var newCmdPath = $body.find('input[name=cmd-new-path]').val();
						main.px2dtLDA.db.commands[cmd] = newCmdPath;

						px2style.closeModal();
						callback();
					})
			],
		});
	}

}
