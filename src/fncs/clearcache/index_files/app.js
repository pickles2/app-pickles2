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
