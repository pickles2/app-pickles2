(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.px = window.parent.px;
window.contApp = new (function(px){
	var _this = this;
	var pj = px.getCurrentProject();
	var it79 = px.it79;
	this.pj = pj;
	var $cont, $btn, $pre;

	/**
	 * initialize
	 */
	function init(){
		$cont = $('.contents').html('');
		$btn = $('<button class="px2-btn px2-btn--block">');
		$pre = $('<pre>');

		it79.fnc({},
			[
				function(it1, arg){
					// broccoli-html-editor-php エンジン利用環境の要件を確認
					pj.checkPxCmdVersion(
						{
							px2dthelperVersion: '>=2.0.8'
						},
						function(){
							// API設定OK
							it1.next(arg);
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
				function(it1, arg){
					$cont
						.append( $btn
							.click( function(){ rebuild(this); } )
							.text('すべてのGUI編集コンテンツを一括再構成する')
						)
						.append( $pre
							.addClass( 'cont_console' )
							.css({
								'max-height': 360,
								'height': 360
							})
						)
					;
					it1.next(arg);
				}
			]
		);
	}


	var rebuild = function(btn){
		$(btn).attr('disabled', 'disabled');
		$pre.text('');

		pj.createSearcher().getGuiEditPages( function(pageList){

			px.utils.iterate(
				pageList ,
				function( it1, sitemapRow, idx1 ){
					console.log(sitemapRow);
					$pre.text( $pre.text() + sitemapRow.path );

					px.utils.iterateFnc([
						function(it2, arg2){
							// HTMLコンテンツのみ抽出
							var procType = pj.get_path_proc_type( arg2.pageInfo.path );
							$pre.text( $pre.text() + ' -> ' + procType );
							switch( procType ){
								case 'html':
								case 'htm':
									it2.next(arg2);
									break;
								default:
									$pre.text( $pre.text() + ' -> SKIP' );
									$pre.text( $pre.text() + "\n" );
									it1.next();
									break;
							}
						} ,
						function(it2, arg2){
							// そのうち、GUI編集コンテンツのみ抽出
							pj.getPageContentEditorMode( arg2.pageInfo.path, function(procType){
								$pre.text( $pre.text() + ' -> ' + procType );
								switch( procType ){
									case 'html.gui':
										it2.next(arg2);
										break;
									default:
										$pre.text( $pre.text() + ' -> SKIP' );
										$pre.text( $pre.text() + "\n" );
										it1.next();
										break;
								}
							} );
						} ,
						function(it2, arg2){
							// broccoli コンテンツを再生成する
							pj.buildGuiEditContent( arg2.pageInfo.path, function(result){
								if(result){
									$pre.text( $pre.text() + ' -> done' );
								}else{
									$pre.text( $pre.text() + ' -> ERROR!' );
								}
								$pre.text( $pre.text() + "\n" );
								it2.next(arg2);
							} );
						} ,
						function(it2, arg2){
							it1.next();
						}
					]).start({"pageInfo": sitemapRow});

				} ,
				function(){
					$pre.text( $pre.text() + 'completed!' );
					$(btn).removeAttr('disabled').focus();
					px.message( '完了しました。' );
				}
			);

		} );
	}

	/**
	 * イベント
	 */
	$(function(){
		init();
	});

})(window.px);

},{}]},{},[1])