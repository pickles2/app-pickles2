(function(){
	const $ = require('jquery');
	window.parent.px.cancelDrop( window );
	if( window.parent.px.getAppearance() == 'dark' ){
		// --------------------------------------
		// ダークモードスタイルを読み込む
		$('html').addClass('px2-darkmode');
		var $px2styleTheme = document.querySelector('link.px2style-theme');
		$px2styleTheme.href = '../../common/px2style/dist/themes/darkmode.css';

		var $link = document.createElement('link');
		$link.href = '../../common/styles/contents-darkmode.css';
		$link.rel = 'stylesheet';
		$link.className = 'px2-darkmode';
		document.querySelector('link.contents-stylesheet').parentNode.insertBefore($link, $px2styleTheme.nextElementSibling);
	}
})();
