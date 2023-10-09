window.px = window.parent.px;
window.contApp = new (function(px, $){
	var _this = this;
	var pj = px.getCurrentProject();
	var $form, $progress, $results, $resultsUl;
	var $tpl_searchForm;
	var SinD;
	var hitCount = 0;
	var targetCount = 0;

	var publicCacheDir = pj.getConfig().public_cache_dir || '/caches/';


	/**
	 * 初期化
	 */
	function init(){
		$form = $('.cont_form');
		$progress = $('.cont_progress');
		$results = $('.cont_results');
		$resultsProgress = $('<div>');
		$resultsUl = $('<ul>');
		$tpl_searchForm = $('#template-search-form').html();

		$form.html('').append( $tpl_searchForm );
		$form
			.find('form')
				.bind('submit', function(){
					if( SinD ){
						SinD.cancel();
						return false;
					}
					hitCount = 0;
					targetCount = 0;
					$results
						.html('')
						.append( $resultsProgress.html('') )
						.append( $resultsUl.html('') )
					;
					updateResultsProgress();
					$progress.html( $('#template-progress').html() ).show();


					var keyword = $(this).find('[name=keyword]').val();
					var finTargets = decideTargets( $(this) );
					console.log(finTargets);

					// 検索を実施
					SinD = new px.SearchInDir(
						finTargets['target'],
						{
							'keyword': keyword ,
							'filter': finTargets['filter'],
							'ignore': finTargets['ignore'],
							'allowRegExp': finTargets.allowRegExp,
							'ignoreCase': finTargets.ignoreCase,
							'matchFileName': finTargets.matchFileName,
							'progress': function( done, max ){
								targetCount = max;
								var per = Number(done/max*100);
								$progress.find('.progress .progress-bar')
									.text(done+'/'+max)
									.css({'width':per+'%'})
								;
								updateResultsProgress();
							},
							'match': function( file, result ){
								hitCount ++;
								updateResultsProgress();

								var src = $('#template-search-result').html();
								var tplDataObj = {
									'path': _this.getPath(file) ,
									'file': file ,
									'result': result
								};

								var html = window.twig({
									data: src
								}).render(tplDataObj);
								var $html = $(html);
								$html.find('a[data-role=openInFinder]')
									.click(function(){
										px.utils.openURL( px.utils79.dirname($(this).attr('data-file-path')) );
										return false;
									})
								;
								$html.find('a[data-role=openInTextEditor]')
									.click(function(){
										px.openInTextEditor( $(this).attr('data-file-path') );
										return false;
									})
								;
								$html.find('a[data-role=open]')
									.click(function(){
										px.utils.openURL( $(this).attr('data-file-path') );
										return false;
									})
								;

								$resultsUl.append($html);
							} ,
							'error': function( file, error ){
							} ,
							'complete': function(){
								updateResultsProgress();
								setTimeout(function(){
									$progress.hide('fast');
									SinD = null;
								},2000);
							}
						}
					);
					return false;
				})
		;
	}

	function updateResultsProgress(){
		$resultsProgress.html(targetCount + 'ファイル中、' + hitCount + 'ファイルがヒット')
	}

	function decideTargets( $form ){
		var rtn = {
			'target': [],
			'filter':[],
			'ignore': [],
			'allowRegExp': false,
			'ignoreCase': false,
			'matchFileName': false
		};

		var targetDir = $form.find('select[name=target-dir]').val();
		switch(targetDir){
			case 'home_dir':
				rtn['target'].push(px.fs.realpathSync(pj.get('path')+'/'+pj.get('home_dir'))+'/**/*');
				break;
			case 'contents_comment':
				rtn['target'].push(px.fs.realpathSync(pj.get('path'))+'/**/*');
				rtn['filter'].push( new RegExp( px.utils79.preg_quote('/comments.ignore/comment.') ) );
				break;
			case 'sitemaps':
				rtn['target'].push(px.fs.realpathSync(pj.get('path')+'/'+pj.get('home_dir')+'/sitemaps')+'/**/*');
				break;
			case 'sys-caches':
				rtn['target'].push(px.fs.realpathSync(pj.get('path')+'/'+publicCacheDir)+'/**/*');
				rtn['target'].push(px.fs.realpathSync(pj.get('path')+'/'+pj.get('home_dir')+'/_sys')+'/**/*');
				break;
			case 'packages':
				if(pj.get_realpath_composer_root()){
					rtn['target'].push(px.fs.realpathSync(pj.get_realpath_composer_root()+'vendor')+'/**/*');
					rtn['target'].push(px.fs.realpathSync(pj.get_realpath_composer_root()+'composer.json'));
					rtn['target'].push(px.fs.realpathSync(pj.get_realpath_composer_root()+'composer.lock'));
				}
				if(pj.get_realpath_npm_root()){
					rtn['target'].push(px.fs.realpathSync(pj.get_realpath_npm_root()+'node_modules')+'/**/*');
					rtn['target'].push(px.fs.realpathSync(pj.get_realpath_npm_root()+'package.json'));
				}
				break;
			case 'all':
			default:
				rtn['target'].push(px.fs.realpathSync(pj.get('path'))+'/**/*');
				break;
		}

		function setIgnore( checkbox, path ){
			if( !px.utils79.is_dir(path) ){
				return;
			}
			path = px.fs.realpathSync(path);
			path = new RegExp( px.utils79.preg_quote( path ) );
			if( $form.find('input[name=ignore-'+checkbox+']:checked').size() ){
				rtn['ignore'].push( path );
			}
			return;
		}

		if( $form.find('input[name=target-contents-comment]:checked').size() ){
			rtn['ignore'].push( new RegExp( px.utils79.preg_quote('/comments.ignore/comment.') ) );
		}
		setIgnore( 'sitemap', pj.get('path')+'/'+pj.get('home_dir')+'sitemaps/' );
		setIgnore( 'px-files', pj.get('path')+'/'+pj.get('home_dir') );
		setIgnore( 'sys-caches', pj.get('path')+'/'+publicCacheDir );
		setIgnore( 'sys-caches', pj.get('path')+'/'+pj.get('home_dir')+'_sys/' );

		if(pj.get_realpath_composer_root()){
			setIgnore( 'packages', pj.get_realpath_composer_root()+'vendor/' );
			setIgnore( 'packages', pj.get_realpath_composer_root()+'composer.json' );
			setIgnore( 'packages', pj.get_realpath_composer_root()+'composer.lock' );
		}
		if(pj.get_realpath_npm_root()){
			setIgnore( 'packages', pj.get_realpath_npm_root()+'node_modules/' );
			setIgnore( 'packages', pj.get_realpath_npm_root()+'package.json' );
		}

		if( $form.find('input[name=options-regexp]:checked').size() ){
			rtn.allowRegExp = true;
		}
		if( $form.find('input[name=options-ignorecase]:checked').size() ){
			rtn.ignoreCase = true;
		}
		if( $form.find('input[name=options-matchfilename]:checked').size() ){
			rtn.matchFileName = true;
		}

		return rtn;
	}

	/**
	 * イベント
	 */
	$(function(){
		init();
	});

	this.getPath = function(file){
		file = file.replace( new RegExp('^'+px.utils79.preg_quote(pj.get('path'))), '' );
		return file;
	}

})(px, $);
