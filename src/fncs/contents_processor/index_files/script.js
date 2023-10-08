window.px = window.parent.px;
window.contApp = new (function(px){
	var _this = this;
	var pj = px.getCurrentProject();
	this.pj = pj;
	var $cont,
		$btn,
		$pre,
		$progress,
		$progressMessage;

	var $snippet_for_script_source_processor;
	var $snippet_for_script_instance_processor;
	var CodeMirrorInstans = {};
	var pathHomeDir, pathLogFileName;

	var _cancelRequest = false;
	var Processor = require('../../../fncs/contents_processor/index_files/libs.ignore/processor.js');

	/**
	 * initialize
	 */
	function init(){
		px.it79.fnc(
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
							var html = px.utils.bindEjs(
								px.fs.readFileSync('app/common/templates/broccoli-html-editor-php-is-not-available.html').toString(),
								{errors: errors}
							);
							$('.contents').html( html );
							// エラーだったらここで離脱。
							return;
						}
					);
					return;
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

					$snippet_for_script_source_processor = $('select[name=snippet_for_script_source_processor]')
						.on('change', function(){
							var val = $(this).val();
							$(this).val('');
							$cont.find('form').find('textarea[name=script_source_processor]').val(val);
							CodeMirrorInstans['source_processor'].setValue(val);
						})
					;
					$snippet_for_script_instance_processor = $('select[name=snippet_for_script_instance_processor]')
						.on('change', function(){
							var val = $(this).val();
							$(this).val('');
							$cont.find('form').find('textarea[name=script_instance_processor]').val(val);
							CodeMirrorInstans['instance_processor'].setValue(val);
						})
					;

					CodeMirrorInstans['source_processor'] = window.textEditor.attachTextEditor(
						$cont.find('form').find('textarea[name=script_source_processor]').get(0),
						'js',
						{
							save: function(){}
						}
					);
					CodeMirrorInstans['instance_processor'] = window.textEditor.attachTextEditor(
						$cont.find('form').find('textarea[name=script_instance_processor]').get(0),
						'js',
						{
							save: function(){}
						}
					);


					$('.snippet-source-processor').each(function(e){
						var $this = $(this);
						$snippet_for_script_source_processor.append( $('<option>')
							.attr({'value': px.utils79.trim($this.html())})
							.text($this.attr('title'))
						);
					});

					$('.snippet-instance-processor').each(function(e){
						var $this = $(this);
						$snippet_for_script_instance_processor.append( $('<option>')
							.attr({'value': px.utils79.trim($this.html())})
							.text($this.attr('title'))
						);
					});

					$btn
						.on('click', function(){
							var btn = this;
							var $form = $cont.find('form');
							var target_path = $form.find('input[name=target_path]').val();
							var script_source_processor = $form.find('textarea[name=script_source_processor]').val();
							var script_instance_processor = $form.find('textarea[name=script_instance_processor]').val();
							var is_dryrun = ( $form.find('input[name=is_dryrun]:checked').val()=='dryrun' ? true : false );

							_cancelRequest = false;

							$pre.text('');
							$(btn).attr('disabled', 'disabled');
							CodeMirrorInstans['source_processor'].setOption("readonly", "nocursor");
							CodeMirrorInstans['instance_processor'].setOption("readonly", "nocursor");
							$form.find('input,select,textarea').attr('disabled', 'disabled');
							var $dialogBody = $(document.getElementById('template-modal-content').innerHTML);
							$pre = $dialogBody.find('pre');
							$pre.css({'height': '300px'});
							$progress = $dialogBody.find('.cont_progress-bar .progress-bar');
							$progress.html('');
							$progressMessage = $dialogBody.find('.cont_message');
							$progressMessage.html('準備中...');

							var $btnOk = $('<button class="px2-btn px2-btn--primary">').text('OK').click(function(){
								px.closeDialog();
								$(btn).removeAttr('disabled').focus();
								CodeMirrorInstans['source_processor'].setOption("readonly", false);
								CodeMirrorInstans['instance_processor'].setOption("readonly", false);
								$form.find('input,select,textarea').removeAttr('disabled', 'disabled');
							}).attr({'disabled':'disabled'});

							var $btnCancel = $('<button class="px2-btn">').text('中断').click(function(){
								_cancelRequest = true;
							});

							pathLogFileName = (function(){
								var date = new Date;
								var filename = '';
								filename += 'contents_processor_log-';
								filename += px.php.str_pad(date.getFullYear(), 4, '0', 'STR_PAD_LEFT');
								filename += px.php.str_pad((date.getMonth()+1), 2, '0', 'STR_PAD_LEFT');
								filename += px.php.str_pad(date.getDate(), 2, '0', 'STR_PAD_LEFT');
								filename += '-';
								filename += px.php.str_pad(date.getHours(), 2, '0', 'STR_PAD_LEFT');
								filename += px.php.str_pad(date.getMinutes(), 2, '0', 'STR_PAD_LEFT');
								filename += px.php.str_pad(date.getSeconds(), 2, '0', 'STR_PAD_LEFT');
								filename2 = '';
								var i = 0;
								while( !px.utils79.is_file(pathHomeDir+'/'+filename+filename2+'.log') ){
									if( px.utils79.is_file(pathHomeDir+'/'+filename+filename2+'.log') ){
										i ++;
										filename2 = '('+i+')';
										continue;
									}
									break;
								}
								return filename+filename2+'.log';
							})();

							var $btnOpenLogFile = $('<button class="px2-btn">').text('ログファイルを開く').click(function(){
								px.openInTextEditor(pathHomeDir+'/logs/'+pathLogFileName);
							});

							px.dialog({
								"title": "一括加工",
								"body": $dialogBody,
								"buttons": [
									$btnCancel,
									$btnOpenLogFile,
									$btnOk
								]
							});

							var processor = new Processor(_this, px, pj, pathHomeDir, pathLogFileName, $progressMessage, $progress, $pre);
							processor.run(
								target_path,
								script_source_processor,
								script_instance_processor,
								is_dryrun,
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
					$('form input[name=target_path]').focus();
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

})(window.px);
