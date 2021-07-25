/**
 * Setting Condition Checker
 */
module.exports = function(main, window){
	var _this = this;
	var $ = window.jQuery;
	var px2style = window.px2style;
	var it79 = main.it79;

	/**
	 * 状態をチェックする
	 */
	this.check = function(callback){
		it79.fnc({}, [
			function(it79){
				px2style.loading();
				it79.next();
			},
			function(it79){
				it79.next();
			},
			// function(it79){
			// 	setTimeout(function(){
			// 		it79.next();
			// 	}, 2000);
			// },
			function(){
				px2style.closeLoading();
				callback();
			},
		]);
	}

}
