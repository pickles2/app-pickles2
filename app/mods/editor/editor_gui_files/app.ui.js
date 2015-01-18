window.contApp.ui = new(function(px, contApp){
	var _this = this;
	var $preview;
	var $previewDoc;
	var $ctrlPanel;
	var $palette;
	var $editWindow;

	var dataViewTree = {};

	/**
	 * フィールド初期化
	 */
	this.initField = function( cb ){
		$preview = $('iframe.cont_field-preview');
		$previewDoc = $($preview[0].contentWindow.document);
		$ctrlPanel = $('.cont_field-ctrlpanel');
		$palette = $('.cont_modulelist');

		// モジュールパレットの初期化
		$palette
			.html('')
			.append('<ul>')
		;
		var li = d3.select('.cont_modulelist ul').selectAll('li');
		var modTpls = (function( tmpModTpls ){
			var rtn = [];
			for( var i in tmpModTpls ){
				if( contApp.moduleTemplates.isSystemMod( tmpModTpls[i].id ) ){
					// システムテンプレートを除外
					continue;
				}
				rtn.push( tmpModTpls[i] );
			}
			return rtn;
		})( contApp.moduleTemplates.getAll() );

		var update = li.data( modTpls );
		update
			.text(function(d, i){
				return d.id;
			})
			.attr({'data-id': function(d, i){ return d.id }})
			.attr({'draggable': true})//←HTML5のAPI http://www.htmq.com/dnd/
			.style({'color':'inherit'})
			.on('dragstart', function(){
				// px.message( $(this).data('id') );
				event.dataTransfer.setData('method', 'add' );
				event.dataTransfer.setData('modId', $(this).data('id') );
			})
		;
		update.enter()
			.append('li')
			.append('button')
			.text(function(d, i){
				return d.id;
			})
			.style({'color':'inherit'})
			.attr({'data-id': function(d, i){ return d.id }})
			.attr({'draggable': true})//←HTML5のAPI http://www.htmq.com/dnd/
			.on('dragstart', function(){
				// px.message( $(this).data('id') );
				event.dataTransfer.setData('method', 'add' );
				event.dataTransfer.setData('modId', $(this).data('id') );
			})
		;
		update.exit()
			.remove()//消すときはこれ。
		;

		$preview
			.bind('load', function(){
				_this.onPreviewLoad();
			})
		;

		cb();
	} // initField()

	/**
	 * プレビュー画面(=GUI編集画面)を表示
	 */
	this.preview = function( path ){

		// 編集フィールドの初期化
		$ctrlPanel.html('');

		$preview
			.attr('src', px.preview.getUrl(path) )
		;
		return true;
	} // preview()

	/**
	 * プレビューのロード完了イベント
	 * contApp.contentsSourceData のデータをもとに、コンテンツと編集ツール描画のリセットも行います。
	 */
	this.onPreviewLoad = function(){
		// alert('onPreviewLoad');
		if( !$preview || !$preview[0] || !$preview[0].contentWindow ){
			return;
		}

		$previewDoc = $($preview[0].contentWindow.document);

		this.resizeEvent();
		return;
	}

	/**
	 * コンテンツデータに対応するUIのひな形
	 */
	function classUiUnit( instancePath, data ){
		instancePath = instancePath.replace( new RegExp('^\\/*'), '/' );
		this.instancePath = instancePath;
		this.moduleTemplates = contApp.moduleTemplates.get( data.modId, data.subModName );
		if( this.moduleTemplates === false ){
			this.moduleTemplates = contApp.moduleTemplates.get( '_sys/unknown' );
		}
		this.fieldList = _.keys( this.moduleTemplates.fields );

		this.fields = {};
		for( var idx in this.fieldList ){
			var fieldName = this.fieldList[idx];
			if( this.moduleTemplates.fields[fieldName].fieldType == 'input' ){
				this.fields[fieldName] = data.fields[fieldName];
			}else if( this.moduleTemplates.fields[fieldName].fieldType == 'module' ){
				this.fields[fieldName] = [];
				for( var idx2 in data.fields[fieldName] ){
					this.fields[fieldName][idx2] = new classUiUnit(
						instancePath+'/fields.'+fieldName+'@'+idx2,
						data.fields[fieldName][idx2]
					);
				}
			}else if( this.moduleTemplates.fields[fieldName].fieldType == 'loop' ){
				this.fields[fieldName] = [];
				for( var idx2 in data.fields[fieldName] ){
					this.fields[fieldName][idx2] = new classUiUnit(
						instancePath+'/fields.'+fieldName+'@'+idx2,
						data.fields[fieldName][idx2]
					);
				}
			}
		}

		/**
		 * UI/出力時のHTMLコードを生成する
		 */
		this.bind = function( mode ){
			mode = mode||"finalize";
			// mode =
			//    canvas (編集用レイアウト)
			//    finalize (デフォルト/最終書き出し)

			var fieldData = {};
			for( var idx in this.fieldList ){
				var fieldName = this.fieldList[idx];
				if( this.moduleTemplates.fields[fieldName].fieldType == 'input' ){
					if( contApp.fieldDefinitions[this.moduleTemplates.fields[fieldName].type] ){
						fieldData[fieldName] = contApp.fieldDefinitions[this.moduleTemplates.fields[fieldName].type].normalizeData( this.fields[fieldName], mode );
					}else{
						fieldData[fieldName] = contApp.fieldBase.normalizeData( this.fields[fieldName], mode );
					}
				}else if( this.moduleTemplates.fields[fieldName].fieldType == 'module' ){
					fieldData[fieldName] = (function( fieldData, mode, opt ){
						var rtn = [];
						for( var idx2 in fieldData ){
							rtn[idx2] = fieldData[idx2].bind( mode );
						}
						if( mode == 'canvas' ){
							var instancePathNext = opt.instancePath+'/fields.'+opt.fieldName+'@'+( fieldData.length );
							rtn.push( $('<div>')
								.attr( "data-guieditor-cont-data-path", instancePathNext )
								.append( $('<div>')
									.text(
										// instancePathNext +
										'ここに新しいモジュールをドラッグしてください。'
									)
									.css({
										'overflow':'hidden',
										"padding": 15,
										"background-color":"#eef",
										"border-radius":5,
										"font-size":9,
										'text-align':'center',
										'box-sizing': 'content-box'
									})
								)
								.css({
									"padding":'5px 0'
								})
								.get(0).outerHTML
							);
						}
						return rtn;
					})( this.fields[fieldName], mode, {
						"instancePath": this.instancePath ,
						"fieldName": fieldName
					} );
				}else if( this.moduleTemplates.fields[fieldName].fieldType == 'loop' ){
					fieldData[fieldName] = [];
					for( var idx2 in this.fields[fieldName] ){
						fieldData[fieldName][idx2] = this.fields[fieldName][idx2].bind( mode );
					}

					if( mode == 'canvas' ){
						var instancePathNext = this.instancePath+'/fields.'+fieldName+'@'+( this.fields[fieldName].length );
						fieldData[fieldName].push( $('<div>')
							.attr( "data-guieditor-cont-data-path", instancePathNext )
							.append( $('<div>')
								.text(
									// instancePathNext +
									'ここをダブルクリックして配列要素を追加してください。'
								)
								.css({
									'overflow':'hidden',
									"padding": '5px 15px',
									"background-color":"#dfe",
									"border-radius":5,
									"font-size":9,
									'text-align':'center',
									'box-sizing': 'content-box'
								})
							)
							.css({
								"padding":'5px 0'
							})
							.get(0).outerHTML
						);
					}
				}
			}

			var tmpSrc = this.moduleTemplates.bind( fieldData, mode );
			var rtn = $('<div>');

			var isRootElement = (function(tplSrc){
				tplSrc = JSON.parse( JSON.stringify(tplSrc) );
				tplSrc = tplSrc.replace( new RegExp('\\<\\!\\-\\-.*?\\-\\-\\>','g'), '' );
				tplSrc = tplSrc.replace( new RegExp('\\{\\&.*?\\&\\}','g'), '' );
				tplSrc = tplSrc.replace( new RegExp('\r\n|\r|\n','g'), '' );
				tplSrc = tplSrc.replace( new RegExp('\t','g'), '' );
				tplSrc = tplSrc.replace( new RegExp('^[\s\r\n]*'), '' );
				tplSrc = tplSrc.replace( new RegExp('[\s\r\n]*$'), '' );
				if( tplSrc.length && tplSrc.indexOf('<') === 0 && tplSrc.match(new RegExp('\\>$')) ){
					var $jq = $(tplSrc);
					if( $jq.size() ){
						return true;
					}
				}
				return false;
			})(this.moduleTemplates.template);

			if( mode == 'finalize' ){
				rtn = $('<div>');
				rtn.append( tmpSrc );
				rtn = rtn.get(0).innerHTML;
			}else{
				rtn = $('<div>');
				rtn.append( tmpSrc );
				if( isRootElement ){
					rtn = $(tmpSrc);
				}
				// if( rtn.size() == 1 ){
				// 	// 要素がいっこだったら、追加した<div>ではなくて、
				// 	// 最初の要素にマークできるのではないか？
				// 	// と思ったけど未完成。
				// 	rtn = rtn.eq(0);
				// }
				rtn
					.attr("data-guieditor-cont-data-path", this.instancePath)
					.css({
						// 'border':'1px solid #f00',
						'margin-top':5,
						'margin-bottom':5
					})
				;
				rtn = rtn.get(0).outerHTML;
			}
			return rtn;
		} // this.bind();

		/**
		 * コントロールパネルを描画する
		 */
		this.drawCtrlPanels = function( $content ){
			var $elm = $content.find('[data-guieditor-cont-data-path='+JSON.stringify(this.instancePath)+']');
			var $ctrlElm = $('<div>')
				.css({
					'border':'0px dotted #99d',
					'text-align':'center',
					'background-color': 'transparent',
					'display':'block',
					'position':'absolute',
					"z-index":0,
					'width': $elm.width(),
					'height': $elm.height()
				})
				.width($elm.width())
				.height($elm.height())
				.offset($elm.offset())
				.attr({
					'data-guieditor-cont-data-path': this.instancePath ,
					'data-guieditor-sub-mod-name': this.moduleTemplates.subModName
				})
				.bind('mouseover', function(e){
					$(this).css({
						"border":"3px dotted #000"
					});
				})
				.bind('mouseout', function(e){
					$(this).css({
						"border":"0px dotted #99d"
					});
				})
				.attr({'draggable': true})//←HTML5のAPI http://www.htmq.com/dnd/
				.on('dragstart', function(){
					event.dataTransfer.setData("method", 'moveTo' );
					event.dataTransfer.setData("data-guieditor-cont-data-path", $(this).attr('data-guieditor-cont-data-path') );
					var subModName = $(this).attr('data-guieditor-sub-mod-name');
					if( typeof(subModName) === typeof('') && subModName.length ){
						event.dataTransfer.setData("data-guieditor-sub-mod-name", subModName );
					}
				})
				.bind('drop', function(){
					var method = event.dataTransfer.getData("method");
					var modId = event.dataTransfer.getData("modId");
					var moveFrom = event.dataTransfer.getData("data-guieditor-cont-data-path");
					var moveTo = $(this).attr('data-guieditor-cont-data-path');
					var subModNameTo = $(this).attr('data-guieditor-sub-mod-name');
					var subModNameFrom = event.dataTransfer.getData('data-guieditor-sub-mod-name');

					// px.message( 'modId "'+modId+'" が "'+method+'" のためにドロップされました。' );
					if( method == 'add' ){
						if( typeof(subModNameTo) === typeof('') ){
							px.message('ここにモジュールを追加することはできません。');
							return;
						}
						contApp.contentsSourceData.addInstance( modId, moveTo, function(){
							// px.message('インスタンスを追加しました。');
							contApp.ui.resizeEvent();
						} );
					}else if( method == 'moveTo' ){
						function isSubMod( subModName ){
							if( typeof(subModName) === typeof('') && subModName.length ){
								return true;
							}
							return false;
						}
						function removeNum(str){
							return str.replace(new RegExp('[0-9]+$'),'');
						}
						if( (isSubMod(subModNameFrom) || isSubMod(subModNameTo)) && removeNum(moveFrom) !== removeNum(moveTo) ){
							px.message('並べ替え以外の移動操作はできません。');
							return;
						}
						contApp.contentsSourceData.moveInstanceTo( moveFrom, moveTo, function(){
							// px.message('インスタンスを移動しました。');
							contApp.ui.resizeEvent();
						} );
					}
				})
				.bind('dragenter', function(e){
					$(this).css({
						"border-radius":0,
						"border":"3px dotted #99f"
					});
				})
				.bind('dragleave', function(e){
					$(this).css({
						"border":0
					});
				})
				.bind('dragover', function(e){
					e.preventDefault();
				})
				.bind('click', function(e){
					// _this.openEditWindow( $(this).attr('data-guieditor-cont-data-path') );
				})
				.bind('dblclick', function(e){
					_this.openEditWindow( $(this).attr('data-guieditor-cont-data-path') );
				})
			;
			if( !this.instancePath.match(new RegExp('^\\/bowl\\.[a-zA-Z0-9\_\-]+$')) ){
				// ルートインスタンスは編集できないようにする。
				$ctrlPanel.append( $ctrlElm );
			}


			for( var idx in this.fieldList ){
				var fieldName = this.fieldList[idx];
				if( this.moduleTemplates.fields[fieldName].fieldType == 'input'){
				}else if( this.moduleTemplates.fields[fieldName].fieldType == 'module'){
					for( var idx2 in this.fields[fieldName] ){
						this.fields[fieldName][idx2].drawCtrlPanels( $content );
					}

					var instancePath = this.instancePath+'/fields.'+fieldName+'@'+(this.fields[fieldName].length);
					var $elm = $content.find('[data-guieditor-cont-data-path='+JSON.stringify(instancePath)+']');
					var $ctrlElm = $('<div>')
						.css({
							'border':0,
							'font-size':'11px',
							'overflow':'hidden',
							'text-align':'center',
							'background-color': 'transparent',
							'display':'block',
							'position':'absolute',
							'top': $elm.offset().top + 5,
							'left': $elm.offset().left,
							"z-index":0,
							'width': $elm.width(),
							'height': $elm.height()
						})
						.attr({'data-guieditor-cont-data-path': instancePath})
						.bind('mouseover', function(e){
							$(this).css({
								"border-radius":5,
								"border":"1px solid #000"
							});
						})
						.bind('mouseout', function(e){
							$(this).css({
								"border":0
							});
						})
						.bind('drop', function(e){
							var method = event.dataTransfer.getData("method");
							if( method === 'moveTo' ){
								var moveFrom = event.dataTransfer.getData("data-guieditor-cont-data-path");
								contApp.contentsSourceData.moveInstanceTo( moveFrom, $(this).attr('data-guieditor-cont-data-path'), function(){
									// px.message('インスタンスを移動しました。');
									contApp.ui.resizeEvent();
								} );
								return;
							}
							if( method !== 'add' ){
								px.message('追加するモジュールをドロップしてください。ここに移動することはできません。');
								return;
							}
							var modId = event.dataTransfer.getData("modId");
							contApp.contentsSourceData.addInstance( modId, $(this).attr('data-guieditor-cont-data-path'), function(){
								// px.message('インスタンスを追加しました。');
								contApp.ui.resizeEvent();
							} );
						})
						.bind('dragenter', function(e){
							$(this).css({
								"border-radius":0,
								"border":"3px dotted #99f"
							});
						})
						.bind('dragleave', function(e){
							$(this).css({
								"border":0
							});
						})
						.bind('dragover', function(e){
							e.preventDefault();
						})
						.bind('click', function(e){
							// px.message( 'UTODO: 開発中: select '+$(this).attr('data-guieditor-cont-data-path') );
						})
						.bind('dblclick', function(e){
							px.message( 'ここに追加したいモジュールをドロップしてください。' );
							e.preventDefault();
						})
					;
					$ctrlPanel.append( $ctrlElm );

				}else if( this.moduleTemplates.fields[fieldName].fieldType == 'loop'){
					for( var idx2 in this.fields[fieldName] ){
						this.fields[fieldName][idx2].drawCtrlPanels( $content );
					}

					var instancePath = this.instancePath+'/fields.'+fieldName+'@'+(this.fields[fieldName].length);
					var $elm = $content.find('[data-guieditor-cont-data-path='+JSON.stringify(instancePath)+']');
					// if( !$elm.size() ){
					// 	// memo: loopの下層にあるmarkdownに値が入ってない場合に 0 になった。
					// 	console.log('unmatched content element.');
					// 	console.log(JSON.stringify(instancePath));
					// }
					var $ctrlElm = $('<div>')
						.css({
							'border':0,
							'font-size':'11px',
							'overflow':'hidden',
							'text-align':'center',
							'background-color': 'transparent',
							'display':'block',
							'position':'absolute',
							'top':  (function($elm){if($elm.size()){return $elm.offset().top  + 5;}return 0;})($elm),
							'left': (function($elm){if($elm.size()){return $elm.offset().left + 0;}return 0;})($elm),
							'z-index':0,
							'width': $elm.width(),
							'height': $elm.height()
						})
						.attr({
							'data-guieditor-mod-id': this.moduleTemplates.id,
							'data-guieditor-sub-mod-name': fieldName,
							'data-guieditor-cont-data-path': instancePath
						})
						.bind('mouseover', function(e){
							$(this).css({
								"border-radius":5,
								"border":"2px solid #666"
							});
						})
						.bind('mouseout', function(e){
							$(this).css({
								"border":0
							});
						})
						.bind('drop', function(e){
							var method = event.dataTransfer.getData("method");
							if( method === 'moveTo' ){
								// これはloop要素を並べ替えるための moveTo です。
								// その他のインスタンスをここに移動したり、作成することはできません。
								var moveFrom = event.dataTransfer.getData("data-guieditor-cont-data-path");
								var moveTo = $(this).attr('data-guieditor-cont-data-path');
								function removeNum(str){
									return str.replace(new RegExp('[0-9]+$'),'');
								}
								if( removeNum(moveFrom) !== removeNum(moveTo) ){
									px.message('並べ替え以外の移動操作はできません。');
									return;
								}

								contApp.contentsSourceData.moveInstanceTo( moveFrom, moveTo, function(){
									// px.message('インスタンスを移動しました。');
									contApp.ui.resizeEvent();
								} );
								return;
							}
							px.message('ダブルクリックしてください。ドロップできません。');
							return;
						})
						.bind('dragenter', function(e){
							$(this).css({
								"border-radius":0,
								"border":"3px dotted #99f"
							});
						})
						.bind('dragleave', function(e){
							$(this).css({
								"border":0
							});
						})
						.bind('dragover', function(e){
							e.preventDefault();
						})
						.bind('click', function(e){
							// px.message( 'UTODO: 開発中: select '+$(this).attr('data-guieditor-cont-data-path') );
						})
						.bind('dblclick', function(e){
							var modId = $(this).attr("data-guieditor-mod-id");
							var subModName = $(this).attr("data-guieditor-sub-mod-name");
							contApp.contentsSourceData.addInstance( modId, $(this).attr('data-guieditor-cont-data-path'), function(){
								contApp.ui.resizeEvent();
							}, subModName );
							e.preventDefault();
						})
					;
					$ctrlPanel.append( $ctrlElm );
				}
			} // for
		} // this.drawCtrlPanels()

	} // function classUiUnit()

	/**
	 * モジュールの編集ウィンドウを開く
	 */
	this.openEditWindow = function( instancePath ){
		// px.message( '開発中: このモジュールを選択して、編集できるようになる予定です。' );
		// px.message( instancePath );
		var data = contApp.contentsSourceData.get( instancePath );
		var modTpl = contApp.moduleTemplates.get( data.modId, data.subModName );

		if( $editWindow ){ $editWindow.remove(); }
		$editWindow = $('<div>')
			.append( $('#cont_tpl_module_editor').html() )
		;
		$editWindow.find('form')
			.attr({
				'action': 'javascript:;',
				'data-guieditor-cont-data-path':instancePath
			})
			.submit(function(){
				for( var idx in modTpl.fields ){
					var field = modTpl.fields[idx];
					if( field.fieldType == 'input' ){
						if( contApp.fieldDefinitions[field.type] ){
							data.fields[field.name] = contApp.fieldDefinitions[field.type].saveEditorContent( $editWindow.find('form [data-field-unit='+JSON.stringify( modTpl.fields[idx].name )+']'), data.fields[field.name] );
						}else{
							data.fields[field.name] = contApp.fieldBase.saveEditorContent( $editWindow.find('form [data-field-unit='+JSON.stringify( modTpl.fields[idx].name )+']'), data.fields[field.name] );
						}
					}else if( field.fieldType == 'module' ){
						// module: 特に処理なし
					}else if( field.fieldType == 'loop' ){
						// loop: 特に処理なし
					}
				}
				$editWindow.remove();
				px.closeDialog();
				_this.resizeEvent();
				return false;
			})
		;
		$editWindow.find('form .cont_tpl_module_editor-cancel')
			.click(function(){
				$editWindow.remove();
				px.closeDialog();
				return false;
			})
		;
		$editWindow.find('form .cont_tpl_module_editor-remove')
			.attr({'data-guieditor-cont-data-path':instancePath})
			.click(function(){
				contApp.contentsSourceData.removeInstance( $(this).attr('data-guieditor-cont-data-path') );
				delete data;
				$editWindow.remove();
				px.closeDialog();
				_this.resizeEvent();
				return false;
			})
		;

		for( var idx in modTpl.fields ){
			var field = modTpl.fields[idx];
			if( field.fieldType == 'input' ){
				$editWindow.find('div.cont_tpl_module_editor-canvas')
					.append($('<div>')
						.attr( 'data-field-unit', modTpl.fields[idx].name )
						.append($('<h2>')
							.text(field.type+' ('+modTpl.fields[idx].name+')')
						)
						.append( ((function( field, mod, data ){
							if( contApp.fieldDefinitions[field.type] ){
								return contApp.fieldDefinitions[field.type].mkEditor( mod, data );
							}
							return $('<div>')
								.append( $('<textarea>')
									.attr({"name":mod.name})
									.val(data)
									.css({'width':'100%','height':'6em'})
								)
							;
						})( field, modTpl.fields[idx], data.fields[modTpl.fields[idx].name] ) ) )
					)
				;
			}else if( field.fieldType == 'module' ){
				$editWindow.find('div.cont_tpl_module_editor-canvas')
					.append($('<div>')
						.attr( 'data-field-unit', modTpl.fields[idx].name )
						.append($('<h2>')
							.text(field.fieldType+' ('+modTpl.fields[idx].name+')')
						)
						.append($('<p>')
							.text('ネストされたモジュールがあります。')
						)
					)
				;
			}else if( field.fieldType == 'loop' ){
				$editWindow.find('div.cont_tpl_module_editor-canvas')
					.append($('<div>')
						.append($('<h2>')
							.text(field.fieldType+' ('+modTpl.fields[idx].name+')')
						)
						.append($('<p>')
							.text('ネストされたサブモジュールがあります。')
						)
					)
				;

			}
		}

		px.dialog({
			"title": "編集" ,
			"body": $editWindow ,
			"buttons":[]
		});
		return this;
	}// openEditWindow()

	/**
	 * ウィンドウ リサイズ イベント ハンドラ
	 */
	this.resizeEvent = function(){
		$('.cont_field')
			.css({
				'height':$(window).height() - 5
			})
		;

		$previewDoc = $($preview[0].contentWindow.document);

		var fieldheight = $previewDoc.find('body').height()*1.5; // ←座標を上手く合わせられないので、余裕を持って長めにしとく。
		$preview.height( fieldheight );
		$ctrlPanel.height( fieldheight );
		if( $editWindow ){
			$editWindow.height( fieldheight );
		}

		$ctrlPanel.html('');
		$previewDoc.find('.contents').each(function(){
			$(this).html('');
			var id = $(this).attr('id')||'main';
			var data = contApp.contentsSourceData.getBowlData( id );

			dataViewTree[id] = new classUiUnit( '/bowl.main', data );
			$(this).html( dataViewTree[id].bind( 'canvas' ) );
			$(this).html( dataViewTree[id].drawCtrlPanels($(this)) );

		});

		setTimeout(function(){
			// UTODO:
			// 高さ合わせ処理のタイミングがずれることがある。
			// 根本的な解決にはなってないが、一旦 setTimeout() で逃げとく。
			// 描画処理中のどこかに何か原因がありそうな気がする。
			var fieldheight = $previewDoc.find('body').height();
			$preview.height( fieldheight );
			$ctrlPanel.height( fieldheight );
			if( $editWindow ){
				$editWindow.height( fieldheight );
			}
		}, 200);
	} // resizeEvent()

	/**
	 * 最終書き出しHTMLのソースを取得
	 */
	this.finalize = function(){
		var src = dataViewTree.main.bind( 'finalize' );
		src = JSON.parse( JSON.stringify(src) );
		return src;
	}

})(window.px, window.contApp);