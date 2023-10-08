/**
 * processor.js
 */
module.exports = function(app, main, pj, pathHomeDir, $progressMessage, $progress, $pre, $result){
	var $ = require('jquery');

	this.run = function(target_path, callback){

		$progressMessage.html('実行中...');
		$progress.html('計算中...');

		var pageList = pj.site.getSitemap();
		var fileProgressCounter = 0;
		var pageListFullCount = main.utils79.count(pageList);
		$progress.html(fileProgressCounter+'/'+pageListFullCount);

		var counter = {};
		var fileCounter = {};
		var currentEditorMode = '';
		var currentExtension = '';
		var pathCurrentContent = null;

		var moduleIdCounter = [];

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
			var $msg = $('<div>').append(msg);
			$result.append($msg);
			console.log(msg);
			return true;
		}

		log('-----------------------------------');
		log('---- start contents processor; ----');
		log(new Date());
		log('');
		log('## Target path');
		log('`'+target_path+'`');
		log('');
		log('-----------------------------------');
		log('## Log by pages');


		main.it79.ary(
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

					main.it79.fnc(
						{"pageInfo": sitemapRow},
						[
							function(it2, arg2){
								// 対象外のパスだったらここまで
								// console.log(arg2.pageInfo.content);
								var regx = main.utils79.regexp_quote(target_path);
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
															var targetModuleName = /[\s\S]*/;
															var instance = editor.getInstance();

															if( instance.modId.match(targetModuleName) && !instance.subModName ){
																count('モジュール '+instance.modId+' が使われている件数');
																countFile();
																if( !moduleIdCounter[instance.modId] ){
																	moduleIdCounter[instance.modId] = 0;
																}
																moduleIdCounter[instance.modId] ++;
															}
															editor.done();
														}
													)
													['dryrun'](function(logs){
														// console.log(arg2.pageInfo.path, logs);
														// console.log('replace done!');
														$pre.text( $pre.text() + ' -> done' );
														$pre.text( $pre.text() + "\n" );
														if(main.utils79.count(logs)){
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
													$pre.text( $pre.text() + ' -> SKIP' );
													$pre.text( $pre.text() + "\n" );
													log('-> SKIP');
													it2.next(arg2);
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
				getAllModuleList(function(definedModuleList){

					console.log('----------------------------------- completed -----------------------------------');
					console.log('result: count()', counter);
					console.log('result: countFile()', main.utils79.count(fileCounter), fileCounter);
					console.log('result: moduleIdCounter', moduleIdCounter);
					log('');
					log('----------------------------------- completed -----------------------------------');
					log(new Date());
					log('result: count() - '+JSON.stringify(counter,null,4));
					log('result: countFile() - '+main.utils79.count(fileCounter)+' - '+JSON.stringify(fileCounter,null,4));
					log('');

					$pre.text( $pre.text() + '検索を完了しました。' + "\n" );
					$pre.text( $pre.text() + "\n" );

					if(!definedModuleList){
						console.error('[ERROR] 定義済みモジュール一覧の取得に失敗しました。');
					}else{
						for(var modId in definedModuleList){
							var modInfo = definedModuleList[modId];
							if(modInfo.isSystemModule){
								// システムモジュールはカウントしない
								continue;
							}
							if(modInfo.isClipModule){
								// クリップモジュールはカウントしない
								continue;
							}
							if(!moduleIdCounter[modId]){
								log(modId + ' は使われていません。');
							}
						}
					}

					main.message( '検索を完了しました。' );

					callback();

				});


			}
		);

	}


	/**
	 * 定義されているモジュールの一覧を取得する
	 */
	function getAllModuleList(callback){
		var definedModuleList = false;

		// --------------------------------------
		// PHP版Broccoliを利用しているプロジェクトの場合
		pj.px2dthelperGetAll('/', {}, function(px2all){
			var page_path = '/';
			var realpathDataDir = px2all.realpath_homedir+'_sys/ram/data/';
			var gpiOptions = {
				'api': 'broccoliBridge',
				'forBroccoli': {
					'api': 'getAllModuleList',
					'options': {
						'lang': 'ja'
					}
				},
				'page_path': page_path
			};

			var tmpFileName = '__tmp_'+main.utils79.md5( Date.now() )+'.json';
			main.fs.writeFileSync( realpathDataDir+tmpFileName, JSON.stringify(gpiOptions) );
			var PxCommand = 'PX=px2dthelper.px2ce.gpi&appMode=desktop&data_filename='+encodeURIComponent(tmpFileName);
			pj.px2proj.query(
				pj.getConcretePath(page_path)+'?'+PxCommand, {
					"output": "json",
					"complete": function(data, code){
						main.fs.unlinkSync( realpathDataDir+tmpFileName );

						try{
							definedModuleList = JSON.parse(data);
						}catch(e){
							console.error(e);
						}

						callback( definedModuleList );

						return;
					}
				}
			);
		});
		return;

	}

}
