import fs from "fs";
import fsX from "fs-extra";
import path from 'path';
import { fileURLToPath } from 'url';
import childProcess from "child_process";
import utils79 from "utils79";
import it79 from "iterate79";
import nwbuild from "nw-builder";
import phpjs from "phpjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var packageJson = JSON.parse(fs.readFileSync(__dirname + "/../package.json"));

var isProductionMode = true;
var devManifestInfo = false;
var date = new Date();
var appName = packageJson.name;
var versionSign = packageJson.version;
var platforms = [
	['osx', 'x64',],
	['osx', 'arm64',],
	// ['win', 'x64',],
	['win', 'ia32',],
	['linux', 'x64',],
];
var APPLE_IDENTITY = null;
if( utils79.is_file( './apple_identity.txt' ) ){
	APPLE_IDENTITY = fs.readFileSync('./apple_identity.txt').toString();
	APPLE_IDENTITY = utils79.trim(APPLE_IDENTITY);
}
var codesignJson = null;
if( utils79.is_file( './apple_codesign.json' ) ){
	var codesignJson = fs.readFileSync('./apple_codesign.json').toString();
	codesignJson = JSON.parse(codesignJson);
	if( codesignJson.apple_identity && APPLE_IDENTITY === null ){
		APPLE_IDENTITY = codesignJson.apple_identity;
	}
}

function pad(str, len){
	str += '';
	str = phpjs.str_pad(str, len, '0', 'STR_PAD_LEFT');
	return str;
}
function getTimeString(){
	var date = new Date();
	return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
}
function writeLog(row){
	fs.appendFile( __dirname+'/dist/buildlog.txt', row+"\n" ,'utf8', function(err){
		if(err){
			console.error(err);
		}
	} );
	console.log(row);
}

if( packageJson.version.match(/\+(?:[a-zA-Z0-9\_\-\.]+\.)?dev$/) ){
	isProductionMode = false;
}
if( !isProductionMode ){
	versionSign += '-'+pad(date.getFullYear(),4)+pad(date.getMonth()+1, 2)+pad(date.getDate(), 2);
	versionSign += '-'+pad(date.getHours(),2)+pad(date.getMinutes(), 2);
	packageJson.version = versionSign;
	if( packageJson.devManifestUrl ){
		packageJson.manifestUrl = packageJson.devManifestUrl;
	}

	// 一時的なバージョン番号を付与した package.json を作成し、
	// もとのファイルを リネームしてとっておく。
	// ビルドが終わった後に元に戻す。
	fs.renameSync('./package.json', './package.json.orig');
	fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 4));

}else if( utils79.is_file( './package.json' ) && utils79.is_file( './package.json.orig' ) ){
	isProductionMode = false;
	appName = packageJson.name;
	versionSign = packageJson.version;
}

if( !isProductionMode ){
	// 開発プレビュー版用の manifest ファイルを準備
	if( packageJson.manifestUrl ){
		devManifestInfo = {};
		devManifestInfo.manifest = {};
		devManifestInfo.manifest.name = appName;
		devManifestInfo.manifest.version = '9999.0.0'; // 常に最新になるように嘘をつく
		devManifestInfo.manifest.manifestUrl = packageJson.devManifestUrl;
		devManifestInfo.manifest.packages = {};

		if( devManifestInfo.manifest.manifestUrl.match(/^(https?\:\/\/[a-zA-Z0-9\.\/\-\_]+)\/([a-zA-Z0-9\.\_\-]+?)$/g) ){
			devManifestInfo.manifestBaseUrl = RegExp.$1 + '/';
			devManifestInfo.manifestFilename = RegExp.$2;
		}
	}
}

console.log('== build "'+appName+'" v'+versionSign+' ==');
if( !isProductionMode ){
	console.log('');
	console.log('****************************');
	console.log('* DEVELOPERS PREVIEW BUILD *');
	console.log('****************************');
	console.log('');
}

console.log('Cleanup...');
(function(base){
	var ls = fs.readdirSync(base);
	for(var idx in ls){
		if( ls[idx] == '.gitkeep' ){continue;}
		if( utils79.is_dir(base+'/'+ls[idx]) ){
			fsX.removeSync(base+'/'+ls[idx]);
		}else if( utils79.is_file(base+'/'+ls[idx]) ){
			fsX.unlinkSync(base+'/'+ls[idx]);
		}
	}
})( __dirname+'/dist/' );
console.log('');

writeLog( getTimeString() );

writeLog('Build...');

