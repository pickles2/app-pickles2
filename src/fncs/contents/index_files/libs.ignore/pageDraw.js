/**
 * pageDraw.js
 */
module.exports = function(app, px, pj, $elms, contentsComment, wasabiComment){
	var it79 = require('iterate79');
	var _this = this;

	/**
	 * 初期化する
	 */
	this.init = function(callback){
		callback = callback || function(){};
		// 特に何もするべきことはない。
		callback();
		return;
	}

	/**
	 * ページを再描画する
	 */
	this.redraw = function(pj_info, options, callback){
		callback = callback || function(){};
		var contProcType;
		var page_path = null;
		var $html,
			$bs3btn,
			$dropdownMenu;

		try {
			page_path = pj_info.page_info.path;
		} catch (e) {
		}

		it79.fnc({}, [
			function(it, prop){
				px.cancelDrop( $elms.previewIframe.get(0).contentWindow );
				prop.pageInfo = pj_info.page_info;
				prop.navigationInfo = pj_info.navigation_info;
				prop.pathType = pj_info.path_type;

				if( pj_info.page_info === null ){
					// サイトマップに定義のないページにアクセスしようとした場合
					// ページがない旨を表示して終了する。
					$elms.pageinfo.html( '<p>ページが未定義です。</p>' );
					callback();
					return;
				}else if( typeof(pj_info.page_info) != typeof({}) ){
					// 何らかのエラーでページ情報が取得できていない場合
					// エラーメッセージを表示して終了する。
					$elms.pageinfo.html( '<p>ページ情報の取得に失敗しました。</p>' );
					callback();
					return;
				}

				it.next(prop);
			} ,
			function(it, prop){
				// --------------------
				// パンくずを表示
				var tpl = $('#template-breadcrumb').html();
				var html = px.utils.bindEjs(tpl, {'navigationInfo': pj_info.navigation_info});
				$elms.breadcrumb.html(html);
				$elms.breadcrumb.find('a').on('click', function(e){
					var page_path = $(this).attr('data-page-path');
					app.goto(page_path);
					return false;
				});
				it.next(prop);
			} ,
			function(it, prop){
				// --------------------
				// parentページを表示
				$elms.sitemapParent.html('');
				if( pj_info.navigation_info.parent_info ){
					$elms.sitemapParent
						.append($('<ul class="listview">')
							.append($('<li>')
								.append($('<a>')
									.append( '<span class="glyphicon glyphicon-level-up"></span>' )
									.append( $('<span>').text(pj_info.navigation_info.parent_info.title) )
									.attr({
										'href': 'javascript:;',
										'data-page-path': pj_info.navigation_info.parent_info.path,
										'data-id': pj_info.navigation_info.parent_info.id
									})
									.on('click', function(e){
										var page_path = $(this).attr('data-id');
										app.goto(page_path);
										return false;
									})
								)
							)
						)
					;
				}
				it.next(prop);
			} ,
			function(it, prop){
				// --------------------
				// 兄弟と子供ページを表示
				$elms.brosList.html('');
				var tpl = $('#template-bros-list').html();
				var html = px.utils.bindEjs(tpl, {'navigationInfo': pj_info.navigation_info});
				$elms.brosList.html(html);
				$elms.brosList.find('a').on('click', function(e){
					var page_path = $(this).attr('data-id');
					app.goto(page_path);
					return false;
				});
				it.next(prop);
			} ,
			function(it, prop){
				// --------------------
				// エディターモードを取得
				if( prop.pathType == 'alias' ){
					contProcType = 'alias';
					it.next(prop);
					return;
				}
				pj.getPageContentEditorMode( prop.pageInfo.path, function(editorMode){
					contProcType = editorMode;
					it.next(prop);
				} );
			} ,
			function(it, prop){
				// --------------------
				// ボタンアクションを設定
				$bs3btn = $($('#template-bootstrap3-btn-dropdown-toggle').html());
				$html = $('<div>')
					.append( $('<div class="cont_page_info-prop">')
						.append( $('<span class="selectable">')
							.text( prop.pageInfo.title+' ('+prop.pageInfo.path+')' )
						)
						.append( $('<span>')
							// .text( contProcType )
							.addClass( 'px2-editor-type')
							.addClass( 'px2-editor-type--' + (function(contProcType){
								switch(contProcType){
									case 'html.gui': return 'html-gui'; break;
									case '.not_exists': return 'not-exists'; break;
									case '.page_not_exists': return 'page-not-exists'; break;
									default:
										break;
								}
								return contProcType;
							})(contProcType) )
						)
					)
					.append( $('<div class="cont_page_info-btn">')
						.append( $bs3btn )
					)
				;

				it.next(prop);
			} ,
			function(it, prop){
				// サイトマップに編集者コメント欄があったら表示する
				// 　※サイトマップ拡張項目 "editor-comment" から自動的に取得する。
				// 　　Markdown 処理して表示する。
				if( prop.pageInfo['editor-comment'] ){
					$html
						.append( $('<div class="cont_page_info-editor_comment">')
							.html( px.utils.markdown(prop.pageInfo['editor-comment']) )
						)
					;
				}
				it.next(prop);
			} ,
			function(it, prop){
				// --------------------------------------
				// コンテンツコメント機能
				contentsComment.init( prop.pageInfo, $elms.commentView );
				it.next(prop);
			} ,
			function(it, prop){
				// --------------------------------------
				// WASABI Integration
				wasabiComment.init( prop.pageInfo, $elms.wasabiView );
				it.next(prop);
			} ,
			function(it, prop){
				// --------------------------------------
				// メインの編集ボタンにアクションを付加
				$bs3btn.find('button.btn--edit').eq(0)
					.attr({'data-path': prop.pageInfo.path})
					// .text('編集する')
					.css({
						'padding-left': '5em',
						'padding-right': '5em'
					})
					.on('click', function(){
						app.openEditor( $(this).attr('data-path') );
						return false;
					})
					.removeAttr('disabled')
				;
				$bs3btn.find('button.btn--preview').eq(0)
					// .text( 'ブラウザでプレビュー' )
					.attr({
						'data-path': prop.pageInfo.path ,
						'href':'javascript:;'
					})
					.on('click', function(){
						var $this = $(this);
						px.preview.serverStandby(function(){
							px.utils.openURL( px.preview.getUrl( $this.attr('data-path') ) );
						});
						return false;
					})
					.removeAttr('disabled')
				;
				if( prop.pathType == 'alias' ){
					// エイリアスの場合は操作できない
					$bs3btn.find('button.btn--edit').eq(0).attr({'disabled':'disabled'});
					$bs3btn.find('button.btn--preview').eq(0).attr({'disabled':'disabled'});
				}

				$dropdownMenu = $bs3btn.find('ul.cont_page-dropdown-menu');


				it.next(prop);
			} ,
			function(it, prop){
				// --------------------------------------
				// ドロップダウンのサブメニューを追加
				if( prop.pathType == 'alias' ){
					it.next(prop);
					return;
				}
				if( contProcType != '.not_exists' ){
					$dropdownMenu
						.append( $('<li>')
							.append( $('<a>')
								.text( 'フォルダを開く' )
								.attr({
									'data-content': prop.pageInfo.content ,
									'href':'javascript:;'
								})
								.on('click', function(){
									$bs3btn.find('.dropdown-toggle').click();
									px.utils.openURL( px.utils.dirname( pj.get_realpath_controot()+$(this).attr('data-content') ) );
									return false;
								})
							)
						)
					;
				}

				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( 'サブウィンドウで編集する' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								main.openInNewSubWindow('../../mods/editor/index.html?page_path='+$(this).attr('data-path'));
								return false;
							})
						)
					)
				;

				if( contProcType != 'html.gui' ){
					$dropdownMenu
						.append( $('<li>')
							.append( $('<a>')
								.text( '外部テキストエディタで編集' )
								.attr({
									'data-path': prop.pageInfo.path ,
									'href':'javascript:;'
								})
								.on('click', function(){
									$bs3btn.find('.dropdown-toggle').click();
									var pathCont = pj.findPageContent( $(this).attr('data-path') );
									px.openInTextEditor( pj.get_realpath_controot()+pathCont );
									pj.updateGitStatus();
									return false;
								})
							)
						)
					;
				}

				if( contProcType != '.not_exists' ){
					$dropdownMenu
						.append( $('<li>')
							.append( $('<a>')
								.attr({'data-path': prop.pageInfo.path})
								.text('リソースフォルダを開く')
								.on('click', function(){
									$bs3btn.find('.dropdown-toggle').click();
									app.openResourcesDirectory( $(this).attr('data-path') );
									pj.updateGitStatus();
									return false;
								})
								.removeAttr('disabled')
							)
						)
						.append( $('<li>')
							.append( $('<a>')
								.text( 'コンテンツのソースコードを表示' )
								.attr({
									'data-path': prop.pageInfo.path ,
									'href':'javascript:;'
								})
								.on('click', function(){
									$bs3btn.find('.dropdown-toggle').click();
									var pathCont = pj.findPageContent( $(this).attr('data-path') );
									if( !px.utils79.is_file(pj.get_realpath_controot()+pathCont) ){
										console.error('コンテンツファイルが存在しません。', pathCont);
										alert('コンテンツファイルが存在しません。');
										return false;
									}
									var src = px.fs.readFileSync( pj.get_realpath_controot()+pathCont );
									px.dialog({
										title: 'コンテンツのソースコードを表示',
										body: $('<div>')
											.append( $('<p>').text('ソースの閲覧・確認ができます。ここで編集はできません。'))
											.append( $('<p>').text('ブロックエディタでされたコンテンツの場合は、編集後にビルドされたソースが表示されています。'))
											.append( $('<p>')
												.append( $('<textarea class="form-control">')
													.val(src)
													.attr({'readonly':true})
													.css({
														'width':'100%',
														'height':300,
														'font-size': 14,
														'font-family': 'monospace'
													})
												)
											)
									});
									return false;
								})
							)
						)
					;
				}

				it.next(prop);
			} ,
			function(it, prop){
				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( 'ページ情報を表示' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'data-page-info': JSON.stringify(prop.pageInfo),
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();

								var pagePath = $(this).attr('data-path');
								var pageInfo = $(this).attr('data-page-info');
								try {
									pageInfo = JSON.parse(pageInfo);
								} catch (e) {
								}

								var $tbl = $('<table class="px2-table">')
									.css({'width': '100%'})
								;
								for(var idx in pageInfo){
									var $row = $('<tr>');
									$row.append( $('<th>').text(idx) );
									$row.append( $('<td>').text(pageInfo[idx]) );
									// $row.append( $('<td>').text(typeof(pageInfo[idx])) );
									$tbl.append($row);
								}

								px2style.modal({
									title: 'ページ情報を表示',
									body: $('<div>')
										.append( $('<p>').text('ページ「'+pagePath+'」の情報を確認できます。'))
										.append( $('<div>')
											.css({'margin': '1em 0'})
											.append($tbl)
										)
								});
								return false;
							})
						)
					)
				;
				it.next(prop);
			} ,
			function(it, prop){
				if( prop.pathType == 'alias' ){
					it.next(prop);
					return;
				}
				$dropdownMenu
					.append( $('<li class="divider">') )
					.append( $('<li>')
						.append( $('<a>')
							.text( '埋め込みコメントを表示する' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								var $this = $(this);
								var bookmarklet = "javascript:(function(){var b=document.body;elm=document.createElement('script');elm.setAttribute('type','text/javascript');elm.src='https://tomk79.github.io/DEC/dec_show.js';b.appendChild(elm);b.removeChild(elm);return;})();";
								$elms.previewIframe.get(0).contentWindow.location = bookmarklet;
								return false;
							})
						)
					)
				;
				it.next(prop);
			} ,
			function(it, prop){
				if( prop.pathType == 'alias' ){
					it.next(prop);
					return;
				}
				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( '素材フォルダを開く (--)' )
							.addClass('menu-materials')
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								app.openMaterialsDirectory( $(this).attr('data-path') );
								pj.updateGitStatus();
								return false;
							})
						)
					)
				;

				setTimeout(function(){
					var button = $bs3btn.find('a.menu-materials').eq(0);
					var pathFiles = pj.getContentFilesByPageContent( pj.findPageContent( prop.pageInfo.path ) );
					var realpathFiles = pj.get_realpath_controot()+pathFiles;
					var realpath_matDir = realpathFiles + 'materials.ignore/';
					var matCount = 0;
					button.text('素材フォルダを開く ('+matCount+')');
					if( !px.utils.isDirectory(realpath_matDir) ){
						return;
					}

					var countFile_r = function(path){
						var list = px.utils.ls( path );
						for( var idx in list ){
							if( list[idx] == '.DS_Store' || list[idx] == 'Thumbs.db' ){
								continue;
							}
							if( px.utils.isFile(path+'/'+list[idx]) ){
								matCount ++;
								button.text('素材フォルダを開く ('+matCount+')');
							}else if( px.utils.isDirectory(path+'/'+list[idx]) ){
								countFile_r( path+'/'+list[idx] );
							}
						}
					}
					countFile_r(realpath_matDir);

				}, 10);
				it.next(prop);
			} ,
			function(it, prop){
				if( prop.pathType == 'alias' ){
					it.next(prop);
					return;
				}

				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( 'コンテンツコメントを編集' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								contentsComment.editComment();
								return false;
							})
						)
					)
				;
				it.next(prop);
			} ,
			function(it, prop){
				if( prop.pathType == 'alias' ){
					it.next(prop);
					return;
				}

				$dropdownMenu
					.append( $('<li class="divider">') )
					.append( $('<li>')
						.append( $('<a>')
							.text( '他のページから複製して取り込む' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'data-proc_type': contProcType ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								if( !confirm('現状のコンテンツを破棄し、他のページを複製して取り込みます。よろしいですか？') ){
									return false;
								}
								var $this = $(this);
								var $body = $('<div>')
									.append( $('#template-copy-from-other-page').html() )
								;
								var $input = $body.find('input');
								var $list = $body.find('.cont_sample_list')
									.css({
										'overflow': 'auto',
										'height': 200,
										'background-color': '#f9f9f9',
										'border': '1px solid #bbb',
										'padding': 10,
										'margin': '10px auto',
										'border-radius': 5
									})
								;
								var updateListTimer = null;
								var lastKeyword = '';
								function updateList(){
									clearTimeout(updateListTimer);
									var val = $input.val();
									if(val == lastKeyword || !val.length){
										return;
									}
									lastKeyword = val;
									$list.html('<div class="px2-loading"></div>');
									pj.px2proj.query('/?PX=px2dthelper.search_sitemap&keyword='+encodeURIComponent(val), {
										"output": "json",
										"success": function(data){
											// console.log(data);
										},
										"complete": function(data, code){
											// console.log(data, code);
											var page_list = JSON.parse(data);
											// console.log(page_list);

											var $ul = $('<ul>')
											for(var i in page_list){
												var $li = $('<li>')
												$li.append( $('<a>')
													.text(page_list[i].path)
													.attr({
														'href': 'javascript:;',
														'data-path': page_list[i].path
													})
													.on('click', function(e){
														var path = $(this).attr('data-path');
														$input.val(path);
													})
												);
												$ul.append($li);
											}
											$list.html('').append($ul);
										}
									});
								}
								$input
									.on('keyup', function(){
										clearTimeout(updateListTimer);
										updateListTimer = setTimeout(function(){
											updateList();
										}, 1000);
									})
									.on('change', function(){
										updateList();
									})
								;

								px.dialog({
									'title': '他のページから複製',
									'body': $body,
									'buttons':[
										$('<button>')
											.text(px.lb.get('ui_label.cancel'))
											.on('click', function(){
												px.closeDialog();
											}),
										$('<button>')
											.text('OK')
											.addClass('px2-btn--primary')
											.on('click', function(){
												var val = $input.val();
												var pageinfo = pj.site.getPageInfo(val);
												if( !pageinfo ){
													alert('存在しないページです。');
													return false;
												}
												pj.copyContentsData(
													pageinfo.path,
													$this.attr('data-path'),
													function(result){
														if( !result[0] ){
															alert('コンテンツの複製に失敗しました。'+result[1]);
															return;
														}
														app.loadPreview( app.getCurrentPagePath(), {"force":true}, function(){
															_this.redraw(pj_info, {}, function(){
																pj.updateGitStatus();
																px.closeDialog();
															});
														} );
													}
												);
											})
									]
								});

								$input.focus();

								return false;
							})
						)
					)
				;
				it.next(prop);
			} ,
			function(it, prop){
				if( prop.pathType == 'alias' || contProcType != 'html.gui' ){
					it.next(prop);
					return;
				}

				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( 'ブロックエディタのコンテンツを再構成する' )
							.attr({
								'title':'モジュールの変更を反映させます。',
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								var pagePath = $(this).attr('data-path');
								pj.buildGuiEditContent( pagePath, function(result){
									app.loadPreview( pagePath, {'force':true}, function(){} );
								} );
								return false;
							})
						)
					)
				;

				it.next(prop);
			} ,
			function(it, prop){
				if( prop.pathType == 'alias' || contProcType == '.not_exists' ){
					it.next(prop);
					return;
				}

				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( '編集方法を変更' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'data-proc_type': contProcType ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								var $this = $(this);
								var $body = $('<div>')
									.append( $('#template-change-proctype').html() )
								;
								$body.find('input[name=proc_type]').val( [$this.attr('data-proc_type')] );
								px2style.modal({
									'title': '編集方法を変更する',
									'body': $body,
									'buttons':[
										$('<button class="px2-btn px2-btn--primary">')
											.text('OK')
											.on('click', function(){
												var pagePath = $this.attr('data-path');
												var editorModeTo = $body.find('input[name=proc_type]:checked').val();
												pj.px2proj.query(
													pj.getConcretePath(pagePath)+'?PX=px2dthelper.change_content_editor_mode&editor_mode='+editorModeTo, {
														"output": "json",
														"complete": function(data, code){
															// console.log(data, code);
															var result = JSON.parse(data);
															if( !result[0] ){
																alert('編集モードの変更に失敗しました。'+result[1]);
																return;
															}
															app.loadPreview( app.getCurrentPagePath(), {"force":true}, function(){
																_this.redraw(pj_info, {}, function(){
																	pj.updateGitStatus();
																	px2style.closeModal();
																});
															} );
															return;
														}
													}
												);
											})
									],
									'buttonsSecondary': [
										$('<button class="px2-btn">')
											.text(px.lb.get('ui_label.cancel'))
											.on('click', function(){
												px2style.closeModal();
											}),
									]
								});
								return false;
							})
						)
					)
				;
				it.next(prop);
			} ,
			function(it, prop){
				if( prop.pathType == 'alias' || contProcType == '.not_exists' ){
					it.next(prop);
					return;
				}

				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( 'このページを単体でパブリッシュ' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'data-proc_type': contProcType ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								var $this = $(this);
								var page_path = $this.attr('data-path');
								var PxCommand = 'PX=px2dthelper.publish_single_page';
								px.progress.start({"showProgressBar":true, 'blindness':true});
								pj.px2proj.query(
									pj.getConcretePath(page_path)+'?'+PxCommand, {
										"output": "json",
										"complete": function(data, code){
											console.log('------result:', data, code);
											alert('完了しました。');
											pj.updateGitStatus();
											px.progress.close();
											return;
										}
									}
								);

								return false;
							})
						)
					)
				;
				it.next(prop);
			} ,
			function(it, prop){
				if( prop.pathType == 'alias' ){
					it.next(prop);
					return;
				}
				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( 'コンテンツをコミット' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								app.commitContents( $(this).attr('data-path') );
								$bs3btn.find('.dropdown-toggle').click();
								return false;
							})
						)
					)
				;
				it.next(prop);
			} ,
			function(it, prop){
				if( prop.pathType == 'alias' ){
					it.next(prop);
					return;
				}
				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( 'コンテンツのコミットログ' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								app.logContents( $(this).attr('data-path') );
								$bs3btn.find('.dropdown-toggle').click();
								return false;
							})
						)
					)
				;
				it.next(prop);
			} ,
			function(it, prop){
				if( prop.pathType == 'alias' ){
					it.next(prop);
					return;
				}
				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( 'ページをリロード' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								var pagePath = $(this).attr('data-path');
								app.loadPreview( pagePath, {'force':true}, function(){} );
								return false;
							})
						)
					)
				;
				it.next(prop);
			} ,
			function(it, prop){

				$elms.pageinfo.html( $html );

				$bs3btn.find('li').css(
					{
						"max-width": $bs3btn.width(),
						"overflow": "hidden"
					}
				);

				// ページ一覧の表示更新
				$elms.brosList.find('a').removeClass('current');
				$elms.brosList.find('a[data-id="'+prop.pageInfo.id+'"]').addClass('current');
				$elms.searchList.find('a').removeClass('current');
				$elms.searchList.find('a[data-id="'+prop.pageInfo.id+'"]').addClass('current');

				it.next(prop);
			} ,
			function(it, prop){
				// 表示サイズと位置合わせ
				$(window).resize();
				it.next(prop);
			} ,
			function(it, prop){
				callback();
			}
		]);
		return;
	}
}
