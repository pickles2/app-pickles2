window.contApp.installer.pickles2 = new (function( px, contApp ){
	var _this = this;
	this.pj = false;

	/**
	 * インストールを実行
	 */
	this.install = function( pj, param, opt ){
		_this.pj = pj;
		setup_composer_create_project_dialog(param, opt);
		return this;
	}

	/**
	 * composer create-project を実行するダイアログを表示する
	 */
	function setup_composer_create_project_dialog(param, opt){
		var realpath = _this.pj.get('path');
		if( px.utils.isFile( realpath+'/.DS_Store' ) ){
			px.fs.unlinkSync( realpath+'/.DS_Store' );
		}
		if( px.utils.isFile( realpath+'/Thumbs.db' ) ){
			px.fs.unlinkSync( realpath+'/Thumbs.db' );
		}
		var $msg = $('<div>');

		var $preCont = $('<div>');
		var $pre = $('<pre>')
			.css({
				'height':'12em',
				'overflow':'auto'
			})
			.append( $preCont
				.addClass('selectable')
				.text('実行中...')
			)
		;
		var dlgOpt = {
			'title': 'Pickles 2 プロジェクトのセットアップ',
			'body': $('<div>')
				.append( $msg.text('Pickles 2 プロジェクトをセットアップしています。この処理はしばらく時間がかかります。') )
				.append( $pre ),
			'buttons': [
				$('<button>')
					.text('セットアップしています...')
					.attr({'disabled':'disabled'})
			]
		};
		px.dialog( dlgOpt );


		var stdout = '';
		px.commandQueue.client.addQueueItem(
			[
				'composer',
				'create-project',
				'--no-interaction',
				'pickles2/preset-get-start-pickles2',
				'./',
				'2.0.*'
			],
			{
				'cdName': 'default', // この時点で composer.json は存在しないので、ルートディレクトリは `composer` ではなく `default`。
				'tags': [
					'pj-'+_this.pj.get('id'),
					'composer-create-project'
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
					$preCont.text(stdout);
				},
				'stderr': function(message){
					for(var idx in message.data){
						stdout += message.data[idx];
					}
					$preCont.text(stdout);
				},
				'close': function(message){
					if( message.data !== 0 ){
						$msg.text('セットアップが正常に完了できませんでした。もう一度お試しください。');
						dlgOpt.buttons[0].text('閉じる');
						dlgOpt.buttons[0].on('click', function(){
							px.closeDialog();
							opt.complete();
						});
					}else{
						$msg.text('Pickles 2 プロジェクトのセットアップが完了しました。');
						dlgOpt.buttons[0].text('次へ');
						dlgOpt.buttons[0].on('click', function(){
							px.closeDialog();
							setup_finalize_option_dialog(opt);
						});
					}
					dlgOpt.buttons[0].removeAttr('disabled').focus();
					return;
				}
			}
		);

	}

	/**
	 * セットアップ時のオプション選択ダイアログを表示する
	 */
	function setup_finalize_option_dialog(opt){
		var $body = $('<div>');
		$body.append( $('#template-installer-pickles2-setup-finalize-option').html() );

		var dlgOpt = {
			'title': 'Pickles 2 プロジェクトのセットアップ',
			'body': $body,
			'buttons': [
				$('<button>')
					.text('OK')
					.on('click', function(e){
						var finalizeOptions = {
							"composer_package_name": $body.find('input[name=options_composer_package_name]').val(),
							"git_init": $body.find('input[name=options_git_init]:checked').val()
						};

						px.it79.fnc({}, [
							function(it1){
								if( !finalizeOptions.git_init ){
									// Gitリポジトリの初期化をスキップする場合
									it1.next();
									return;
								}
								finalize_git_init(function(result){
									if( !result ){
										alert('Gitの初期化に失敗しました。');
									}
									it1.next();
								});
							},
							function(it1){
								finalize_composerJson(finalizeOptions, function(result){
									if( !result ){
										alert('composer.json の初期化に失敗しました。');
									}
									it1.next();
								});
							},
							function(it1){
								finalize_readme(function(result){
									if( !result ){
										alert('README.md の初期化に失敗しました。');
									}
									it1.next();
								});
							},
							function(it1){
								px.closeDialog();
								opt.complete();
								it1.next();
							}
						]);
					})
			]
		};
		px.dialog( dlgOpt );
		return;
	}

	/**
	 * Gitリポジトリを初期化する
	 */
	function finalize_git_init( callback ){
		var path_git_root = _this.pj.get('path');
		// alert(path_git_root);
		callback(true);
	}

	/**
	 * composer.json を初期化する
	 */
	function finalize_composerJson( finalizeOptions, callback ){
		var name = _this.pj.get('name');
		// alert(finalizeOptions.composer_package_name);
		callback(true);
	}

	/**
	 * README.md を初期化する
	 */
	function finalize_readme( callback ){
		var name = _this.pj.get('name');
		// alert(name);
		callback(true);
	}

})( window.px, window.contApp );
