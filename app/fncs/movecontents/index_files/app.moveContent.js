(function(exports){

	/**
	 * コンテンツファイルのコードを書き換える
	 */
	function replaceContentSrc( px, pj, code, pathBase, task, resourceDir ){

		// JavaScript の RegExp における "." (ドット)は、
		// 改行文字にはマッチできないらしい...。
		// 代わりに、 [\\s\\S] と書くと、あらゆる1文字にマッチできるとのこと。
		// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/RegExp
		// （この文字は小数点です） 改行文字（\n、\r、 \u2028、あるいは、\u2029）を除いたあらゆる 1 文字にマッチします（ [\s\S] という正規表現を使えば、改行文字を含めたあらゆる文字にマッチさせることができます）。
		//
		// // ローカルリソースの参照先置き換え
		// function getBasenameOfResDir(pathResDir){
		// 	pathResDir = pathResDir.replace( new RegExp('\\/+$'), '' );
		// 	pathResDir = px.utils.basename( pathResDir );
		// 	return pathResDir;
		// }
		// var replaceStr = {
		// 	before: getBasenameOfResDir(resourceDir.from) ,
		// 	after: getBasenameOfResDir(resourceDir.to)
		// }
		// code = code.replace( new RegExp( px.utils.escapeRegExp(replaceStr.before), 'g' ), replaceStr.after );

		function replacePath( path, task, resourceDir ){
			var tmp = px.utils79.trim(path);
			if( tmp.match( new RegExp('^[a-zA-Z]+\\:') ) ){
				return path;
			}
			if( tmp.match( new RegExp('^\\/\\/') ) ){
				return path;
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

			tmp = px.path.resolve('/', px.path.dirname(task.from), mem.dirname);
			if( tmp.match( new RegExp('^'+px.utils.escapeRegExp( px.path.resolve(resourceDir.from) )) ) ){
				tmp = tmp.replace( new RegExp('^'+px.utils.escapeRegExp( px.path.resolve(resourceDir.from) )), px.path.resolve(resourceDir.to) );
			}

			if( !is.abs ){
				tmp = px.path.relative( px.path.dirname(task.to), tmp );
				if( !tmp.length ){
					tmp = '.';
				}
				if( is.dotSlashStart ){
					tmp = './'+tmp;
				}
			}
			if( is.slashClosed ){
				tmp += '/';
			}else if( mem.basename.length ){
				tmp += '/'+mem.basename;
			}

			tmp = mem.whiteSpaceBefore + tmp + mem.whiteSpaceAfter;
			return tmp;
		}// replacePath();

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



			code += memo.before + replacePath( memo.path, task, resourceDir ) + memo.after;
			continue;
		}

		return code;
	}

	/**
	 * コンテンツを移動する
	 */
	exports.moveContent = function(px, pj, task, cb){
		cb = cb||function(){};
		// var mkdirp = require('mkdirp');
		var pathBase = px.fs.realpathSync( pj.get_realpath_controot() )+'/';
		// console.log( pathBase );
		// console.log( task );


		var pageInfo = pj.site.getPageInfo( task.from );
		if( pageInfo !== null ){
			// from をpathとしてサイトマップを検索したら発見した場合

			if( pageInfo.path !== pageInfo.content ){
				// パスとコンテンツパスが一緒じゃないと移動できない。
				// おかしくなっちゃうから。
				cb( false );
				return;
			}

			// console.log( pj.findPageContent( task.from ) );
		}else{
			// from はサイトマップに登録されていないファイルだった場合
		}


		// ----------------------------------
		// 移動を実行
		// console.log( pathBase+task.from );
		// console.log( pathBase+task.to );
		px.utils.iterateFnc([
			function( it, arg ){
				px.mkdirp( px.utils.dirname(pathBase+task.to), function(){
					it.next( arg );
				} );
			} ,
			function( it, arg ){
				// コンテンツファイル本体を移動
				arg.fromList = [];
				if( px.utils.isFile( pathBase+task.from ) ){
					arg.fromList.push( task );
				}
				var conf = pj.getConfig();
				for( var idx in conf.funcs.processor ){
					if( px.utils.isFile( pathBase+task.from+'.'+idx ) ){
						arg.fromList.push( {'from':task.from+'.'+idx, 'to':task.to+'.'+idx} );
					}
				}
				var done = 0;
				for( var idx in arg.fromList ){
					px.fs.rename( pathBase+arg.fromList[idx].from, pathBase+arg.fromList[idx].to, function(){
						done ++;
						if( done >= arg.fromList.length ){
							it.next( arg );
						}
					} );
				}
			} ,
			function( it, arg ){
				// コンテンツリソースディレクトリを移動
				var dirFrom = px.utils.trim_extension( task.from )+'_files/';
				var dirTo = px.utils.trim_extension( task.to )+'_files/';
				arg.resourceDir = {
					"from": dirFrom ,
					"to": dirTo
				};
				if( !px.utils.isDirectory( pathBase+arg.resourceDir.from ) ){
					// 存在しない場合はスキップ
					it.next( arg );
					return;
				}
				px.fs.rename( pathBase+arg.resourceDir.from, pathBase+arg.resourceDir.to, function(){
					it.next( arg );
				} );
			} ,
			function( it, arg ){
				// コンテンツリソースへのリンクを置き換え
				var done = 0;
				for( var idx in arg.fromList ){
					(function( idx, fromListRow ){
						px.fs.readFile( pathBase+fromListRow.to, {}, function(err, data){
							var src = data.toString();
							src = replaceContentSrc(px, pj, src, pathBase, fromListRow, arg.resourceDir);
							if( src === data ){
								done ++;
								if( done >= arg.fromList.length ){
									it.next( arg );
								}
							}else{
								px.fs.writeFile( pathBase+fromListRow.to, src, {}, function(err){
									done ++;
									if( done >= arg.fromList.length ){
										it.next( arg );
									}
								});
							}
						});
					})( idx, arg.fromList[idx] );
				}
			} ,
			function( it, arg ){
				cb( true );
			}
		]).start({});
		return;
	}


})(window.contApp.moveCont = {});