/**
 * px.project.site
 */
module.exports = function( px, pj, callbackOnStandby ) {
	global.__defineGetter__('__LINE__', function () { return (new Error()).stack.split('\n')[2].split(':').reverse()[1]; }); var var_dump = function(val){ console.log(val); };

	var _this = this;
	var _sitemap = null;
	var _sitemap_id_map = null;
	var _sitemap_dynamic_paths = [];

	/**
	 * ページ情報を取得する。
	 *
	 * このメソッドは、指定したページの情報を連想配列で返します。対象のページは第1引数にパスまたはページIDで指定します。
	 *
	 * カレントページの情報を取得する場合は、代わりに `$px->site()->get_current_page_info()` が使用できます。
	 *
	 * パスで指定したページの情報を取得する例 :
	 * <pre>&lt;?php
	 * // ページ &quot;/aaa/bbb.html&quot; のページ情報を得る
	 * $page_info = $px-&gt;site()-&gt;get_page_info('/aaa/bbb.html');
	 * var_dump( $page_info );
	 * ?&gt;</pre>
	 *
	 * ページIDで指定したページの情報を取得する例 :
	 * <pre>&lt;?php
	 * // トップページのページ情報を得る
	 * // (トップページのページIDは必ず空白の文字列)
	 * $page_info = $px-&gt;site()-&gt;get_page_info('');
	 * var_dump( $page_info );
	 * ?&gt;</pre>
	 *
	 * @param string $path 取得するページのパス または ページID。省略時、カレントページから自動的に取得します。
	 * @param string $key 取り出す単一要素のキー。省略時はすべての要素を含む連想配列が返されます。省略可。
	 * @return mixed 単一ページ情報を格納する連想配列、`$key` が指定された場合は、その値のみ。
	 */
	this.getPageInfo = function( $path, $key ){
		var _config = pj.getConfig();

		if( $path === null || $path === undefined ){ return null; }
		if( _sitemap_id_map && _sitemap_id_map[$path] ){
			//ページIDで指定された場合、パスに置き換える
			$path = _sitemap_id_map[$path];
		}

		if( !$path.match( new RegExp('^(?:\/|[a-zA-Z0-9]+\:)','') ) ){
			// $path が相対パスで指定された場合
			$path.match( new RegExp('(\/)$','') );
			$path = px.utils.get_realpath( '/'+$path );
			if( RegExp.$1 && RegExp.$1.length ){ $path += RegExp.$1; }
			$path = px.utils.normalize_path($path);
		}
		$path = $path.replace( new RegExp('\\/'+pj.get_directory_index_preg_pattern()+'((?:\\?|\\#).*)?$','i'), '/$1' );//directory_index を一旦省略

		var $tmp_path = $path;
		if( !_sitemap_id_map[$path] ){
			var dirIndex = pj.get_directory_index();
			for( var idx in dirIndex ){
				var $index_file_name = dirIndex[idx];
				$tmp_path = $path.replace( new RegExp('\\/((?:\\?|\\#).*)?$','i'), '/'+$index_file_name+'$1');//省略された index.html を付加。
				if( _sitemap[$tmp_path] ){
					break;
				}
			}
		}
		$path = $tmp_path;
		var $parsed_url = px.utils.parsePath($path);
		delete $tmp_path;

		if( !_sitemap[$path] ){
			//  サイトマップにズバリなければ、
			//  ダイナミックパスを検索する。
			$sitemap_dynamic_path = this.get_dynamic_path_info( $path );
			if( typeof( $sitemap_dynamic_path ) === typeof([]) ){
				$path = $sitemap_dynamic_path['path_original'];
			}
		}
		var $args = [];

		switch( this.getPathType($path) ){
			case 'full_url':
			case 'javascript':
			case 'anchor':
				break;
			default:
				$path = $path.replace( new RegExp('\\/$','i') , '/'+pj.get_directory_index_primary() );
				break;
		}

		if( !_sitemap[$path] ){
			//  サイトマップにズバリなければ、
			//  引数からパラメータを外したパスだけで再検索
			$path = $parsed_url['path'];
		}

		var $rtn = _sitemap[$path];
		if( typeof($rtn) !== typeof([]) ){ return null; }
		if( !px.utils.strlen( $rtn['title_breadcrumb'] ) ){ $rtn['title_breadcrumb'] = $rtn['title']; }
		if( !px.utils.strlen( $rtn['title_h1'] ) ){ $rtn['title_h1'] = $rtn['title']; }
		if( !px.utils.strlen( $rtn['title_label'] ) ){ $rtn['title_label'] = $rtn['title']; }
		if( !px.utils.strlen( $rtn['title_full'] ) ){ $rtn['title_full'] = $rtn['title']+' | '+_config.name; }
		if( px.utils.strlen( $key ) ){
			$rtn = $rtn[$key];
		}

		return $rtn;
	}

	/**
	 * サイトマップ配列の全量を得る
	 */
	this.getSitemap = function(){
		return _sitemap;
	}

	/**
	 * サイトマップ情報を更新する
	 */
	this.updateSitemap = function( cb ){
		pj.px2proj.get_sitemap(
			function(sitemap_data_memo){
				_sitemap = sitemap_data_memo;

				_sitemap_dynamic_paths = [];
				for( var idx in _sitemap ){
					var $tmp_array = _sitemap[idx];
					if( _this.getPathType( $tmp_array['path'] ) == 'dynamic' ){
						//ダイナミックパスのインデックス作成
						var $tmp_preg_pattern = $tmp_array['path'];
						var $preg_pattern = '';
						while(1){
							if( !$tmp_preg_pattern.match( new RegExp('^([\\s\\S]*?)\\{(\\$|\\*)([a-zA-Z0-9\\-\\_]*)\\}([\\s\\S]*)$') ) ){
								$preg_pattern += px.utils.escapeRegExp( $tmp_preg_pattern );
								break;
							}
							var tmp_matched_1 = RegExp.$1;
							var tmp_matched_2 = RegExp.$2;
							var tmp_matched_3 = RegExp.$3;
							var tmp_matched_4 = RegExp.$4;

							$preg_pattern = $preg_pattern + px.utils.escapeRegExp( tmp_matched_1 );
							switch( px.utils79.trim(tmp_matched_2) ){
								case '$':
									$preg_pattern += '([a-zA-Z0-9\\-\\_]+)';
									break;
								case '*':
									$preg_pattern += '([\\s\\S]*?)';
									break;
							}
							$tmp_preg_pattern = tmp_matched_4;

							delete tmp_matched_1;
							delete tmp_matched_2;
							delete tmp_matched_3;
							delete tmp_matched_4;
							continue;
						}
						$tmp_array['path'].match( new RegExp('\\{(\\$|\\*)([a-zA-Z0-9\\-\\_]*)\\}','g') );
						var patternMap = RegExp.$2;
						$tmp_path_original = $tmp_array['path'];
						$tmp_array['path'] = $tmp_array['path'].replace( new RegExp( px.utils.escapeRegExp('{')+'(\\$|\\*)([a-zA-Z0-9\\-\\_]*)'+px.utils.escapeRegExp('}') ), '$2');
						_sitemap_dynamic_paths.push( {
							'path': $tmp_array['path'],
							'path_original': $tmp_path_original,
							'id': $tmp_array['id'],
							'preg': '^'+$preg_pattern+'$',
							'pattern_map': patternMap
						} );
						if( px.utils.strlen( $tmp_array['content'] ) ){
							$tmp_array['content'] = $tmp_array['path'];
						}
						$tmp_array['path'] = $tmp_path_original;
						$tmp_array['content'] = $tmp_array['content'].replace( new RegExp( '\\/$' ), '/'+pj.get_directory_index_primary() );
						delete $preg_pattern;
						delete $pattern_map;
						delete $tmp_path_original;
					}

				}

				cb( _sitemap );
			}
		);
		return this;
	}

	/**
	 * パス文字列を受け取り、種類を判定する。
	 *
	 * @param string $path 調べるパス
	 * @return string|bool 判定結果。
	 * - `javascript:` から始まる場合 => 'javascript'
	 * - `#:` から始まる場合 => 'anchor'
	 * - `http://` などURLスキーマ名から始まる場合 => 'full_url'
	 * - その他で `alias:` から始まる場合 => 'alias'
	 * - `{$xxxx}` または `{*xxxx}` を含む場合 => 'dynamic'
	 * - `/` から始まる場合 => 'normal'
	 * - どれにも当てはまらない不明な形式の場合に、`false` を返します。
	 */
	this.getPathType = function( $path ) {
		var $path_type = null;
		if( $path.match( new RegExp('^(?:alias[0-9]*\\:)?javascript\\:','i') ) ) {
			//  javascript: から始まる場合
			//  サイトマップ上での重複を許容するために、
			//  自動的にalias扱いとなることを考慮した正規表現。
			$path_type = 'javascript';
		} else if( $path.match( new RegExp('^(?:alias[0-9]*\\:)?\\#') ) ) {
			//  # から始まる場合
			//  サイトマップ上での重複を許容するために、
			//  自動的にalias扱いとなることを考慮した正規表現。
			$path_type = 'anchor';
		} else if( $path.match( new RegExp('^(?:alias[0-9]*\\:)?[a-zA-Z0-90-9]+\\:\\/\\/') ) ) {
			//  http:// などURLスキーマから始まる場合
			//  サイトマップ上での重複を許容するために、
			//  自動的にalias扱いとなることを考慮した正規表現。
			$path_type = 'full_url';
		} else if( $path.match( new RegExp('^alias[0-9]*\\:') ) ) {
			//  alias:から始まる場合
			//  サイトマップデータ上でpathは一意である必要あるので、
			//  alias と : の間に、後から連番を降られる。
			//  このため、数字が含まれている場合を考慮した。(@tomk79)
			$path_type = 'alias';
		} else if( $path.match( new RegExp('\\{(?:\\$|\\*)(?:[a-zA-Z0-9\\_\\-]*)\\}') ) ) {
			//  {$xxxx} または {*xxxx} を含む場合(ダイナミックパス)
			$path_type = 'dynamic';
		} else if( $path.match( new RegExp('^\\/') ) ) {
			//  /から始まる場合
			$path_type = 'normal';
		} else {
			//  どれにも当てはまらない場合はfalseを返す
			$path_type = false;
		}
		return $path_type;
	}//getPathType()


	/**
	 * ダイナミックパス情報を得る。
	 *
	 * @param string $path 対象のパス
	 * @return string|bool 見つかった場合に、ダイナミックパスを、見つからない場合に `false` を返します。
	 */
	this.get_dynamic_path_info = function( $path ){
		for( var idx in _sitemap_dynamic_paths ){
			var $sitemap_dynamic_path = _sitemap_dynamic_paths[idx];

			//ダイナミックパスを検索
			if( $sitemap_dynamic_path['path_original'] == $path ){
				return $sitemap_dynamic_path;
			}
			if( $path.match( new RegExp( $sitemap_dynamic_path['preg'] ) , $path ) ){
				return $sitemap_dynamic_path;
			}
		}
		return false;
	}


	px.utils.iterateFnc([
		function(it, arg){
			_this.updateSitemap( function(code){
				it.next(arg);
			} );
		} ,
		function(it, arg){
			_sitemap_id_map = {};
			for( var i in _sitemap ){
				_sitemap_id_map[_sitemap[i].id] = _sitemap[i];
			}
			it.next(arg);
			// itPj.next(arg);
		} ,
		function(it, arg){
			callbackOnStandby();
		}
	]).start({});

	return this;

};
