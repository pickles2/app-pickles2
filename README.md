# Pickles 2 babycorn

code name: babycorn

[Pickles 2](https://pickles2.com/) のデスクトップ版 CMSです。


## Install

`Pickles2.app` を Application フォルダにコピーします。


## for developer

### Initial Setup for develop

```bash
$ npm install -g gulp
$ git clone https://github.com/pickles2/app-pickles2.git
$ cd app-pickles2
$ git submodule update --init --recursive --force
$ npm install
$ composer install
```

### update submodules changes

```bash
$ npm run submodules-update
```

### Boot for develop

```bash
$ npm start
```

`npm start` でエラーが起きる場合は以下を試してください。

```bash
$ npm install nw
$ npm start
```


### Task Runner

```bash
$ gulp watch
```


### Build application

```bash
$ php docs/help/htdocs/.px_execute.php /?PX=publish.run
$ npm run build
```

`./build/dist/` にZIPファイルが出力されます。


### Build application cleanly

```bash
$ sh build/build_clean.sh [-i ${AppleIdentity}] [-s ${path_to_apple_coodesign.json}] {$branch_or_version}
```

ユーザーのホームディレクトリに、クリーンビルドされたZIPファイルが出力されます。

mac で実行してください。Windows では実行できません。


#### Staple Apple Notarize Info

```bash
$ sh build/staple_apple_notarize_info.sh build/dist/Pickles2-{$version}-osx64.zip
```

### node and npm version

- node v17.2.0
- npm v8.1.4

Mac で Windows 版をビルドするにあたり、次の環境が必要です。

- wine v2.0


## 更新履歴 - Change log

### Pickles 2 babycorn v2.0.0-beta.30 (リリース日未定)

- Update NW.js to v0.79.0
- プレビュー用の内蔵サーバーが、パラメータ `LANG` を覚えるようになった。
- 起動時に必要なコマンドが利用できない状態の場合、設定ダイアログを表示するようになった。
- ダークモードの改善。
- PXコマンドのいくつかに、PHPコマンドのパスが引き回されない不具合を修正。
- その他いくつかのUIの改善と不具合の修正。
- 旧型の組み込みエンジン `broccoli-html-editor` のサポートを廃止。(`broccoli-html-editor-php` のみ対応)

### Pickles 2 babycorn v2.0.0-beta.29 (2021年6月12日)

- Update NW.js to v0.53.1
- ファイルとフォルダ機能のUIを改善した。
- Gitのコミット時、コミッター情報を取得できない場合に、入力欄を表示するようになった。
- プロジェクト個人設定から、 GitリモートURLを設定できるようになった。
- Gitの利用準備ができていないプロジェクトを開いたあとに、Gitを利用しているプロジェクトを開くとき、ホーム画面の描画が完了しなくなる不具合を修正。
- プロジェクトの `$conf->plugins->px2dt->main_menu` に対応。メインメニューをプロジェクト毎にカスタマイズできるようになった。
- プロジェクトの `$conf->plugins->px2dt->appearance->main_color` に対応。
- Custom Console Extensions で、メニューのいくつかを置き換えることができるようになった。
- その他いくつかのUIの改善と不具合の修正。

### Pickles 2 v2.0.0-beta.28 (2021年3月6日)

- Update NW.js to v0.51.1
- 未使用のモジュールの検索結果表示を改善した。
- プロジェクトの初期セットアップ時に、 `pickles2/preset-get-start-pickles2` の最新版をインストールするようになった。(修正前には、 `2.0.*` が指定されていた)
- ファイルとフォルダ機能で、 Markdownモードのコンテンツを直接開くようになった。
- 新しいテーマエディタに対応した。(`pickles2/px2-px2dthelper` v2.0.17 以上が必要)
- 新しい Custom Console Extensions 機能に対応した。

### Pickles 2 v2.0.0-beta.27 (2020年11月19日)

- Update NW.js to v0.47.0
- Linux版で、Git操作時にブランチ名の解析が失敗する場合がある問題を修正。
- ファイルとフォルダ機能を改善。
- Git操作関連機能を改善。
- スタイルガイドジェネレータの改善。
- コンテンツ編集メニューに「サブウィンドウで編集」を追加。
- 未使用のモジュールを検索する機能を追加。
- その他いくつかのUIの改善と不具合の修正。

### Pickles 2 v2.0.0-beta.26 (2019年12月15日)

- Update: broccoli-html-editor v0.3.11
- Update: pickles2-contents-editor v2.0.9
- Update: pickles2-module-editor v0.2.4
- `$conf->path_top` が設定されている場合に、コンテンツ編集ができない問題を修正。
- ハッシュ付きページのコンテンツを編集できない問題を修正。
- ダイナミックパスを含むページのコンテンツを編集できない問題を修正。
- Gitのブランチを切り替える機能を追加。
- コンテンツコメントの作成と削除ができない問題を修正。
- パブリッシュ後のエラーレポートをすぐに確認できるようになった。
- アプリケーション設定から、データディレクトリのパスを変更できるようになった。
- ダッシュボードで、プロジェクトの一覧をフィルタリングできるようになった。
- その他いくつかのUIの改善と不具合の修正。

### Pickles 2 v2.0.0-beta.25 (2019年6月30日)

- Update: broccoli-html-editor v0.3.8
- Update: pickles2-contents-editor v2.0.6
- Update: pickles2-module-editor v0.2.3
- コンテンツ一括加工機能がレポートする `countFile()` の出力に、コンテンツの拡張子と編集タイプの情報を付加するようになった。
- テーマの編集画面から、デフォルトのテーマを切り替えられるようになった。(プロジェクトに `pickles2/px2-px2dthelper` v2.0.12 以降が必要)
- 新規サイトマップCSV作成機能を追加。
- パブリッシュプレビュー機能を追加。
- git-pull, git-commit, git-push の操作が画面から実行できるようになった。
- その他いくつかのUIの改善。

### Pickles 2 v2.0.0-beta.24 (2019年4月19日)

- nw.js v0.37.0 にアップデートした。
- Broccoli エディタ (GUI編集) で、loopフィールドの外側に宣言されたinputフィールドの値を、 loopフィールド内の echoフィールドで参照できるようになった。
- Broccoli エディタ (GUI編集) で、loopフィールドに indexオプションを追加。
- Broccoli エディタ (GUI編集) で、inputフィールドに scriptフィールドを追加。
- その他いくつかのUIの改善。

### Pickles 2 v2.0.0-beta.23 (2019年3月15日)

- アプリケーション自身のアップデート自動チェック機能を追加。
- その他細かい不具合を修正。

### Pickles 2 v2.0.0-beta.22 (2019年2月22日)

- 新機能「ファイルとフォルダ」を追加。
- 新機能「コンテンツファイルを一括作成」を追加。
- 新機能「コンテンツファイルリスト作成」を追加。
- Broccoli エディタ (GUI編集) で、コンテキストメニューを使えるようになった。
- ウィンドウのサイズと表示位置を記憶するようになった。
- `composer install` 画面を追加。
- 内蔵ウェブサーバーの安定性を向上した。
- Forum のリンク先を GitHub issue に変更。
- その他細かい不具合を修正。

### Pickles 2 v2.0.0-beta.21 (2018年10月26日)

- 1ページを単体で手軽にパブリッシュできる機能を追加。
- パブリッシュを途中でキャンセルできる機能を追加。
- 新規プロジェクト作成のフローを改善。
- アプリケーション設定から、 git のユーザー情報設定を更新できるようになった。
- その他いくつかのUIの改善。

### Pickles 2 v2.0.0-beta.20 (2018年8月30日)

- guiEngine 設定で `broccoli-html-editor-php` に対応。PHPに移植されたGUI編集エンジンを利用可能になった。
- スタイルガイドジェネレータが `finalize.php` に対応した。
- JS版GUI編集で、 if フィールドが、 canvas モード描画時でも常に finalize モードで出力された値を評価するように変更した。
- 外部のサーバーを設定したプロジェクトで、内蔵サーバーを起動してしまうことがある不具合を修正。
- composer.json の extra が存在するが空白の場合に異常終了する不具合を修正。
- composer プロジェクトの更新で、強制的に更新するオプションを追加した。
- composer update コマンドが失敗したとき、ユーザーに通知するようになった。
- コンテンツ一括加工の Dry Run オプションを、デフォルトでオフにした。
- その他いくつかの不具合の修正。

それ以前の更新は[こちらから](./docs/changelog.md)。


## ライセンス - License

MIT License


## 作者 - Author

- Tomoya Koyanagi <tomk79@gmail.com>
- website: <https://www.pxt.jp/>
- Twitter: @tomk79 <https://twitter.com/tomk79/>
