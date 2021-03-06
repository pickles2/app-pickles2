(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.main = window.parent.main;
window.contApp = new (function(){
	var _this = this;
	var pj = main.getCurrentProject();
	this.pj = pj;
	var status = pj.status();
	var $cont,
		$btnGitInit;

	/**
	 * initialize
	 */
	function init(){
		$cont = $('.contents').html('');
		$btnGitInit = $('<button class="px2-btn">');

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
							// console.log(queueId);
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
								stdout += message.data[idx];
								stderr += message.data[idx];
								console.error(message.data[idx]);
							}
						},
						'close': function(message){
							var code = message.data;
							// console.log(stdout, stderr, code);
							callback(code, stdout);
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

	}

	/**
	 * git-init
	 */
	function git_init(btn){
		$(btn).attr('disabled', 'disabled');
		var pj = main.getCurrentProject();
		$('.cont_console').text('');

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
					// console.log(queueId);
				},
				'open': function(message){
				},
				'stdout': function(message){
					for(var idx in message.data){
						stdout += message.data[idx];
					}
					$('.cont_console').text(stdout);
				},
				'stderr': function(message){
					for(var idx in message.data){
						stdout += message.data[idx];
					}
					$('.cont_console').text(stdout);
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

},{}]},{},[1])