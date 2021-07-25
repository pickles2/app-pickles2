/**
 * Command Queue Control
 */
module.exports = function(px, window){
	var _this = this;
	var $ = window.jQuery;

	// CmdQueue オブジェクト(Server Side) を生成する。
	this.server = new (require('cmd-queue'))({
		'cd': {'default': process.cwd()},
		'allowedCommands': [],
		'preprocess': function(cmd, callback){
			if(cmd.command[0] == 'git'){
				// --------------------------------------
				// gitコマンドの仲介処理
				cmd.command[0] = px.cmd(cmd.command[0]);
				var gitCmd = JSON.parse( JSON.stringify(cmd.command) );
				gitCmd.shift();

				var tmpCd = cmd.cd;
				if( tmpCd ){
					process.chdir( tmpCd );
				}

				var proc = window.px.utils.spawn(px.cmd('git'),
					gitCmd,
					{
						cd: cmd.cd,
						success: function(data){
							cmd.stdout(data);
						} ,
						error: function(data){
							cmd.stdout(data);
						} ,
						complete: function(code){
							cmd.complete(code);
						}
					}
				);
				_this.server.setPid( cmd.queueItemInfo.id, proc.pid );
				process.chdir( px.cwd );
				callback(false);
				return;
			}
			if(cmd.command[0] == 'composer'){
				// --------------------------------------
				// Composerコマンドの仲介処理
				cmd.command[0] = px.cmd(cmd.command[0]);
				var phpCmd = JSON.parse( JSON.stringify(cmd.command) );

				var tmpCd = cmd.cd;
				if( tmpCd ){
					process.chdir( tmpCd );
				}

				var proc = px.nodePhpBin.script(
					phpCmd ,
					{
						'cwd': cmd.cd
					} ,
					{
						'success': function(data){
							cmd.stdout(data);
						},
						'error': function(data){
							cmd.stderr(data);
						},
						'complete': function(data, error, code){
							cmd.complete(code);
						}
					}
				);
				_this.server.setPid( cmd.queueItemInfo.id, proc.pid );
				process.chdir( px.cwd );
				callback(false);
				return;
			}
			if(cmd.command[0] == 'php'){
				// --------------------------------------
				// PHPコマンドの仲介処理
				var phpCmd = JSON.parse( JSON.stringify(cmd.command) );
				phpCmd.shift();

				var tmpCd = cmd.cd;
				if( tmpCd ){
					process.chdir( tmpCd );
				}

				var proc = px.nodePhpBin.script(
					phpCmd ,
					{
						'cwd': cmd.cd
					} ,
					{
						'success': function(data){
							cmd.stdout(data);
						},
						'error': function(data){
							cmd.stderr(data);
						},
						'complete': function(data, error, code){
							cmd.complete(code);
						}
					}
				);
				_this.server.setPid( cmd.queueItemInfo.id, proc.pid );
				process.chdir( px.cwd );
				callback(false);
				return;
			}

			callback(cmd);
		},
		'gpiBridge': function(message, done){
			// サーバーからクライアントへのメッセージ送信を仲介
			// console.log(message);
			_this.client.gpi(message);
			done();
			return;
		}
	});

	// CmdQueue オブジェクト(Client Side) を生成する。
	this.client = new window.CmdQueue(
		{
			'gpiBridge': function(message, done){
				_this.server.gpi(message, function(result){
					done(result);
				});
			}
		}
	);

	var terminalTemplate = px.fs.readFileSync('./app/index_files/cmdQueueCtrl_files/templates/main.html').toString();
	var $mainTerminal = $(terminalTemplate);
	var $mainTerminal__main = $mainTerminal.find('.theme-command-terminal__main');
	var $mainTerminal__cQ = $mainTerminal.find('.theme-command-terminal__cQ');
	var mainTerminal = this.client.createTerminal($mainTerminal__cQ.get(0));
	// console.log('Command Queue Standby.');

	$mainTerminal.on('click', function(){
		_this.hide();
	});
	$mainTerminal.find('.theme-command-terminal__main').on('click', function(e){
		e.stopPropagation();
	});
	$mainTerminal.find('button.theme-command-terminal__btn-close').on('click', function(){
		_this.hide();
	});


	/**
	 * メイン端末を表示する
	 */
	this.show = function(){
		$('body').append($mainTerminal);
		$mainTerminal.css({"display":"block"});
		$mainTerminal__main.css({"bottom": 0, "height": "70%"});
	}

	/**
	 * メイン端末を隠す
	 */
	this.hide = function(){
		$mainTerminal__main.css({"bottom": "-70%"});
		setTimeout(function(){
			$mainTerminal.css({"display":"none"});
		}, 300);
	}
}
