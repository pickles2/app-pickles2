window.px = $.px = window.parent.px;
window.contApp = new (function( px ){
	if( !px ){ alert('px が宣言されていません。'); }

	var _this = this;

	var pj = px.getCurrentProject();
	var configBasePath = pj.get('path')+'/'+pj.get('home_dir');
	var confPath = configBasePath;

	function cont_init(cb){
		cb = cb||function(){};

		var $tpl = $( $('#template-main').html() );
		$('.contents').html('').append( $tpl );

		$('.cont_config_json_preview pre').text( JSON.stringify( pj.getConfig() ) );
		$('.cont_px2dtconfig_json_preview pre').text( JSON.stringify( pj.getPx2DTConfig() ) );

		var src = '';
		if( px.utils.isFile(configBasePath+'/config.json') ){
			confPath = configBasePath+'/config.json';
		}else if( px.utils.isFile(configBasePath+'/config.php') ){
			confPath = configBasePath+'/config.php';
		}
		src = px.fs.readFileSync(confPath);
		$('.cont_config_edit').html('').append( $('<textarea>').val(src) );

		var src = '';
		if( px.utils.isFile(configBasePath+'/px2dtconfig.json') ){
			src = px.fs.readFileSync( configBasePath+'/px2dtconfig.json' );
		}
		$('.cont_px2dtconfig_edit').html('').append( $('<textarea>').val(src) );

		cb();
	}
	this.save = function( btn ){
		$(btn).attr('disabled', 'disabled');

		var src = $('.cont_config_edit textarea').val();
		src = JSON.parse( JSON.stringify( src ) );

		var srcPx2DT = $('.cont_px2dtconfig_edit textarea').val();
		srcPx2DT = JSON.parse( JSON.stringify( srcPx2DT ) );

		px.fs.writeFile( confPath, src, {encoding:'utf8'}, function(err){
			pj.updateConfig(function(){
				px.fs.writeFile( configBasePath+'/px2dtconfig.json', srcPx2DT, {encoding:'utf8'}, function(err){
					pj.updatePx2DTConfig(function(){
						cont_init(function(){
							$(btn).removeAttr('disabled');
							px.message( 'コンフィグを保存しました。' );
						});
					});
				} );
			});
		} );
	}

	$(function(){
		cont_init();
	});

})( window.parent.px );