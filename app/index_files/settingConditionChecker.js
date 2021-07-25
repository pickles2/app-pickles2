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
				checkCmd('git', function(res){
					console.log('git:', res);
					if( !res.available ){
						alert('gitコマンドが利用できません。'+"\n"+'アプリケーション設定から、gitコマンドのパスの設定を見直してください。');
					}
					it79.next();
				});
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
			// function(it79){
			// 	setTimeout(function(){
			// 		it79.next();
			// 	}, 2000);
			// },
			function(){
				callback();
			},
		]);
	}

	function checkCmd(cmd, callback){
		var res = {
			"available": false,
			"stdout": false,
			"stderr": false,
			"code": false,
			"version": false,
		};

		var subCmd = ['-v'];
		if( cmd == 'git' ){
			subCmd = ['--version'];
		}

		if( main.px2dtLDA.db.commands && main.px2dtLDA.db.commands[cmd] ){
			cmd = main.px2dtLDA.db.commands[cmd];
		}
		console.log('--- cmd:', cmd + ' ' + subCmd.join(' '));

		window.px.utils.spawn(
			cmd,
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
					callback(res);
				}
			}
		);

		return;
	}

}
