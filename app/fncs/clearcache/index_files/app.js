(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.px = window.parent.main;
window.main = window.parent.main;

window.cont_clearcache = function(btn){
	$(btn).attr('disabled', 'disabled');
	var pj = main.getCurrentProject();
	$('.cont_console').text('');
	var $msg = $('<div>');

	main.commandQueue.addQueuePxCmdItem(
		'/?PX=clearcache',
		{
			'cdName': 'default',
			'tags': [
				'pj-'+pj.get('id'),
				'pickles2-clearcache'
			],
			'accept': function(queueId){
				// console.log(queueId);
			},
			'open': function(message){
			},
			'stdout': function(message){
				$('.cont_console').text(
					$('.cont_console').text() + message.data.join('')
				);
			},
			'stderr': function(message){
				$('.cont_console').text(
					$('.cont_console').text() + message.data.join('')
				);
			},
			'close': function(message){
				$(btn).removeAttr('disabled');
				main.message( 'キャッシュをクリアしました。' );
				return;
			}
		}
	);
}

},{}]},{},[1])