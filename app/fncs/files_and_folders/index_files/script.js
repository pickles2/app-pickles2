(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

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

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
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
window.px = window.parent.main;
window.main = window.parent.main;
window.contApp = new (function( main ){
	var _this = this;
	var _pj = main.getCurrentProject();
	var remoteFinder;
	var $elms = {};
	$elms.editor = $('<div>');
	$elms.remoteFinder = $('<div>');
	var mkfile = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/mkfile.js'))(this, main, _pj, $);
	var mkdir = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/mkdir.js'))(this, main, _pj, $);
	var open = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/open.js'))(this, main, _pj, $);
	var copy = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/copy.js'))(this, main, _pj, $);
	var rename = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/rename.js'))(this, main, _pj, $);
	var remove = new (require('../../../fncs/files_and_folders/index_files/libs.ignore/remove.js'))(this, main, _pj, $);

	/**
	 * 初期化
	 */
	$(window).on('load', function(){
		main.it79.fnc({}, [
			function(it){
				if( main.getAppearance() == 'dark' ){
					// --------------------------------------
					// ダークモードスタイルを読み込む
					var $link = document.createElement('link');
					$link.href = '../../common/remote-finder/dist/themes/darkmode.css';
					$link.rel = 'stylesheet';
					$link.className = 'px2-darkmode';
					var $head = document.querySelector('head');
					$head.appendChild($link);
				}
				it.next();
			},
			function(it){
				$elms.remoteFinder = $('#cont_finder');
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
						"mkdir": mkdir.mkdir,
						"open": open.open,
						"copy": copy.copy,
						"rename": rename.rename,
						"remove": remove.remove
					}
				);
				remoteFinder.init('/', {}, function(){
					console.log('ready.');
				});

				$(window).on('resize', function(){
					onWindowResize();
				});
				onWindowResize();

				it.next();
			},
		]);
	});

	/**
	 * エディター画面を開く
	 */
	this.openEditor = function( pagePath ){

		this.closeEditor();//一旦閉じる

		// プログレスモード表示
		main.progress.start({
			'blindness':true,
			'showProgressBar': true
		});

		var contPath = _pj.findPageContent( pagePath );
		var contRealpath = _pj.get('path')+'/'+contPath;
		var pathInfo = main.utils.parsePath(contPath);
		if( _pj.site.getPathType( pagePath ) == 'dynamic' ){
			var dynamicPathInfo = _pj.site.get_dynamic_path_info(pagePath);
			pagePath = dynamicPathInfo.path;
		}

		if( main.fs.existsSync( contRealpath ) ){
			contRealpath = main.fs.realpathSync( contRealpath );
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
	}

	/**
	 * エディター画面を閉じる
	 * 単に閉じるだけです。編集内容の保存などの処理は、editor.html 側に委ねます。
	 */
	this.closeEditor = function(){
		$elms.editor.remove();
		$('body')
			.css({'overflow':'auto'})
		;
		_pj.updateGitStatus();
		return this;
	}


	/**
	 * ファイルのパスを、Pickles 2 の外部パス(path)に変換する。
	 *
	 * Pickles 2 のパスは、 document_root と cont_root を含まないが、
	 * ファイルのパスはこれを一部含んでいる可能性がある。
	 * これを確認し、必要に応じて除いたパスを返却する。
	 */
	this.parsePx2FilePath = function( filepath, callback ){
		var pxExternalPath = filepath;
		var pageInfoAll;
		var path_type;
		var realpath_file = _pj.get('path')+'/'+filepath;
		realpath_file = normalizePath( realpath_file );
		realpath_file = require('path').resolve('/', realpath_file);
		realpath_file = normalizePath( realpath_file );
		main.it79.fnc({}, [
			function(it1){
				_pj.execPx2(
					'/?PX=px2dthelper.get.all',
					{
						complete: function(_pageInfoAll){
							try{
								_pageInfoAll = JSON.parse(_pageInfoAll);
							}catch(e){
								console.error('Failed to parse JSON "pageInfoAll".', e);
							}
							// console.log(_pageInfoAll);
							pageInfoAll = _pageInfoAll;
							it1.next();
						}
					}
				);

			},
			function(it1){
				// 外部パスを求める
				pageInfoAll.realpath_docroot = normalizePath(pageInfoAll.realpath_docroot);
				if( realpath_file.indexOf(pageInfoAll.realpath_docroot) === 0 ){
					pxExternalPath = realpath_file.replace(pageInfoAll.realpath_docroot, '/');
					pxExternalPath = pxExternalPath.split(/[\/]{1,}/).join('/');
				}else{
					pxExternalPath = false;
					it1.next();
					return;
				}
				pageInfoAll.path_controot = normalizePath(pageInfoAll.path_controot);
				if( pxExternalPath.indexOf(pageInfoAll.path_controot) === 0 ){
					pxExternalPath = pxExternalPath.replace(pageInfoAll.path_controot, '/');
					pxExternalPath = pxExternalPath.split(/[\/]{1,}/).join('/');
				}else{
					pxExternalPath = false;
					it1.next();
					return;
				}
				pxExternalPath = normalizePath(require('path').resolve('/', pxExternalPath));
				it1.next();
			},
			function(it1){
				// パスの種類を求める
				// theme_collection, home_dir, contents, or unknown
				path_type = 'unknown';
				var realpath_target = normalizePath(realpath_file);
				var realpath_homedir = normalizePath(pageInfoAll.realpath_homedir);
				var realpath_theme_collection_dir = normalizePath(pageInfoAll.realpath_theme_collection_dir);
				var realpath_docroot = normalizePath(pageInfoAll.realpath_docroot);
				if( realpath_target.indexOf(realpath_theme_collection_dir) === 0 ){
					path_type = 'theme_collection';
				}else if( realpath_target.indexOf(realpath_homedir) === 0 ){
					path_type = 'home_dir';
				}else if( realpath_target.indexOf(realpath_docroot) === 0 && pxExternalPath ){
					path_type = 'contents';
				}
				it1.next();
			},
			function(it1){
				callback(pxExternalPath, path_type);
				it1.next();
			}
		]);
		return;
	}

	/**
	 * Windows風絶対パスをLinux風絶対パスに変換
	 */
	function normalizePath(path){
		path = path.replace(/^[a-zA-Z]\:/, '');
		path = require('path').resolve(path);
		path = path.split(/[\/\\\\]+/).join('/');
		return path;
	}

	/**
	 * ウィンドウリサイズイベントハンドラ
	 */
	function onWindowResize(){
		$elms.editor
			.css({
				'height': $(window).innerHeight() - 0
			})
		;
		$elms.remoteFinder
			.css({
				'height': $(window).innerHeight() - $('.container').eq(0).innerHeight() - 10
			})
		;
	}

})( window.parent.main );

},{"../../../fncs/files_and_folders/index_files/libs.ignore/copy.js":4,"../../../fncs/files_and_folders/index_files/libs.ignore/mkdir.js":5,"../../../fncs/files_and_folders/index_files/libs.ignore/mkfile.js":6,"../../../fncs/files_and_folders/index_files/libs.ignore/open.js":7,"../../../fncs/files_and_folders/index_files/libs.ignore/remove.js":8,"../../../fncs/files_and_folders/index_files/libs.ignore/rename.js":9,"path":1}],4:[function(require,module,exports){
/**
 * Files and Folders: copy.js
 */
module.exports = function(contApp, px, _pj, $){
	this.copy = function(copyFrom, callback){
		var is_file;
		var pageInfoAll;
		var pxExternalPathFrom;
		var pxExternalPathTo;
		var pathTypeFrom;
		var pathTypeTo;
		px.it79.fnc({}, [
			function(it1){
				contApp.parsePx2FilePath(copyFrom, function(_pxExternalPath, _pathType){
					pxExternalPathFrom = _pxExternalPath;
					pathTypeFrom = _pathType;
					it1.next();
				});
			},
			function(it1){
				is_file = px.utils79.is_file( _pj.get('path')+copyFrom );
				it1.next();
			},
			function(it1){
				if(!is_file || pxExternalPathFrom === false){
					it1.next();
					return;
				}
				_pj.execPx2(
					pxExternalPathFrom+'?PX=px2dthelper.get.all',
					{
						complete: function(resources){
							try{
								resources = JSON.parse(resources);
							}catch(e){
								console.error('Failed to parse JSON "pageInfoAll".', e);
							}
							// console.log(resources);
							pageInfoAll = resources;
							it1.next();
						}
					}
				);

			},
			function(it1){
				var $body = $('<div>').html( $('#template-copy').html() );
				$body.find('.cont_target_item').text(copyFrom);
				$body.find('[name=copy_to]').val(copyFrom);
				if(pathTypeFrom == 'contents' && is_file){
					$body.find('.cont_contents_option').show();
				}
				px2style.modal({
					'title': 'Copy',
					'body': $body,
					'buttons': [
						$('<button type="button" class="px2-btn">')
							.text('Cancel')
							.on('click', function(e){
								px2style.closeModal();
							}),
						$('<button class="px2-btn px2-btn--primary">')
							.text('複製する')
					],
					'form': {
						'submit': function(){
							px2style.closeModal();
							var copyTo = $body.find('[name=copy_to]').val();
							if( !copyTo ){ return; }
							if( copyTo == copyFrom ){ return; }

							px.it79.fnc({}, [
								function(it1){
									contApp.parsePx2FilePath(copyTo, function(_pxExternalPath, _pathType){
										pxExternalPathTo = _pxExternalPath;
										pathTypeTo = _pathType;
										it1.next();
									});
								},
								function(it2){
									if( pathTypeFrom == 'contents' && pathTypeTo == 'contents' && pxExternalPathFrom && pxExternalPathTo && is_file && $body.find('[name=is_copy_files_too]:checked').val() ){
										// --------------------------------------
										// リソースも一緒に複製する
										_pj.execPx2(
											pxExternalPathTo+'?PX=px2dthelper.get.all',
											{
												complete: function(pageInfoAllTo){
													try{
														pageInfoAllTo = JSON.parse(pageInfoAllTo);
													}catch(e){
														console.error('Failed to parse JSON "pageInfoAll".', e);
													}
													// console.log(pageInfoAllTo);

													var realpath_files_from = pageInfoAll.realpath_files;
													var realpath_files_to = pageInfoAllTo.realpath_files;
													if(px.utils79.is_dir(realpath_files_from)){
														px.fsEx.copySync( realpath_files_from, realpath_files_to );
													}
													it2.next();
												}
											}
										);
										return;
									}
									it2.next();
								},
								function(it2){
									callback(copyFrom, copyTo);
									it2.next();
								}
							]);

						}
					},
					'width': 460
				}, function(){
					$body.find('[name=copy_to]').focus();
				});
				it1.next();
			}
		]);
	}
}

},{}],5:[function(require,module,exports){
/**
 * Files and Folders: mkdir.js
 */
module.exports = function(contApp, px, _pj, $){
	this.mkdir = function(current_dir, callback){
		var $body = $('<div>').html( $('#template-mkdir').html() );
		$body.find('.cont_current_dir').text(current_dir);
		$body.find('[name=dirname]').on('change keyup', function(){
			var dirname = $body.find('[name=dirname]').val();
			if( dirname.match(/\.html?$/i) ){
				$body.find('.cont_html_ext_option').show();
			}else{
				$body.find('.cont_html_ext_option').hide();
			}
		});
		px2style.modal({
			'title': 'Create new Directory',
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
					var dirname = $body.find('[name=dirname]').val();
					if( !dirname ){ return; }

					callback( dirname );
				}
			},
			'width': 460
		}, function(){
			$body.find('[name=dirname]').focus();
		});
	}
}

},{}],6:[function(require,module,exports){
/**
 * Files and Folders: mkfile.js
 */
module.exports = function(contApp, main, _pj, $){
	this.mkfile = function(current_dir, callback){

		var pxExternalPath_before;
		var pathType_before;
		var pxExternalPath;
		var pathType;

		main.it79.fnc({}, [
			function(it1){
				contApp.parsePx2FilePath(current_dir+'___before.html', function(_pxExternalPath, _pathType){
					// コンテンツディレクトリ内か否かを判定するため、
					// 先んじてダミーのファイル名で属性を調査しておく。
					pxExternalPath_before = _pxExternalPath;
					pathType_before = _pathType;
					it1.next();
				});
			},
			function(it1){
				var $body = $('<div>').html( $('#template-mkfile').html() );
				$body.find('.cont_current_dir').text(current_dir);
				$body.find('[name=filename]').on('change keyup', function(){
					var filename = $body.find('[name=filename]').val();
					if( pxExternalPath_before && pathType_before == 'contents' && filename.match(/\.html?$/i) ){
						$body.find('.cont_html_ext_option').show();
					}else{
						$body.find('.cont_html_ext_option').hide();
					}
				});
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

							main.it79.fnc({}, [
								function(it2){
									contApp.parsePx2FilePath(current_dir+filename, function(_pxExternalPath, _pathType){
										// console.log(_pxExternalPath, _pathType);
										pxExternalPath = _pxExternalPath;
										pathType = _pathType;
										it2.next();
									});
								},
								function(it2){
									if( !pxExternalPath ){
										it2.next();
										return;
									}
									_pj.execPx2(
										pxExternalPath+'?PX=px2dthelper.get.all',
										{
											complete: function(resources){
												try{
													resources = JSON.parse(resources);
												}catch(e){
													console.error('Failed to parse JSON "pageInfoAll".', e);
												}
												pageInfoAll = resources;
												it2.next();
											}
										}
									);

								},
								function(it2){
									if( pathType == 'contents' && filename.match(/\.html?$/i) && $body.find('[name=is_guieditor]:checked').val() ){
										// --------------------------------------
										// GUI編集モードが有効
										var realpath_data_dir = pageInfoAll.realpath_data_dir;
										main.fsEx.mkdirpSync( realpath_data_dir );
										main.fs.writeFileSync( realpath_data_dir+'data.json', '{}' );
									}
									it2.next();
								},
								function(it2){
									callback( filename );
									it2.next();
								}
							]);

						}
					},
					'width': 460
				}, function(){
					$body.find('[name=filename]').focus();
				});
			}
		]);
	}
}

},{}],7:[function(require,module,exports){
/**
 * Files and Folders: open.js
 */
module.exports = function(contApp, px, _pj, $){

	/**
	 * ファイルを開く
	 */
	this.open = function(fileinfo, callback){
		// console.log(fileinfo);
		var realpath = _pj.get('path')+'/'+fileinfo.path;

		switch( fileinfo.ext ){
			case 'html':
			case 'htm':
			case 'md':
				px.preview.serverStandby( function(result){
					contApp.parsePx2FilePath(fileinfo.path, function(pxExternalPath, pathType){
						if(pxExternalPath && pathType == 'contents'){
							if( pxExternalPath.match(/\.html?\.[a-zA-Z0-9\_\-]+$/) ){
								pxExternalPath = pxExternalPath.replace(/\.[a-zA-Z0-9\_\-]+$/, '');
							}
							contApp.openEditor( pxExternalPath );
						}else{
							px.openInTextEditor( realpath );
						}
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

}

},{}],8:[function(require,module,exports){
/**
 * Files and Folders: remove.js
 */
module.exports = function(contApp, main, _pj, $){
	this.remove = function(target_item, callback){
		var is_file;
		var pageInfoAll;
		var pxExternalPath;
		var pathType;
		main.it79.fnc({}, [
			function(it1){
				contApp.parsePx2FilePath(target_item, function(_pxExternalPath, _pathType){
					pxExternalPath = _pxExternalPath;
					pathType = _pathType;
					it1.next();
				});
			},
			function(it1){
				is_file = main.utils79.is_file( _pj.get('path')+target_item );
				it1.next();
			},
			function(it1){
				if(!is_file || pxExternalPath === false || pathType !== 'contents'){
					it1.next();
					return;
				}
				_pj.execPx2(
					pxExternalPath+'?PX=px2dthelper.get.all',
					{
						complete: function(resources){
							try{
								resources = JSON.parse(resources);
							}catch(e){
								console.error('Failed to parse JSON "pageInfoAll".', e);
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
				if(is_file && pathType == 'contents'){
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

							main.it79.fnc({}, [
								function(it2){
									if( is_file && pxExternalPath && pathType == 'contents' && $body.find('[name=is_remove_files_too]:checked').val() ){
										// --------------------------------------
										// リソースも一緒に削除する
										var realpath_files = pageInfoAll.realpath_files;
										if(main.utils79.is_dir(realpath_files)){
											main.fsEx.removeSync( realpath_files );
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

},{}],9:[function(require,module,exports){
/**
 * Files and Folders: rename.js
 */
module.exports = function(contApp, px, _pj, $){
	this.rename = function(renameFrom, callback){
		var is_file;
		var pageInfoAllFrom;
		var pxExternalPathFrom;
		var pxExternalPathTo;
		var pathTypeFrom;
		var pathTypeTo;
		px.it79.fnc({}, [
			function(it1){
				contApp.parsePx2FilePath(renameFrom, function(_pxExternalPath, _pathType){
					pxExternalPathFrom = _pxExternalPath;
					pathTypeFrom = _pathType;
					it1.next();
				});
			},
			function(it1){
				is_file = px.utils79.is_file( _pj.get('path')+renameFrom );
				it1.next();
			},
			function(it1){
				if(!is_file || pxExternalPathFrom === false){
					it1.next();
					return;
				}
				_pj.execPx2(
					pxExternalPathFrom+'?PX=px2dthelper.get.all',
					{
						complete: function(resources){
							try{
								resources = JSON.parse(resources);
							}catch(e){
								console.error('Failed to parse JSON "pageInfoAll".', e);
							}
							console.log(resources);
							pageInfoAllFrom = resources;
							it1.next();
						}
					}
				);

			},
			function(it1){
				var $body = $('<div>').html( $('#template-rename').html() );
				$body.find('.cont_target_item').text(renameFrom);
				$body.find('[name=rename_to]').val(renameFrom);
				if(pathTypeFrom == 'contents' && is_file){
					$body.find('.cont_contents_option').show();
				}
				px2style.modal({
					'title': 'Rename',
					'body': $body,
					'buttons': [
						$('<button type="button" class="px2-btn">')
							.text('Cancel')
							.on('click', function(e){
								px2style.closeModal();
							}),
						$('<button class="px2-btn px2-btn--primary">')
							.text('移動する')
					],
					'form': {
						'submit': function(){
							px2style.closeModal();
							var renameTo = $body.find('[name=rename_to]').val();
							if( !renameTo ){ return; }
							if( renameTo == renameFrom ){ return; }

							px.it79.fnc({}, [
								function(it1){
									contApp.parsePx2FilePath(renameTo, function(_pxExternalPath, _pathType){
										pxExternalPathTo = _pxExternalPath;
										pathTypeTo = _pathType;
										it1.next();
									});
								},
								function(it2){
									if( pathTypeFrom == 'contents' && pathTypeTo == 'contents' && pxExternalPathFrom && pxExternalPathTo && is_file && $body.find('[name=is_rename_files_too]:checked').val() ){
										// --------------------------------------
										// リソースも一緒に移動する
										_pj.execPx2(
											pxExternalPathTo+'?PX=px2dthelper.get.all',
											{
												complete: function(pageInfoAllTo){
													try{
														pageInfoAllTo = JSON.parse(pageInfoAllTo);
													}catch(e){
														console.error('Failed to parse JSON "pageInfoAll".', e);
													}
													// console.log(pageInfoAllTo);

													var realpath_files_from = pageInfoAllFrom.realpath_files;
													var realpath_files_to = pageInfoAllTo.realpath_files;
													if(px.utils79.is_dir(realpath_files_from)){
														px.fsEx.renameSync( realpath_files_from, realpath_files_to );
													}
													it2.next();
												}
											}
										);
										return;
									}
									it2.next();
								},
								function(it2){
									callback(renameFrom, renameTo);
									it2.next();
								}
							]);

						}
					},
					'width': 460
				}, function(){
					$body.find('[name=rename_to]').focus();
				});
				it1.next();
			}
		]);
	}
}

},{}]},{},[3])