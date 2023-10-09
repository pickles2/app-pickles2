window.BroccoliFieldHref = function(){
	var utils79 = require('utils79');

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var changeTimer;

		function onChange(){
			clearTimeout( changeTimer );
			var $this = $(this);
			changeTimer = setTimeout(function(){
				var pages = $this.data('pages');
				var $html = $('<ul>')
					.css({
						'padding': '0.5em 2em'
					})
				;
				for( var idx in pages ){
					if( !pages[idx].path.match( new RegExp(utils79.regexp_quote( $this.val() )) ) ){
						continue;
					}
					$html
						.append( $('<li>')
							.css({
								'list-style-type':'none'
							})
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
									// console.log('path suggestion: clicked!');
									// console.log($(this).attr('data-path'));
									// console.log($(this).attr('data-path'));
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

		var $palatte = $('<div>')
			.css({
				'height': 120,
				'overflow': 'auto',
				'position': 'relative',
				'background': '#f9f9f9',
				'width': '100%',
				'font-size': 12,
				'z-index': 1000
			})
		;
		var $input = $('<input>')
			.addClass('form-control')
			.attr({
				"name":mod.name
			})
			.val(data)
			.data( 'pages', px.getCurrentProject().site.getSitemap() )
			.css({'width':'100%','height':'auto'})
			.change( onChange )
			.keyup( onChange )
		;
		var rtn = $('<div>')
			.append( $input )
			.append( $('<div>')
				.css({
					'position':'relative'
				})
				.append( $palatte )
			)
		;
		$(elm).html(rtn);

		$input.change();
		callback();
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var $dom = $(elm);
		var src = $dom.find('input').val();
		src = JSON.parse( JSON.stringify(src) );
		callback(src);
		return;
	}

}
