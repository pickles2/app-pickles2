(function(){
	const $ = require('jquery');
	window.parent.px.cancelDrop( window );
	if( window.parent.px.getAppearance() == 'dark' ){
		$('html').addClass('px2-darkmode');
		document.querySelector('.px2style-theme').href = '../../common/px2style/dist/themes/darkmode.css';
	}
})();
