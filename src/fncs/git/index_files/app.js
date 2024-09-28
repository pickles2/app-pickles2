window.main = window.parent.main;
window.contApp = new (function(){
	var _this = this;
	var pj = main.getCurrentProject();
	this.pj = pj;
	var status = pj.status();
	var $cont;

	/**
	 * initialize
	 */
	function init(){
		$cont = $('.contents').html('');

		main.it79.fnc({}, [
			function(it){
				if( main.getAppearance() == 'dark' ){
					// --------------------------------------
					// ダークモードスタイルを読み込む
					var $link = document.createElement('link');
					$link.href = '../../common/gitui79/dist/themes/darkmode.css';
					$link.rel = 'stylesheet';
					$link.className = 'px2-darkmode';
					var $contentsStylesheet = document.querySelector('link.contents-stylesheet');
					$contentsStylesheet.parentNode.insertBefore($link, $contentsStylesheet.nextElementSibling);
				}
				it.next();
			},
			function(it){

				if( !status.gitDirExists ){
					// --------------------------------------
					// git init されていない場合
					$cont
						.append( $($('#template-toInitialize-message').html()) )
					;
					$cont.find('.cont-btn-git-init')
						.on('click', function(){
							$(this).attr({'disabled': true});
							git_init(this);
						} )
					;

				}else{
					// --------------------------------------
					// gitリポジトリが存在する場合

					window.px2style.loading();

					var $elm = document.querySelector('.contents');
					var gitUi79 = new GitUi79( $elm, function( cmdAry, callback ){

						var cmd = JSON.parse(JSON.stringify(cmdAry));
						cmd.unshift(main.cmd('git'));

						// PHPスクリプトを実行する
						var stdout = '';
						var stderr = '';
						main.commandQueue.client.addQueueItem(
							cmd,
							{
								'cdName': 'default',
								'tags': [
									'pj-'+pj.get('id'),
									'project-git'
								],
								'accept': function(queueId){
								},
								'open': function(message){
								},
								'stdout': function(message){
									for(var idx in message.data){
										stdout += message.data[idx];
									}
								},
								'stderr': function(message){
									for(var idx in message.data){
										stderr += message.data[idx];
										console.error(message.data[idx]);
									}
								},
								'close': function(message){
									var code = message.data;
									callback(code, stdout, stderr);
									if( cmdAry[0] == 'status' ){
										pj.updateGitStatus(function(){});
									}
									return;
								}
							}
						);

					}, {} );
					gitUi79.init(function(){
						window.px2style.closeLoading();
						console.log('gitUi79: Standby.');
					});

				}
				it.next();
			},
		]);


	}

	/**
	 * git-init
	 */
	function git_init(btn){
		$(btn).attr('disabled', 'disabled');
		var pj = main.getCurrentProject();
		var $console = $('.cont_console');
		$console.text('');

		var stdout = '';
		main.commandQueue.client.addQueueItem(
			[
				'git',
				'init'
			],
			{
				'cdName': 'default',　// この時点で .git が存在しないので、 ルートディレクトリは `git` ではなく `default`。
				'tags': [
					'pj-'+pj.get('id'),
					'git-init'
				],
				'accept': function(queueId){
				},
				'open': function(message){
				},
				'stdout': function(message){
					for(var idx in message.data){
						stdout += message.data[idx];
					}
					$console.text(stdout);
				},
				'stderr': function(message){
					for(var idx in message.data){
						stdout += message.data[idx];
					}
					$console.text(stdout);
				},
				'close': function(message){
					$(btn).removeAttr('disabled');
					main.message( 'Git を初期化しました。' );
					main.subapp('fncs/git/index.html');
					return;
				}
			}
		);
	}

	/**
	 * イベント
	 */
	$(function(){
		init();
	});

})();