it79.ary(
	platforms,
	function(itAry, platform, idx){
		console.log('=-=-=-=-=', platform[0], platform[1]);
		nwbuild({
			mode: "build",
			app: {
				name: "Pickles2",
				icon: './app/common/images/appicon-win.ico',
			},
			outDir: "./build/Pickles2/"+(platform.join('_'))+"/",
			srcDir: (function(packageJson){
				var rtn = [
					'./package.json',
					'./app/**/*',
					'./images/**/*',
					'./composer.json',
					'./vendor/autoload.php'
				];
				var nodeModules = fs.readdirSync('./node_modules/');
				for(var i in nodeModules){
					var modName = nodeModules[i];
					switch(modName){
						case '.bin':
						case 'node-sass':
						case 'gulp':
						case 'gulp-plumber':
						case 'gulp-rename':
						case 'gulp-sass':
						case 'nw':
						case 'nw-builder':
						case 'mocha':
						case 'spawn-sync':
						case 'px2style':
							// ↑これらは除外するパッケージ
							break;
						case 'broccoli-html-editor':
							// 必要なファイルだけ丁寧に抜き出す
							rtn.push( './node_modules/'+modName+'/package.json' );
							rtn.push( './node_modules/'+modName+'/node_modules/**' );
							rtn.push( './node_modules/'+modName+'/composer.json' );
							rtn.push( './node_modules/'+modName+'/vendor/**' );
							rtn.push( './node_modules/'+modName+'/client/dist/**' );
							rtn.push( './node_modules/'+modName+'/libs/**' );
							rtn.push( './node_modules/'+modName+'/fields/**' );
							rtn.push( './node_modules/'+modName+'/data/**' );
							break;
						case 'broccoli-field-table':
							// 必要なファイルだけ丁寧に抜き出す
							rtn.push( './node_modules/'+modName+'/package.json' );
							rtn.push( './node_modules/'+modName+'/composer.json' );
							rtn.push( './node_modules/'+modName+'/dist/**' );
							rtn.push( './node_modules/'+modName+'/libs/**' );
							rtn.push( './node_modules/'+modName+'/vendor/**' );
							rtn.push( './node_modules/'+modName+'/node_modules/**' );
							break;
						case 'broccoli-processor':
							// 必要なファイルだけ丁寧に抜き出す
							rtn.push( './node_modules/'+modName+'/package.json' );
							rtn.push( './node_modules/'+modName+'/node_modules/**' );
							rtn.push( './node_modules/'+modName+'/config/**' );
							rtn.push( './node_modules/'+modName+'/libs/**' );
							break;
						case 'pickles2-contents-editor':
							// 必要なファイルだけ丁寧に抜き出す
							rtn.push( './node_modules/'+modName+'/package.json' );
							rtn.push( './node_modules/'+modName+'/node_modules/**' );
							rtn.push( './node_modules/'+modName+'/composer.json' );
							rtn.push( './node_modules/'+modName+'/vendor/**' );
							rtn.push( './node_modules/'+modName+'/dist/**' );
							rtn.push( './node_modules/'+modName+'/libs/**' );
							rtn.push( './node_modules/'+modName+'/data/**' );
							rtn.push( './node_modules/'+modName+'/config/**' );
							rtn.push( './node_modules/'+modName+'/broccoli_assets/**' );
							break;
						case 'pickles2-module-editor':
							// 必要なファイルだけ丁寧に抜き出す
							rtn.push( './node_modules/'+modName+'/package.json' );
							rtn.push( './node_modules/'+modName+'/node_modules/**' );
							rtn.push( './node_modules/'+modName+'/composer.json' );
							rtn.push( './node_modules/'+modName+'/vendor/**' );
							rtn.push( './node_modules/'+modName+'/dist/**' );
							rtn.push( './node_modules/'+modName+'/libs/**' );
							rtn.push( './node_modules/'+modName+'/config/**' );
							break;
						default:
							// まるっと登録するパッケージ
							rtn.push( './node_modules/'+modName+'/**/*' );
							break;
					}
				}
				var composerVendor = fs.readdirSync('./vendor/');
				for(var i in composerVendor){
					var modName = composerVendor[i];
					switch(modName){
						case 'bin':
						case 'phpunit':
							// ↑これらは除外するパッケージ
							break;
						default:
							// まるっと登録するパッケージ
							rtn.push( './vendor/'+modName+'/**/*' );
							break;
					}
				}
				return rtn.join(' ');
			})(packageJson),
			version: (function(packageJson){ // <- version number of node-webkit
				var nwVersion = packageJson.devDependencies.nw;
				nwVersion = nwVersion.replace(/^[^0-9]*/, '');
				nwVersion = nwVersion.replace(/\-[\s\S]*$/, '');
				return nwVersion;
			})(packageJson),
			flavor: 'sdk',
			icon: './app/common/images/appicon-osx.icns',
			zip: false,
			platform: platform[0],
			arch: platform[1],
		}).then(function(){

			if( fs.existsSync('./package.json.orig') ){
				// 一時的なバージョン番号を付与した package.json を削除し、
				// もとのファイルに戻す。
				fs.renameSync('./package.json.orig', './package.json');
			}

			writeLog('all build done!');
			writeLog( getTimeString() );

			(function(){
				it79.fnc({}, [
					function(itPj, param){
						// macOS 版に 署名を追加する
						if( !APPLE_IDENTITY ){
							itPj.next(param);
							return;
						}
						writeLog('-- Apple Developer Certification:');
						writeLog(APPLE_IDENTITY);
						it79.ary(
							[
								'./build/'+appName+'/osx64/payload',
								'./build/'+appName+'/osx64/nwjc',
								'./build/'+appName+'/osx64/chromedriver',
								'./build/'+appName+'/osx64/minidump_stackwalk',
								'./build/'+appName+'/osx64/libffmpeg.dylib',
								'./build/'+appName+'/osx64/'+appName+'.app'
							],
							function(itPjSign, row, idx){
								appleCodesign(row, function(){
									writeLog('done! - ['+idx+'] '+row);
									itPjSign.next(param);
								});
							},
							function(){
								itPj.next(param);
							}
						);
					},
					function(itPj, param){
						// macOS 版に /Applications へのシンボリックリンクを追加する
						var proc = childProcess.spawn(
							'ln',
							[
								'-s', '/Applications',
								__dirname + '/'+appName+'/osx64/Applications'
							],
							{}
						);
						proc.on('close', function(){
							itPj.next(param);
						});

					},
					function(itPj, param){
						// ZIP Apps.
						var platformName = platform.join('_');
						var zipFileName = appName+'-'+versionSign+'-'+platformName+'.zip';
						if( !isProductionMode && devManifestInfo ){
							var manifestPlatformName = platformName;
							switch( manifestPlatformName ){
								case "osx64":
								case "osx32":
									manifestPlatformName = "mac";
									break;
								case "win64":
								case "win32":
									manifestPlatformName = "win";
									break;
							}
							devManifestInfo.manifest.packages[manifestPlatformName] = {};
							devManifestInfo.manifest.packages[manifestPlatformName].url = devManifestInfo.manifestBaseUrl + zipFileName;
						}

						writeLog('[platform: '+platformName+'] Zipping...');
						process.chdir(__dirname + '/'+appName+'/'+platformName+'/');
						var proc;
						if( platformName == 'osx64' ){
							proc = childProcess.spawn(
								'ditto',
								[
									'-ck', '--rsrc', '--sequesterRsrc',
									'.', '../../dist/'+zipFileName
								],
								{}
							);
						}else{
							proc = childProcess.spawn(
								'zip',
								[
									'-q', '-y', '-r',
									'../../dist/'+zipFileName, '.'
								],
								{}
							);
						}
						proc.on('close', function(){
							writeLog('success. - '+'./build/dist/'+zipFileName);
							process.chdir(__dirname);

							if( platformName == 'osx64' ){
								// ZIPにもサインする
								appleCodesign(
									__dirname + '/dist/' + zipFileName,
									function(){
										// 公証へ提出
										appleNotarizeMacOsBuild(
											__dirname + '/dist/' + zipFileName,
											function(){
												it2.next();
											}
										);
									}
								);
								return;
							}

							itPj.next(param);
						});
					},
					function(itPj, param){
						if( !isProductionMode && devManifestInfo ){
							// manifest json を出力
							fs.writeFileSync(
								__dirname + '/dist/' + devManifestInfo.manifestFilename,
								JSON.stringify(devManifestInfo.manifest, null, 4)
							);
						}
						itPj.next(param);
					},
					function(itPj, param){
						writeLog('cleanup...');
						fsX.removeSync(__dirname+'/'+appName+'/');
						itPj.next(param);
					},
					function(itPj, param){
						writeLog( getTimeString() );
						writeLog('all zip done!');
						itPj.next(param);
					},
					function(){
						itAry.next();
					},
				]);

			})();

		}).catch(function (error) {
			writeLog("ERROR:");
			writeLog(error);
			console.error(error);
		});
	},
	function(){
		console.log('--- finished');
	}
);



