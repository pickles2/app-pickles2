(function(exports){

	/**
	 * 移動されたコンテンツのリンクを張り替える
	 */
	exports.relink = function(px, pj, task, targetList, cb){
		cb = cb||function(){};


		/**
		 * パスの置き換え
		 */
		function replacePath( path, currentPath, task ){
			var tmp = px.utils79.trim(path);
			if( tmp.match( new RegExp('^[a-zA-Z]+\\:') ) ){
				return path;
			}
			if( tmp.match( new RegExp('^\\/\\/') ) ){
				return path;
			}

			// パラメータとハッシュを分解
			var hash = '';
			if( tmp.match( new RegExp( '^([\\s\\S]*?)(\\#[\\s\\S]*)$' ) ) ){
				tmp = RegExp.$1;
				hash = RegExp.$2;
			}
			var param = '';
			if( tmp.match( new RegExp( '^([\\s\\S]*?)(\\?[\\s\\S]*)$' ) ) ){
				tmp = RegExp.$1;
				param = RegExp.$2;
			}

			var mem = {};
			path.match( new RegExp('^([\\s]*)[\\s\\S]*?([\\s]*)$') );
			mem.whiteSpaceBefore = RegExp.$1;
			mem.whiteSpaceAfter  = RegExp.$2;
			mem.dirname = px.path.dirname( tmp );
			mem.basename = px.path.basename( tmp );

			var is = {};
			is.abs = px.path.isAbsolute(tmp);
			is.slashClosed = tmp.match( new RegExp('\\/$') );
			is.dotSlashStart = tmp.match( new RegExp('^\\.\\/') );

			if( is.slashClosed ){
				mem.dirname = px.path.dirname( tmp+'index.html' );//←このindex.htmlは捨てられるのでなんでもいいやつ。
				mem.basename = '';
			}

			tmp = px.path.resolve('/', px.path.dirname(currentPath), mem.dirname);
			if( is.slashClosed ){
				tmp += '/'+pj.get_directory_index_primary();
			}else if( mem.basename.length ){
				tmp += '/'+mem.basename;
			}
			tmp = px.path.resolve( tmp );
			if( tmp != task.from ){
				// リンク先が、今回移動したファイルと別だったら、
				// 変換しない。元のまま返す。
				return path;
			}

			tmp = task.to;

			if( !is.abs ){
				tmp = px.path.relative( px.path.dirname(currentPath), tmp );
				if( !tmp.length ){
					tmp = '.';
				}
				if( is.dotSlashStart ){
					tmp = './'+tmp;
				}
			}
			if( is.slashClosed ){
				tmp = tmp.replace( new RegExp( '\\/'+pj.get_directory_index_preg_pattern()+'$' ), '/' );
				// tmp += '/'; // ← UTODO: directory_index を削除する処理に変更予定
			}

			tmp += param + hash;
			tmp = mem.whiteSpaceBefore + tmp + mem.whiteSpaceAfter;

			// console.log( task.from, tmp, currentPath );
			return tmp;
		}// replacePath();


		/**
		 * HTMLフォーマット向けの置換処理
		 */
		function replaceHtml( code, currentPath, task ){
			var tmp = code;
			code = '';
			while( 1 ){
				if( tmp.match( new RegExp( '^([\\s\\S]*?)(href|src)\\=(\\"|\\\')([\\s\\S]*?)(?:\\3)([\\s\\S]*)$','i' ) ) === null ){
					code += tmp;
					break;
				}
				var memo = {}
				memo.before = RegExp.$1 + RegExp.$2 + '=' + RegExp.$3;
				memo.after = RegExp.$3;
				memo.path = RegExp.$4;
				tmp = RegExp.$5;

				memo.path = replacePath( memo.path, currentPath, task );
				code += memo.before + memo.path + memo.after;
				continue;
			}
			return code;
		}// replaceHtml()

		px.utils.iterate(
			targetList ,
			function(it, row, idx){
				px.fs.readFile( pj.get_realpath_controot()+row, {}, function(err, data){
					var code = data.toString();
					var md5CodeBefore = px.utils.md5( code );

					var ext = px.utils.getExtension( row );
					switch( ext.toLowerCase() ){
						case 'html':
						case 'htm':
						case 'inc':
							code = replaceHtml( code, row, task );
							break;
						case 'md':
							code = replaceHtml( code, row, task );
							break;
					}

					var md5CodeAfter = px.utils.md5( code );
					if( md5CodeBefore === md5CodeAfter ){
						it.next();
						return;
					}

					px.fs.writeFile( pj.get_realpath_controot()+row, code, {}, function(){
						it.next();
					} );
				} );
			},
			function(){
				cb( true );
			}
		);

		// for( var idx in targetList ){
		// }

	}


})(window.contApp.relink = {});
