window.contApp.fieldDefinitions.href = _.defaults( new (function( px, contApp ){

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode ){
		var rtn = ''
		if(typeof(fieldData)===typeof('')){
			rtn = px.$('<div>').text( fieldData ).html(); // ←HTML特殊文字変換
			// rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 属性値などに使うので、改行コードは改行コードのままじゃないとマズイ。
		}
		if( mode == 'canvas' && !rtn.length ){
			// rtn = $('<span>')
			// 	.text('(ダブルクリックしてテキストを編集してください)')
			// 	.css({
			// 		'color':'#999',
			// 		'background-color':'#ddd',
			// 		'font-size':'10px',
			// 		'padding':'0 1em'
			// 	})
			// 	.get(0).outerHTML
			// ;
			// ↑属性値などに使うので、HTMLタグを含むのはマズイ。
			rtn = '';
		}
		return rtn;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data ){
		var changeTimer;
		var blurTimer;
		function onChange(){
			clearTimeout(changeTimer);
			var $this = $(this);
			changeTimer = setTimeout(function(){
				var pages = $this.data('pages');
				var $html = $('<ul>');
				for( var idx in pages ){
					if( !pages[idx].path.match( new RegExp('^'+px.utils.escapeRegExp($this.val())) ) ){
						continue;
					}
					$html
						.append( $('<li>')
							.append( $('<a>')
								.css({
									'display':'block'
								})
								.attr({
									'href': 'javascript:;',
									'data-path': pages[idx].path
								})
								.text( pages[idx].path +' ('+pages[idx].title+')' )
								.click(function(){
									$input
										.val( $(this).attr('data-path') )
										.focus()
									;
								})
							)
						)
					;
				}
				$palatte.html('').append( $html );
			}, 100);
		}
		var $input = $('<input>')
			.attr({
				"name":mod.name
			})
			.val(data)
			.data( 'pages', px.getCurrentProject().site.getSitemap() )
			.css({'width':'100%','height':'auto'})
			.change( onChange )
			.keyup( onChange )
			.focus(function(){
				clearTimeout( blurTimer );
				$palatte.show();
			})
			.blur(function(){
				clearTimeout( blurTimer );
				blurTimer = setTimeout( function(){
					$palatte.hide('slow');
				}, 500 );
			})
			.change()
		;
		var $palatte = $('<div>')
			.css({
				'height':200,
				'overflow':'auto',
				'position':'absolute',
				'background':'#f9f9f9',
				'opacity':'0.9',
				'width':'100%'
			})
			.hide()
		;
		return $('<div>')
			.append( $input )
			.append( $('<div>')
				.css({
					'position':'relative'
				})
				.click(function(){
					clearTimeout( blurTimer );
				})
				.append( $palatte )
			)
		;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( $dom, data ){
		var src = $dom.find('input').val();
		src = JSON.parse( JSON.stringify(src) );
		return src;
	}

})( window.px, window.contApp ), window.contApp.fieldBase );