// Apple: mac版に署名を埋め込む
function appleCodesign(realpathTarget, callback){
	callback = callback || function(){};

	var proc = childProcess.spawn(
		'codesign',
		[
			'--force',
			'--verify',
			'--verbose',
			'--deep',
			// '--options', 'runtime',
				// ↑2020-05-06 これを有効にすると、アプリ起動後にウィンドウが立ち上がらなかった。
				// (このとき、 nwjs は v44.4)
			'--timestamp',
			'--entitlements', __dirname+'/apple_entitlements.plist',
			// '--check-notarization',
			'--sign', APPLE_IDENTITY,
			realpathTarget
		],
		{}
	);
	proc.on('close', function(){
		callback();
	});
	return;
}

// Apple: Apple の公証に提出する
function appleNotarizeMacOsBuild(realpathZip, callback){
	callback = callback || function(){};

	// macOS版 を Notarize
	if( !codesignJson ){
		callback();
		return;
	}

	writeLog('upload for macOS Notarize...');
	var proc = childProcess.spawn(
		'xcrun',
		[
			'altool',
			'--notarize-app',
			'-t', 'osx',
			'--primary-bundle-id', codesignJson.primary_bundle_id,
			'--username', codesignJson.apple_developer_account,
			'--password', codesignJson.apple_developer_password,
			'--file', realpathZip
		],
		{}
	);
	proc.on('close', function(){
		writeLog('done!');
		callback();
	});
	return;
}