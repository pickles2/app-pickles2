(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"../../../fncs/contents_processor/index_files/libs.ignore/processor.js":2}],2:[function(require,module,exports){
/**
 * processor.js
 */
module.exports = function(app, px, pj, pathHomeDir, pathLogFileName, $progressMessage, $progress, $pre){

	this.run = function(target_path, script_source_processor, script_instance_processor, is_dryrun, callback){
		// console.log(script_source_processor, script_instance_processor);

		$progressMessage.html('実行中...');
		$progress.html('計算中...');

		var pageList = pj.site.getSitemap();
		var fileProgressCounter = 0;
		var pageListFullCount = px.utils79.count(pageList);
		$progress.html(fileProgressCounter+'/'+pageListFullCount);

		var counter = {};
		var fileCounter = {};
		var currentEditorMode = '';
		var currentExtension = '';
		var pathCurrentContent = null;


		// HTMLソース加工
		function srcProcessor( src, type, next ){
			var supply = {
				// supplying libs
				'cheerio': px.cheerio,
				'iterate79': px.it79
			};
			try {
				eval(script_source_processor.toString());
			} catch (e) {
				console.log('eval ERROR');
				next(src);
			}
		}

		// 任意の項目を数える
		function count( key ){
			counter[key] = counter[key]||0;
			counter[key] ++;
			return counter[key];
		}

		// ファイルを数える
		function countFile(){
			fileCounter[pathCurrentContent] = fileCounter[pathCurrentContent]||{'ext':currentExtension,'editorMode':currentEditorMode, 'count':0};
			fileCounter[pathCurrentContent].count ++;
			return fileCounter[pathCurrentContent];
		}

		// 実行ログをファイル出力する
		function log(msg){
			try {
				px.fs.mkdirSync(pathHomeDir+'/logs/');
			} catch (e) {}
			px.fs.appendFileSync( pathHomeDir+'/logs/'+pathLogFileName, msg+"\n", 'utf-8');
			return true;
		}

		log('-----------------------------------');
		log('---- start contents processor; ----');
		log(new Date());
		log('');
		log('## Target path');
		log('`'+target_path+'`');
		log('');
		log('## Source Processor Eval Code');
		log('```'+"\n"+script_source_processor.toString()+"\n"+'```');
		log('');
		log('## Instance Processor Eval Code');
		log('```'+"\n"+script_instance_processor.toString()+"\n"+'```');
		log('');
		log('## Is Dry Run');
		log('`'+JSON.stringify(is_dryrun)+'`');
		log('');
		log('-----------------------------------');
		log('## Log by pages');


		px.it79.ary(
			pageList ,
			function( it1, sitemapRow, pagePath ){

				try{

					if( app.isCanceled() ){
						// キャンセルボタンが押されていたら、すべてスキップ
						log("\n\n\n\n");
						log('+++++++++++++++++++++++');
						log('++++ User Canceled ++++');
						log('+++++++++++++++++++++++');
						log("\n\n\n\n");
						it1.break();
						return;
					}
					// console.log(sitemapRow);

					fileProgressCounter ++;
					$progressMessage.text(pagePath);
					$progress
						.text(fileProgressCounter+'/'+pageListFullCount)
						.css({"width": Number(fileProgressCounter/pageListFullCount*100)+'%'})
					;
					$pre.text( $pre.text() + "\n" + sitemapRow.path );

					log("\n"+'---- page('+fileProgressCounter+'/'+pageListFullCount+'): '+pagePath); // コンテンツの加工処理開始 (を、ログファイルに記録)

					px.it79.fnc(
						{"pageInfo": sitemapRow},
						[
							function(it2, arg2){
								// 対象外のパスだったらここまで
								// console.log(arg2.pageInfo.content);
								var regx = px.utils79.regexp_quote(target_path);
								regx = regx.split('\\*').join('([\\s\\S]*)');
								regx = '^'+regx+'$';
								// console.log(regx);
								try {
									if( arg2.pageInfo.content.match(new RegExp(regx)) ){
										it2.next(arg2);
										return;
									}else if( arg2.pageInfo.path.match(new RegExp(regx)) ){
										it2.next(arg2);
										return;
									}
								} catch (e) {
								}
								$pre.text( $pre.text() + ' -> SKIP' );
								log('-> SKIP');
								$pre.text( $pre.text() + "\n" );
								it1.next();
								// it2.next(arg2);
							} ,
							function(it2, arg2){
								// コンテンツのパスを取得
								pj.px2proj.get_path_content(arg2.pageInfo.path, function(contPath){
									pathCurrentContent = contPath;
									it2.next(arg2);
								});
								return;
							} ,
							function(it2, arg2){
								// HTML拡張子のみ抽出
								var Extension = pj.get_path_proc_type( arg2.pageInfo.path );
								$pre.text( $pre.text() + "\n" + ' -> Extension: ' + Extension );
								log('Extension: '+Extension);
								currentExtension = Extension;
								switch( Extension ){
									case 'html':
									case 'htm':
										it2.next(arg2);
										break;
									default:
										$pre.text( $pre.text() + ' -> SKIP' );
										$pre.text( $pre.text() + "\n" );
										log('-> SKIP');
										it1.next();
										break;
								}
							} ,
							function(it2, arg2){
								pj.getPageContentEditorMode( arg2.pageInfo.path, function(procType){
									log('EditorMode: ' + procType);
									currentEditorMode = procType;
									$pre.text( $pre.text() + "\n" + ' -> ' + 'EditorMode: ' + procType );
									switch( procType ){
										case '.not_exists':
											$pre.text( $pre.text() + ' -> SKIP' );
											$pre.text( $pre.text() + "\n" );
											log('-> SKIP');
											it1.next();
											break;

										case 'html.gui':
											// broccoli-processor オブジェクトを生成する
											// console.log(arg2.pageInfo.path);

											pj.createBroccoliProcessor( arg2.pageInfo.path, function(broccoliProcessor){
												// console.log(broccoliProcessor);

												broccoliProcessor
													.each(
														function( editor ){
															// console.log(data);
															// next();
															try {
																eval(script_instance_processor.toString());
															} catch (e) {
																console.error('eval ERROR', e);
																log('eval ERROR');
																editor.done();
															}
														}
													)
													[(is_dryrun ? 'dryrun' : 'run')](function(logs){
														// console.log(arg2.pageInfo.path, logs);
														// console.log('replace done!');
														$pre.text( $pre.text() + ' -> done' );
														$pre.text( $pre.text() + "\n" );
														if(px.utils79.count(logs)){
															log(JSON.stringify(logs,null,4));
														}
														log('-> done');
														it2.next(arg2);
													})
												;

											} );
											break;

										case 'html':
										case 'md':
										case '.page_not_exists':
										default:
											if( !pathCurrentContent ){
												// console.log( 'content path of ' + arg2.pageInfo.path + ' is ' + pathCurrentContent );
												$pre.text( $pre.text() + ' -> ERROR' );
												$pre.text( $pre.text() + "\n" );
												log('-> ERROR');
												it2.next(arg2);
												return;
											}
											pj.px2proj.get_path_controot(function(contRoot){
												pj.px2proj.get_path_docroot(function(docRoot){
													var _contentsPath = px.path.resolve(docRoot + contRoot + pathCurrentContent);
													var src = '';
													try {
														src = px.fs.readFileSync( _contentsPath );
														src = src.toString();
													} catch (e) {
														$pre.text( $pre.text() + ' -> ERROR' );
														$pre.text( $pre.text() + "\n" );
														log('-> ERROR');
														it2.next(arg2);
														return;
													}
													srcProcessor( src, procType, function(after){
														if( is_dryrun ){
															// dryrun で実行されていたら、加工結果を保存しない
															$pre.text( $pre.text() + ' -> done' );
															$pre.text( $pre.text() + "\n" );
															log('-> done');
															it2.next(arg2);
															return;
														}

														px.fs.writeFile( _contentsPath, after, {}, function(err){
															if(err){
																console.error( err );
															}
															$pre.text( $pre.text() + ' -> done' );
															$pre.text( $pre.text() + "\n" );
															log('-> done');
															it2.next(arg2);
														} );
													} );
													return;
												});
											});
											break;
									}
								} );
							} ,
							function(it2, arg2){
								it1.next();
							}
						]
					);
				}catch(e){
					console.error(e);
					it1.next();
				}

			} ,
			function(){
				px.message( '完了しました。' );
				console.log('----------------------------------- completed -----------------------------------');
				console.log('result: count()', counter);
				console.log('result: countFile()', px.utils79.count(fileCounter), fileCounter);
				log('');
				log('----------------------------------- completed -----------------------------------');
				log(new Date());
				log('result: count() - '+JSON.stringify(counter,null,4));
				log('result: countFile() - '+px.utils79.count(fileCounter)+' - '+JSON.stringify(fileCounter,null,4));
				callback();
			}
		);

	}

}

},{}]},{},[1])