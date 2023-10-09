(function(){
	const $ = require('jquery');
	window.parent.px.cancelDrop( window );
	if( window.parent.px.getAppearance() == 'dark' ){
		// --------------------------------------
		// ダークモードスタイルを読み込む
		$('html').addClass('px2-darkmode');

		var $linkPx2styleDarkmode = document.createElement('link');
		$linkPx2styleDarkmode.href = '../../common/px2style/dist/themes/darkmode.css';
		$linkPx2styleDarkmode.rel = 'stylesheet';
		$linkPx2styleDarkmode.className = 'px2-darkmode';
		var $px2styleTheme = document.querySelector('link.px2style-theme');
		$px2styleTheme.parentNode.insertBefore($linkPx2styleDarkmode, $px2styleTheme.nextElementSibling);

		var $linkContentsDarkmode = document.createElement('link');
		$linkContentsDarkmode.href = '../../common/styles/contents-darkmode.css';
		$linkContentsDarkmode.rel = 'stylesheet';
		$linkContentsDarkmode.className = 'px2-darkmode';
		var $contentsStylesheet = document.querySelector('link.contents-stylesheet');
		$contentsStylesheet.parentNode.insertBefore($linkContentsDarkmode, $contentsStylesheet.nextElementSibling);
	}
})();
