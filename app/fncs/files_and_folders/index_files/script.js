(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("r7L21G"))
},{"r7L21G":2}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
window.px = window.parent.px;
window.contApp = new (function( px ){
	var _this = this;
	var _pj = px.getCurrentProject();
	var remoteFinder;
	var $elms = {};
	$elms.editor = $('<div>');
	var mkfile = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/mkfile.js'))(this, px, _pj, $);
	var open = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/open.js'))(this, px, _pj, $);
	var remove = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/remove.js'))(this, px, _pj, $);

	/**
	 * 初期化
	 */
	$(window).on('load', function(){
		remoteFinder = new RemoteFinder(
			document.getElementById('cont_finder'),
			{
				"gpiBridge": function(input, callback){
					// console.log(input);
					_pj.remoteFinder.gpi(input, function(result){
						callback(result);
					});
				},
				"mkfile": mkfile.mkfile,
				"open": open.open,
				"remove": remove.remove
			}
		);
		// console.log(remoteFinder);
		remoteFinder.init('/', {}, function(){
			console.log('ready.');
		});

		$(window).on('resize', function(){
			onWindowResize();
		});
	});

	/**
	 * エディター画面を開く
	 */
	this.openEditor = function( pagePath ){

		this.closeEditor();//一旦閉じる

		// プログレスモード表示
		px.progress.start({
			'blindness':true,
			'showProgressBar': true
		});

		var contPath = _pj.findPageContent( pagePath );
		var contRealpath = _pj.get('path')+'/'+contPath;
		var pathInfo = px.utils.parsePath(contPath);
		if( _pj.site.getPathType( pagePath ) == 'dynamic' ){
			var dynamicPathInfo = _pj.site.get_dynamic_path_info(pagePath);
			pagePath = dynamicPathInfo.path;
		}

		if( px.fs.existsSync( contRealpath ) ){
			contRealpath = px.fs.realpathSync( contRealpath );
		}

		$elms.editor = $('<div>')
			.css({
				'position':'fixed',
				'top':0,
				'left':0 ,
				'z-index': '1000',
				'width':'100%',
				'height':$(window).height()
			})
			.append(
				$('<iframe>')
					//↓エディタ自体は別のHTMLで実装
					.attr( 'src', '../../mods/editor/index.html'
						+'?page_path='+encodeURIComponent( pagePath )
					)
					.css({
						'border':'0px none',
						'width':'100%',
						'height':'100%'
					})
			)
			.append(
				$('<a>')
					.html('&times;')
					.attr('href', 'javascript:;')
					.on('click', function(){
						// if(!confirm('編集中の内容は破棄されます。エディタを閉じますか？')){ return false; }
						_this.closeEditor();
					} )
					.css({
						'position':'absolute',
						'bottom':5,
						'right':5,
						'font-size':'18px',
						'color':'#333',
						'background-color':'#eee',
						'border-radius':'0.5em',
						'border':'1px solid #333',
						'text-align':'center',
						'opacity':0.4,
						'width':'1.5em',
						'height':'1.5em',
						'text-decoration': 'none'
					})
					.hover(function(){
						$(this).animate({
							'opacity':1
						});
					}, function(){
						$(this).animate({
							'opacity':0.4
						});
					})
			)
		;
		$('body')
			.append($elms.editor)
			.css({'overflow':'hidden'})
		;

		return this;
	} // openEditor()

	/**
	 * エディター画面を閉じる
	 * 単に閉じるだけです。編集内容の保存などの処理は、editor.html 側に委ねます。
	 */
	this.closeEditor = function(){
		$elms.editor.remove();
		$('body')
			.css({'overflow':'auto'})
		;
		return this;
	} // closeEditor()

	/**
	 * ウィンドウリサイズイベントハンドラ
	 */
	function onWindowResize(){
		$elms.editor
			.css({
				'height': $(window).innerHeight() - 0
			})
		;
	}

})( window.parent.px );

},{"../../../fncs/files_and_folders/index_files/libs.ignore/mkfile.js":4,"../../../fncs/files_and_folders/index_files/libs.ignore/open.js":5,"../../../fncs/files_and_folders/index_files/libs.ignore/remove.js":6}],4:[function(require,module,exports){
/**
 * Files and Folders: mkfile.js
 */
module.exports = function(contApp, px, _pj, $){
	this.mkfile = function(current_dir, callback){
		var $body = $('<div>').html( $('#template-mkfile').html() );
		$body.find('.cont_current_dir').text(current_dir);
		$body.find('[name=filename]').on('change keyup', function(){
			var filename = $body.find('[name=filename]').val();
			if( filename.match(/\.html?$/i) ){
				$body.find('.cont_html_ext_option').show();
			}else{
				$body.find('.cont_html_ext_option').hide();
			}
		})
		px2style.modal({
			'title': 'Create new File',
			'body': $body,
			'buttons': [
				$('<button type="button" class="px2-btn">')
					.text('Cancel')
					.on('click', function(e){
						px2style.closeModal();
					}),
				$('<button class="px2-btn px2-btn--primary">')
					.text('OK')
			],
			'form': {
				'submit': function(){
					px2style.closeModal();
					var filename = $body.find('[name=filename]').val();
					if( !filename ){ return; }
					var pageInfoAll;

					px.it79.fnc({}, [
						function(it1){
							_pj.execPx2(
								current_dir+filename+'?PX=px2dthelper.get.all',
								{
									complete: function(resources){
										try{
											resources = JSON.parse(resources);
										}catch(e){
											console.error('Failed to parse JSON "client_resources".', e);
										}
										// console.log(resources);
										pageInfoAll = resources;
										it1.next();
									}
								}
							);

						},
						function(it1){
							if( filename.match(/\.html?$/i) && $body.find('[name=is_guieditor]:checked').val() ){
								// GUI編集モードが有効
								var realpath_data_dir = pageInfoAll.realpath_data_dir;
								px.fsEx.mkdirpSync( realpath_data_dir );
								px.fs.writeFileSync( realpath_data_dir+'data.json', '{}' );
							}
							it1.next();
						},
						function(it1){
							callback( filename );
							it1.next();
						}
					]);

				}
			},
			'width': 460
		}, function(){
			$body.find('[name=filename]').focus();
		});
	}
}

},{}],5:[function(require,module,exports){
/**
 * Files and Folders: open.js
 */
module.exports = function(contApp, px, _pj, $){

	/**
	 * ファイルを開く
	 */
	this.open = function(fileinfo, callback){
		// console.log(fileinfo);
		var realpath = require('path').resolve(_pj.get('path'), './'+fileinfo.path);

		switch( fileinfo.ext ){
			case 'html':
			case 'htm':
				px.preview.serverStandby( function(result){
					filePath2pxExternalPath(fileinfo.path, function(path){
						contApp.openEditor( path );
					});
				} );
				break;
			case 'xlsx':
			case 'csv':
				px.utils.openURL( realpath );
				break;
			case 'php':
			case 'inc':
			case 'txt':
			case 'md':
			case 'css':
			case 'scss':
			case 'js':
			case 'json':
			case 'lock':
			case 'gitignore':
			case 'gitkeep':
			case 'htaccess':
			case 'htpasswd':
				px.openInTextEditor( realpath );
				break;
			default:
				px.utils.openURL( realpath );
				break;
		}
		callback(true);
	}


	/**
	 * ファイルのパスを、Pickles 2 の外部パス(path)に変換する。
	 *
	 * Pickles 2 のパスは、 document_root と cont_root を含まないが、
	 * ファイルのパスはこれを一部含んでいる可能性がある。
	 * これを確認し、必要に応じて除いたパスを返却する。
	 */
	function filePath2pxExternalPath( filepath, callback ){
		var pxExternalPath = filepath;
		var is_file;
		var pageInfoAll;
		var realpath_file = require('path').resolve(_pj.get('path'), './'+filepath);
		px.it79.fnc({}, [
			function(it1){
				is_file = px.utils79.is_file( realpath_file );
				it1.next();
			},
			function(it1){
				if(!is_file){
					it1.next();
					return;
				}
				_pj.execPx2(
					'/?PX=px2dthelper.get.all',
					{
						complete: function(resources){
							try{
								resources = JSON.parse(resources);
							}catch(e){
								console.error('Failed to parse JSON "client_resources".', e);
							}
							// console.log(resources);
							pageInfoAll = resources;
							it1.next();
						}
					}
				);

			},
			function(it1){
				if( realpath_file.indexOf(pageInfoAll.realpath_docroot) === 0 ){
					pxExternalPath = realpath_file.replace(pageInfoAll.realpath_docroot, '/');
				}
				if( pxExternalPath.indexOf(pageInfoAll.path_controot) === 0 ){
					pxExternalPath = pxExternalPath.replace(pageInfoAll.path_controot, '/');
				}
				pxExternalPath = require('path').resolve('/', pxExternalPath);
				it1.next();
			},
			function(it1){
				callback(pxExternalPath);
				it1.next();
			}
		]);
		return;
	}

}

},{"path":1}],6:[function(require,module,exports){
/**
 * Files and Folders: remove.js
 */
module.exports = function(contApp, px, _pj, $){
	this.remove = function(target_item, callback){
		var is_file;
		var pageInfoAll;
		px.it79.fnc({}, [
			function(it1){
				is_file = px.utils79.is_file( _pj.get('path')+target_item );
				it1.next();
			},
			function(it1){
				if(!is_file){
					it1.next();
					return;
				}
				_pj.execPx2(
					target_item+'?PX=px2dthelper.get.all',
					{
						complete: function(resources){
							try{
								resources = JSON.parse(resources);
							}catch(e){
								console.error('Failed to parse JSON "client_resources".', e);
							}
							console.log(resources);
							pageInfoAll = resources;
							it1.next();
						}
					}
				);

			},
			function(it1){
				var $body = $('<div>').html( $('#template-remove').html() );
				$body.find('.cont_target_item').text(target_item);
				if(is_file){
					$body.find('.cont_contents_option').show();
				}
				px2style.modal({
					'title': 'Remove',
					'body': $body,
					'buttons': [
						$('<button type="button" class="px2-btn">')
							.text('Cancel')
							.on('click', function(e){
								px2style.closeModal();
							}),
						$('<button class="px2-btn px2-btn--danger">')
							.text('削除する')
					],
					'form': {
						'submit': function(){
							px2style.closeModal();

							px.it79.fnc({}, [
								function(it2){
									if( is_file && $body.find('[name=is_remove_files_too]:checked').val() ){
										// リソースも一緒に削除する
										var realpath_files = pageInfoAll.realpath_files;
										if(px.utils79.is_dir(realpath_files)){
											px.fsEx.removeSync( realpath_files );
										}
									}
									it2.next();
								},
								function(it2){
									callback();
									it2.next();
								}
							]);

						}
					},
					'width': 460
				}, function(){
				});
				it1.next();
			}
		]);
	}
}

},{}]},{},[3])