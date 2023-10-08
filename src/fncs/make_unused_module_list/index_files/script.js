window.main = window.parent.main;
window.contApp = new (function(main){
	var _this = this;
	var pj = main.getCurrentProject();
	this.pj = pj;
	var $cont,
		$btn,
		$pre,
		$progress,
		$progressMessage,
		$result;

	var pathHomeDir;

	var _cancelRequest = false;
	var Processor = require('../../../fncs/make_unused_module_list/index_files/libs.ignore/processor.js');

	/**
	 * initialize
	 */
	function init(){
		main.it79.fnc(
			{},
			[
				function(it1, data){
					// broccoli-html-editor-php エンジン利用環境の要件を確認
					pj.checkPxCmdVersion(
						{
							px2dthelperVersion: '>=2.0.8'
						},
						function(){
							// API設定OK
							it1.next(data);
						},
						function( errors ){
							// API設定が不十分な場合のエラー処理
							var html = main.utils.bindEjs(
								main.fs.readFileSync('app/common/templates/broccoli-html-editor-php-is-not-available.html').toString(),
								{errors: errors}
							);
							$('.contents').html( html );
							// エラーだったらここで離脱。
							return;
						}
					);
				},
				function(it1, data){
					pj.px2proj.get_path_homedir(function(path){
						pathHomeDir = path;
						it1.next(data);
					});
				},
				function(it1, data){

					$cont = $('.contents').html('');

					var html = $('#template-main-form').html();
					$cont.html(html);
					$btn = $cont.find('button');
					$pre = $('<pre>');
					$result = $cont.find('.cont-result');


					$btn
						.on('click', function(){
							var btn = this;
							var $form = $cont.find('form');
							var target_path = '/*';

							_cancelRequest = false;

							$pre.text('');
							$(btn).attr('disabled', 'disabled');
							$form.find('input,select,textarea').attr('disabled', 'disabled');
							var $dialogBody = $(document.getElementById('template-modal-content').innerHTML);
							$pre = $dialogBody.find('pre');
							$pre.css({'height': '300px'});
							$progress = $dialogBody.find('.cont_progress-bar .progress-bar');
							$progress.html('');
							$progressMessage = $dialogBody.find('.cont_message');
							$progressMessage.html('準備中...');

							var $btnOk = $('<button class="px2-btn px2-btn--primary">').text('OK').click(function(){
								main.closeDialog();
								$(btn).removeAttr('disabled').focus();
								$form.find('input,select,textarea').removeAttr('disabled', 'disabled');
							}).attr({'disabled':'disabled'});

							var $btnCancel = $('<button class="px2-btn">').text('中断').click(function(){
								_cancelRequest = true;
							});

							main.dialog({
								"title": "モジュールを検索",
								"body": $dialogBody,
								"buttons": [
									$btnCancel,
									$btnOk
								]
							});

							$result.html('');

							var processor = new Processor(_this, main, pj, pathHomeDir, $progressMessage, $progress, $pre, $result);
							processor.run(
								target_path,
								function(){
									$progressMessage.html('completed!');
									$progress.css({"width": '100%'}).removeClass('progress-bar-striped');
									$pre.text( $pre.text() + 'completed!' );
									$btnOk.removeAttr('disabled').focus();
									$btnCancel.attr({'disabled':'disabled'});
								}
							);
						} )
					;
					$pre
						.css({
							'max-height': 360,
							'height': 360
						})
					;

					it1.next(data);
				},
				function(it1, data){
					$('*').tooltip();
					it1.next(data);
				},
				function(it1, data){
					$(window).scrollTop(0);
					it1.next(data);
				}
			]
		);
	}

	/**
	 * キャンセルボタンの状態を取得する
	 */
	this.isCanceled = function(){
		return _cancelRequest;
	}


	/**
	 * イベント
	 */
	$(window).on('load', function(){
		init();
	});

})(window.main);
