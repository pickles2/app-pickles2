/**
 * node utilities
 */
(function(exports){
	var _fs = require('fs');
	var _path = require('path'); // see: http://nodejs.jp/nodejs.org_ja/docs/v0.4/api/path.html
	var _crypto = require('crypto');
	var _pathCurrentDir = process.cwd();
	var _ejs = require('ejs');
	var DIRECTORY_SEPARATOR = '/';
	var _platform = process.platform;

	/**
	 * システムコマンドを実行する(exec)
	 */
	exports.exec = function(cmd, fnc, opts){
		opts = opts||{};
		if( opts.cd ){
			process.chdir( opts.cd );
		}
		var proc = require('child_process').exec(cmd, fnc);
		if( opts.cd ){
			process.chdir( _pathCurrentDir );
		}
		return proc;
	}

	/**
	 * システムコマンドを実行する(spawn)
	 */
	exports.spawn = function(cmd, cliOpts, opts){
		opts = opts||{};
		if( opts.cd ){
			process.chdir( opts.cd );
		}
		// console.log( opts.cd );
		// console.log( process.cwd() );

		var env = JSON.parse( JSON.stringify(process.env) );
		// console.log(env);
		env.LANG = 'en_US';
		var proc = require('child_process').spawn(cmd, cliOpts, env);
		if( opts.success ){ proc.stdout.on('data', opts.success); }
		if( opts.error ){
			proc.stderr.on('data', opts.error);
			proc.on('error', opts.error);
		}
		if( opts.complete ){ proc.on('close', opts.complete); }

		if( opts.cd ){
			process.chdir( _pathCurrentDir );
		}
		// console.log( process.cwd() );

		return proc;
	}

	/**
	 * URLを開く
	 */
	exports.openURL = function( url ){
		var cmd = 'open';
		if(_platform=='win32'){
			cmd = 'explorer';
			if( url.match(new RegExp('^(?:https?|data)\\:','i')) ){
				// OS依存しないのでスルー
			}else if( _fs.existsSync(url) ){
				url = _fs.realpathSync(url);
			}
		}
		if(_platform=='linux'){
			cmd = 'xdg-open';
		}
		return this.spawn( cmd, [url], {} );
	}

	/**
	 * ディレクトリ名を得る
	 * phpJSから拝借
	 */
	exports.dirname = function(path){
		return path.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');
	}

	/**
	 * 正規表現で使えるようにエスケープ処理を施す
	 */
	exports.escapeRegExp = function(str) {
		if( typeof(str) !== typeof('') ){return str;}
		return str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
	}

	/**
	 * パス文字列を解析する
	 */
	exports.parsePath = function( path ){
		var rtn = {};
		rtn.path = path;
		rtn.basename = this.basename( rtn.path );
		rtn.dirname = this.dirname( rtn.path );
		rtn.ext = rtn.basename.replace( new RegExp('^.*\\.'), '' );
		rtn.basenameExtless = rtn.basename.replace( new RegExp('\\.'+this.escapeRegExp(rtn.ext)+'$'), '' );
		return rtn;
	}

	/**
	 * パス文字列から、ファイル名を取り出す
	 */
	exports.basename = function( path ){
		var rtn = '';
		rtn = path.replace( new RegExp('^.*[\\/\\\\]'), '' );
		return rtn;
	}

	/**
	 * 新規ディレクトリを作成する
	 */
	exports.mkdir = function(path){
		if( _fs.existsSync(path) ){
			return true;
		}
		_fs.mkdirSync(path, 0777);
		return true;
	}

	/**
	 * ファイルまたはディレクトリが存在するか調べる
	 */
	exports.fileExists = function(path){
		if( !_fs.existsSync(path) ){
			return false;
		}
		return true;
	}

	/**
	 * パス情報から、拡張子を除いたファイル名を取得する。
	 *
	 * @param string $path 対象のパス
	 * @return string 拡張子が除かれたパス
	 */
	exports.trim_extension = function( $path ){
		var $pathinfo = this.parsePath( $path );
		var $RTN = $path.replace( new RegExp('\\.'+this.escapeRegExp( $pathinfo.ext )+'$') , '' );
		return $RTN;
	}

	/**
	 * ファイルが存在するか調べる
	 */
	exports.isFile = function(path){
		if( !this.fileExists(path) ){
			return false;
		}
		if( !_fs.statSync(path).isFile() ){
			return false;
		}
		return true;
	}

	/**
	 * ディレクトリが存在するか調べる
	 */
	exports.isDirectory = function(path){
		if( !this.fileExists(path) ){
			return false;
		}
		if( !_fs.statSync(path).isDirectory() ){
			return false;
		}
		return true;
	}

	exports.mkdirAll = function(path){
		if( this.fileExists(path) ){
			return true;
		}
		this.mkdirAll(this.dirname(path));
		this.mkdir(path, 0777);
		return true;
	}

	/**
	 * パスから拡張子を取り出して返す
	 */
	exports.getExtension = function(path){
		var ext = path.replace( new RegExp('^.*?\.([a-zA-Z0-9\_\-]+)$'), '$1' );
		return ext;
	}

	/**
	 * 致命的エラーを発生させる。
	 * エラーメッセージを出力して終了する。
	 */
	exports.fatalError = function( message ){
		console.log('[ERROR] ' + message);
		process.exit();
		return;
	}

	/**
	 * 配列を文字列に連結する
	 * phpJSから拝借
	 */
	exports.implode = function(glue, pieces){
		var i = '',
		retVal = '',
		tGlue = '';
		if (arguments.length === 1) {
			pieces = glue;
			glue = '';
		}
		if (typeof pieces === 'object') {
			if (Object.prototype.toString.call(pieces) === '[object Array]') {
				return pieces.join(glue);
			}
			for (i in pieces) {
				retVal += tGlue + pieces[i];
				tGlue = glue;
			}
			return retVal;
		}
		return pieces;
	}

	/**
	 * 配列をCSV形式に変換する
	 */
	exports.mkCsv = function(ary){
		var rtn = '';
		for( var i1 in ary ){
			for( var i2 in ary[i1] ){
				if(typeof(ary[i1][i2])!==typeof('')){
					ary[i1][i2]='';
					continue;
				}
				ary[i1][i2] = ary[i1][i2].replace(new RegExp('\"', 'g'), '""');
				if( ary[i1][i2].length ){
					ary[i1][i2] = '"'+ary[i1][i2]+'"';
				}
				continue;
			}
			rtn += this.implode(',', ary[i1]) + "\n";
		}
		return rtn;
	}

	/**
	 * ファイルの一覧を取得する
	 */
	exports.ls = function(path){
		if( !this.isDirectory(path) ){ return false; }
		return _fs.readdirSync(path);
	}

	/**
	 * ファイルを複製する
	 */
	exports.copy = function(pathFrom, pathTo){
		if( !this.isFile(pathFrom) ){ return true; }
		var res = _fs.writeFileSync(
			pathTo,
			_fs.readFileSync( pathFrom )
		);
		if( !this.isFile(pathTo) ){
			return false;
		}
		return res;
	}

	/**
	 * ファイルやディレクトリを再帰的に複製する
	 */
	exports.copy_r = function(pathFrom, pathTo){
		if( this.isFile(pathFrom) ){
			// ファイルなら単体コピーに転送
			return this.copy(pathFrom, pathTo);
		}
		if( !this.isDirectory(pathFrom) ){ return true; }

		this.mkdirAll( pathTo );
		var list = this.ls( pathFrom );
		for( var idx in list ){
			this.copy_r( pathFrom+'/'+list[idx], pathTo+'/'+list[idx] );
		}
		return true;
	}

	/**
	 * ファイルを削除する
	 */
	exports.rm = function(path){
		if( this.isDirectory(path) ){ return false; }
		if( !this.isFile(path) ){ return true; }
		_fs.unlinkSync(path);
		return !this.isFile(path);
	}

	/**
	 * ディレクトリを削除する。
	 *
	 * このメソッドはディレクトリを削除します。
	 * 中身のない、空のディレクトリ以外は削除できません。
	 *
	 * @param string $path 対象ディレクトリのパス
	 * @return bool 成功時に `true`、失敗時に `false` を返します。
	 */
	exports.rmdir = function( path ){
		if( this.isFile(path) ){ return false; }
		if( !this.isDirectory(path) ){ return true; }
		_fs.rmdirSync( path );
		return !this.isDirectory(path);
	}//rmdir()

	/**
	 * ディレクトリを再帰的に削除する。
	 *
	 * このメソッドはディレクトリを中身ごと再帰的に削除します。
	 *
	 * @param string $path 対象ディレクトリのパス
	 * @return bool 成功時に `true`、失敗時に `false` を返します。
	 */
	exports.rmdir_r = function( $path ){
		$path = _fs.realpathSync( $path );

		if( this.isFile( $path ) ){
			// ファイルまたはシンボリックリンクの場合の処理
			// ディレクトリ以外は削除できません。
			return false;

		}else if( this.isDirectory( $path ) ){
			// ディレクトリの処理
			var $filelist = this.ls($path);
			for( var idx in $filelist ){
				var $basename = $filelist[idx];
				if( this.isFile( $path+DIRECTORY_SEPARATOR+$basename ) ){
					if( !this.rm( $path+DIRECTORY_SEPARATOR+$basename ) ){
						console.log('FAILED to delete file: '+ $path+DIRECTORY_SEPARATOR+$basename);
					}
				}else if( this.isDirectory( $path+DIRECTORY_SEPARATOR+$basename ) ){
					if( !this.rmdir_r( $path+DIRECTORY_SEPARATOR+$basename ) ){
						console.log('FAILED to delete directory: '+ $path+DIRECTORY_SEPARATOR+$basename);
					}
				}
			}
			return this.rmdir( $path );
		}

		return false;
	}//rmdir_r()

	/**
	 * ファイルに行を追加する
	 */
	exports.fileAppend = function(path, contents){
		if( !this.isFile(path) ){
			return _fs.writeFileSync( path , contents );
		}

		var stat = _fs.statSync(path);
		var fd = _fs.openSync(path, "a");
		var rtn = _fs.writeSync(fd, contents.toString(), stat.size);
		_fs.closeSync(fd);

		return rtn;
	}


	/**
	 * 絶対パスを得る。
	 *
	 * パス情報を受け取り、スラッシュから始まるサーバー内部絶対パスに変換して返します。
	 *
	 * このメソッドは、PHPの `realpath()` と異なり、存在しないパスも絶対パスに変換します。
	 *
	 * @param string $path 対象のパス
	 * @param string $cd カレントディレクトリパス。実在する有効なディレクトリのパス、または絶対パスの表現で指定される必要があります。省略時、カレントディレクトリを自動採用します。
	 * @return string 絶対パス
	 */
	exports.get_realpath = function( $path, $cd ){
		var $is_dir = false;
		if( $path.match( new RegExp('(\\/|\\\\)+$') ) ){
			$is_dir = true;
		}
		$path = this.localize_path($path);
		if( $cd === null || $cd === undefined ){ $cd = '.'; }
		$cd = this.localize_path($cd);
		var $preg_dirsep = this.escapeRegExp( DIRECTORY_SEPARATOR );

		if( this.isDirectory($cd) ){
			$cd = _fs.realpathSync($cd);
		}else if( !$cd.match(new RegExp('^((?:[A-Za-z]\\:'+$preg_dirsep+')|'+$preg_dirsep+'{1,2})(.*?)$') ) ){
			$cd = false;
		}
		if( $cd === false ){
			return false;
		}

		var $prefix = '';
		var $localpath = $path;
		if( $path.match( new RegExp('^((?:[A-Za-z]\\:'+$preg_dirsep+')|'+$preg_dirsep+'{1,2})(.*?)$') ) ){
			// もともと絶対パスの指定か調べる
			$prefix = RegExp.$1;
			$localpath = RegExp.$2;

			$prefix = $prefix.replace( new RegExp(''+$preg_dirsep+'$'), '');
			$cd = null; // 元の指定が絶対パスだったら、カレントディレクトリは関係ないので捨てる。
		}

		$path = (typeof($cd)===typeof('')?$cd:'')+DIRECTORY_SEPARATOR+'.'+DIRECTORY_SEPARATOR+$localpath;

		if( this.isFile( $prefix.$path ) ){
			$rtn = _fs.realpathSync( $prefix.$path );
			if( $is_dir && $rtn != _fs.realpathSync('/') ){
				$rtn += DIRECTORY_SEPARATOR;
			}
			return $rtn;
		}

		var $paths = $path.split( DIRECTORY_SEPARATOR );
		$path = '';
		for( var $idx in $paths ){
			var $row = $paths[$idx];
			if( $row == '' || $row == '.' ){
				continue;
			}
			if( $row == '..' ){
				$path = this.dirname($path);
				if($path == DIRECTORY_SEPARATOR){
					$path = '';
				}
				continue;
			}
			if(!($idx===0 && DIRECTORY_SEPARATOR == '\\' && $row.match(new RegExp('^[a-zA-Z]\:$','s')))){
				$path += DIRECTORY_SEPARATOR;
			}
			$path += $row;
		}

		var $rtn = $prefix+$path;
		if( $is_dir ){
			$rtn += DIRECTORY_SEPARATOR;
		}
		return $rtn;
	}// get_realpath()


	/**
	 * 相対パスを得る。
	 *
	 * パス情報を受け取り、ドットスラッシュから始まる相対絶対パスに変換して返します。
	 *
	 * @param string $path 対象のパス
	 * @param string $cd カレントディレクトリパス。実在する有効なディレクトリのパス、または絶対パスの表現で指定される必要があります。省略時、カレントディレクトリを自動採用します。
	 * @return string 相対パス
	 */
	exports.get_relatedpath = function( $path, $cd ){
		var $is_dir = false;
		if( $path.match( new RegExp('(\/|\\\\)+$','s') ) ){
			$is_dir = true;
		}
		if( typeof($cd) === typeof('') && $cd.length ){
			$cd = _fs.realpathSync('.');
		}else if( this.isDirectory($cd) ){
			$cd = _fs.realpathSync($cd);
		}else if( this.isFile($cd) ){
			$cd = _fs.realpathSync(this.dirname($cd));
		}
		var $normalize = function( $tmp_path ){
			var $tmp_path = this.localize_path( $tmp_path );
			var $preg_dirsep = this.escapeRegExp( DIRECTORY_SEPARATOR );
			if( DIRECTORY_SEPARATOR == '\\' ){
				$tmp_path = preg_replace( '/^[a-zA-Z]\:/s', '', $tmp_path );
			}
			$tmp_path = preg_replace( '/^('+$preg_dirsep+')+/s', '', $tmp_path );
			$tmp_path = preg_replace( '/('+$preg_dirsep+')+$/s', '', $tmp_path );
			if( strlen($tmp_path) ){
				$tmp_path = explode( DIRECTORY_SEPARATOR, $tmp_path );
			}else{
				$tmp_path = [];
			}

			return $tmp_path;
		};

		$cd = $normalize($cd);
		$path = $normalize($path);

		var $rtn = [];
		while( 1 ){
			if( !count($cd) || !count($path) ){
				break;
			}
			if( $cd[0] === $path[0] ){
				array_shift( $cd );
				array_shift( $path );
				continue;
			}
			break;
		}
		if( $cd.length ){
			for(var idx in $cd){
				var $dirname = $cd[idx];
				$rtn.push('..');
			}
		}else{
			$rtn.push('.');
		}
		$rtn = array_merge( $rtn, $path );
		$rtn = implode( DIRECTORY_SEPARATOR, $rtn );

		if( $is_dir ){
			$rtn += DIRECTORY_SEPARATOR;
		}
		return $rtn;
	}// get_relatedpath()

	/**
	 * パスをOSの標準的な表現に変換する。
	 *
	 * 受け取ったパスを、OSの標準的な表現に変換します。
	 * - スラッシュとバックスラッシュの違いを吸収し、`DIRECTORY_SEPARATOR` に置き換えます。
	 *
	 * @param string $path ローカライズするパス
	 * @return string ローカライズされたパス
	 */
	exports.localize_path = function($path){
		if( typeof($path) !== typeof('') ){return $path;}
		// $path = this.convert_filesystem_encoding( $path );//文字コードを揃える
		$path = $path.replace( new RegExp('\\/|\\\\'), '/' );//一旦スラッシュに置き換える。
		if( this.is_unix() ){
			// Windows以外だった場合に、ボリュームラベルを受け取ったら削除する
			$path = $path.replace( new RegExp('^[A-Z]\\:\\/'), '/' );//Windowsのボリュームラベルを削除
		}
		$path = $path.replace( new RegExp('\\/+'), '/' );//重複するスラッシュを1つにまとめる
		$path = $path.replace( new RegExp('\\/|\\\\'), DIRECTORY_SEPARATOR );
		return $path;
	}

	/**
	 * パスを正規化する。
	 *
	 * 受け取ったパスを、スラッシュ区切りの表現に正規化します。
	 *
	 * @param string $path 正規化するパス
	 * @return string 正規化されたパス
	 */
	exports.normalize_path = function($path){
		if( typeof($path) !== typeof('') ){return $path;}
		// $path = this.convert_encoding( $path );//文字コードを揃える
		$path = $path.replace( new RegExp('\\/|\\\\'), '/' );//一旦スラッシュに置き換える。
		// ボリュームラベルを受け取ったら削除する
		$path = $path.replace( new RegExp('^[A-Z]\\:\\/'), '/' );//Windowsのボリュームラベルを削除
		$path = $path.replace( new RegExp('\\/+'), '/' );//重複するスラッシュを1つにまとめる
		return $path;
	}

	/**
	 * サーバがUNIXパスか調べる。
	 *
	 * @return bool UNIXパスなら `true`、それ以外なら `false` を返します。
	 */
	exports.is_unix = function(){
		if( DIRECTORY_SEPARATOR == '/' ){
			return true;
		}
		return false;
	}//is_unix()

	/**
	 * サーバがWindowsパスか調べる。
	 *
	 * @return bool Windowsパスなら `true`、それ以外なら `false` を返します。
	 */
	exports.is_windows = function(){
		if( DIRECTORY_SEPARATOR == '\\' ){
			return true;
		}
		return false;
	}//is_windows()


	/**
	 * 直列処理
	 */
	exports.iterate = function(ary, fnc, fncComplete){
		new (function( ary, fnc ){
			this.idx = -1;
			this.idxs = [];
			for( var i in ary ){
				this.idxs.push(i);
			}
			this.ary = ary||[];
			this.fnc = fnc||function(){};
			this.fncComplete = fncComplete||function(){};

			this.next = function(){
				if( this.idx+1 >= this.idxs.length ){
					this.fncComplete();
					return this;
				}
				this.idx ++;
				this.fnc( this, this.ary[this.idxs[this.idx]], this.idxs[this.idx] );
				return this;
			}
			this.next();
		})(ary, fnc);
	}

	/**
	 * 関数の直列処理
	 */
	exports.iterateFnc = function(aryFuncs){
		function iterator( aryFuncs ){
			aryFuncs = aryFuncs||[];

			var idx = 0;
			var funcs = aryFuncs;

			this.start = function(arg){
				arg = arg||{};
				if(funcs.length <= idx){return this;}
				(funcs[idx++])(this, arg);
				return this;
			}

			this.next = this.start;
		}
		return new iterator(aryFuncs);
	}

	/**
	 * URIパラメータをパースする
	 */
	exports.parseUriParam = function(url){
		var paramsArray = [];
		parameters = url.split("?");
		if( parameters.length > 1 ) {
			var params = parameters[1].split("&");
			for ( var i = 0; i < params.length; i++ ) {
				var paramItem = params[i].split("=");
				for( var i2 in paramItem ){
					paramItem[i2] = decodeURIComponent( paramItem[i2] );
				}
				paramsArray.push( paramItem[0] );
				paramsArray[paramItem[0]] = paramItem[1];
			}
		}
		return paramsArray;
	}

	/**
	 * Markdown形式のテキストをHTMLに変換
	 */
	exports.markdown = function( src ){
		var marked = require('marked');
		marked.setOptions({
			renderer: new marked.Renderer(),
			gfm: true,
			tables: true,
			breaks: false,
			pedantic: false,
			sanitize: false,
			smartLists: true,
			smartypants: false
		});

		return marked(src);

		// var markdown = require( "markdown" ).markdown;
		// var rtn = markdown.toHTML( src );
		// return rtn;
	}

	/**
	 * ejs テンプレートにデータをバインドする
	 */
	exports.bindEjs = function( tpl, data, options ){
		var rtn = '';
		try {
			var template = _ejs.compile(tpl.toString(), options);
			rtn = template(data);
		} catch (e) {
			var errorMessage = 'TemplateEngine "EJS" Rendering ERROR.';
			console.log( errorMessage );
			rtn = errorMessage;
		}

		return rtn;
	}

	/**
	 * Base64 encode
	 */
	exports.base64encode = function( bin ){
		var base64 = bin.toString('base64');
		return base64;
	}

	/**
	 * Base64 decode
	 */
	exports.base64decode = function( base64 ){
		var bin = (new Buffer(base64, 'base64')).toString();
		return bin;
	}

	/**
	 * md5 hash
	 */
	exports.md5 = function( val ){
		var md5 = _crypto.createHash('md5');
		var origin = val+'';
		md5.update( origin, 'utf8' );
		var rtn = md5.digest('hex');
		return rtn;
	}

	/**
	 * strlen
	 */
	exports.strlen = function(str){
		if( typeof(str) !== typeof('') ){
			return 0;
		}
		return str.length;
	}

})(exports);
