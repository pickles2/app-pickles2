/**
 * px2styleV2Header.js
 */
(function(){
	var $header,
		$globalMenu,
		$globalMenuUl,
		$shoulderMenu,
		$shoulderMenuUl;
	var options = {};
	var Header = function(){};

	Header.prototype.init = function(_options){
		var _this = this;

		$(window)
			.off('resize.px2-header')
			.on('resize.px2-header', function(){
				if(!$header){return;}
				_this.init(options);
			})
			.off('click.px2-header')
			.on('click.px2-header', function(){
				if(!$header){return;}
				_this.init(options);
			});


		options = _options || {};
		options.current = options.current || '';
		$header = $('.px2-header__inner');
		$globalMenu = $('.px2-header__global-menu');
		$globalMenuUl = $globalMenu.find('>ul');
		$shoulderMenu = $('.px2-header__shoulder-menu');
		$shoulderMenuUl = $shoulderMenu.find('>ul');


		$shoulderMenuUl.find('.px2-header__shoulder-global-menu').remove();
		var $gmenuLis = $globalMenuUl.find('>li');
		for(var i = $gmenuLis.length-1; i >= 0 ; i --){
			$gmenuLis.eq(i).clone()
				.addClass('px2-header__shoulder-global-menu')
				.prependTo($shoulderMenuUl);
		}
		var $shoulderGlobalMenuLis = $shoulderMenuUl.find('>li.px2-header__shoulder-global-menu');
		$shoulderGlobalMenuLis.eq($shoulderGlobalMenuLis.length-1).addClass('px2-header__shoulder-global-menu--last');


		$globalMenuUl.find('li').removeClass('px2-header__global-menu-group');
		$globalMenuUl.find('li:has(>ul)').addClass('px2-header__global-menu-group')
		$globalMenuUl.find('li:has(>ul) > a').off().on('click', function(e){
			e.stopPropagation();
			var $ul = $(this).parent().find('>ul');
			if( $ul.is(':visible') ){
				closeDropdownMenus();
			}else{
				closeDropdownMenus();
				$ul.show();
				$(this).parent().addClass('px2-header__global-menu-group-opened');
			}
		});

		$shoulderMenu
			.css({
				'width': 50,
				'height': $header.height()
			})
			.off()
			.on('click', function(){
				if( $shoulderMenuUl.css('display') == 'block' ){
					$shoulderMenuUl.hide();
					$shoulderMenu
						.css({
							'width':50 ,
							'height':$header.height()
						})
					;
				}
			}
		);
		$shoulderMenu.find('button')
			.off()
			.on('click.px2-header', function(e){
				e.stopPropagation();
				closeDropdownMenus();

				if( $shoulderMenuUl.css('display') == 'block' ){
					$shoulderMenuUl.hide();
					$shoulderMenu
						.css({
							'width':50 ,
							'height':$header.height()
						})
					;

				}else{
					$shoulderMenuUl.show().height( $(window).height()-$header.height() );
					$shoulderMenu
						.css({
							'width':'100%' ,
							'height':$(window).height()
						})
					;

				}
			})
		;




		$shoulderMenu.find('button')
			.css({
				'height': $header.height()
			})
		;
		$shoulderMenuUl.css({
			'top': $header.height() ,
			'height': $(window).height()-$header.height()
		});

		$shoulderMenuUl.find('li').removeClass('px2-header__shoulder-menu-group');
		$shoulderMenuUl.find('li:has(>ul)').addClass('px2-header__shoulder-menu-group')
		$shoulderMenuUl.find('li:has(>ul) > a').off().on('click', function(e){
			e.stopPropagation();
			var $ul = $(this).parent().find('>ul');
			if( $ul.is(':visible') ){
				$ul.hide();
				$(this).parent().removeClass('px2-header__shoulder-menu-group-opened');
			}else{
				$ul.show();
				$(this).parent().addClass('px2-header__shoulder-menu-group-opened');
			}
		});

		if( $shoulderMenuUl.is(':visible') ){
			$shoulderMenu.css({
				width: '100%' ,
				height: $(window).height()
			});
		}else{
			$shoulderMenu
				.css({
					'height': $header.outerHeight()
				})
			;
		}

		if( options.current === '' ){
			$header.find('.px2-header__px2logo').css({
				"min-width": 70,
				"width": 70
			});
			$header.find('.px2-header__px2logo a').css({
				"width": 70,
				"height": 70
			});
		}else{
			$header.find('.px2-header__px2logo').css({
				"min-width": 45,
				"width": 45
			});
			$header.find('.px2-header__px2logo a').css({
				"width": 45,
				"height": 45
			});
		}

		$header.find('[data-name]').removeClass('current');
		$header.find('[data-name="'+options.current+'"]').addClass('current');
		$('.px2-header').css({"height":$header.outerHeight()});

	}

	/**
	* ドロップダウンメニューを全て閉じる
	*/
	function closeDropdownMenus(){
		$globalMenuUl.find('li').removeClass('px2-header__global-menu-group-opened');
		$globalMenuUl.find('ul').hide();
	}

	window.px2styleV2Header = new Header();
})();
