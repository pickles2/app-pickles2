# Pickles 2 Desktop Tool

[Pickles2](http://pickles2.pxt.jp/) をベースに、ウェブサイトを編集するGUI編集環境を提供します。

<iframe width="560" height="315" src="https://www.youtube.com/embed/videoseries?list=PL5ZUBZrE-CkDSYUvVZNDCILrzGhRG2U8L" frameborder="0" allowfullscreen></iframe>

## Install

Copy `Pickles2DesktopTool.app` to your Application Folder.


## for developer

### Initial Setup for develop

```
$ git clone https://github.com/pickles2/pickles2desktoptool.git
$ cd pickles2desktoptool
$ npm install
$ composer install
```

### update submodules changes

```
$ npm run submodules-update
```

### Boot for develop

```
$ npm start
```


### Build application

```
$ php docs/help/htdocs/.px_execute.php /?PX=publish.run
$ npm run build
```

`./build/` にZIPファイルが出力されます。


## 更新履歴 - Change log

### Pickles 2 Desktop Tool 2.0.0-beta.14 (2016年??月??日)

- GUI編集で、モジュール設定 `deprecated` を追加。非推奨のモジュールに `true` をセットすると、モジュールパレットに表示されなくなる。
- 深いディレクトリにある新規のファイルをgitコミットできない不具合を修正。
- ハンバーガーメニューに「テキストエディタで開く」を追加。
- コンテンツ編集画面で 編集モード アイコンを表示するようになった。
- Pickles 2 Desktop Tool 設定 で、OK ボタンを押した直後に設定内容が保存されるようになった。
- 自然言語を選択できるようになった。 (まだ翻訳は十分ではなく、少しずつ対応していきます)
- メニューを選択時に、プロジェクトの情報を更新するようになり、コンフィグ更新時 や composer update のあと、ダッシュボードに戻る必要がなくなった。
- パブリッシュのオプション `paths_region` に対応した。
- その他いくつかの細かい修正。

### Pickles 2 Desktop Tool 2.0.0-beta.13 (2016年8月3日)

- コンテンツやサイトマップのコミット時、gitパスの設定が無視される不具合を修正。
- コンフィグ `path_controot` が `/` 以外の場合に起きる複数の不具合を修正。
- pickles2-contents-editor 更新: ローカルリソースの読み込みの記述を、 `$px->path_files()` 依存に書き換えた。
- GUI編集 の selectフィールドに、オプション `"display": "radio"` を追加。ラジオボタン形式の入力欄を作成できるようになった。
- GUI編集 で、同じ種類のフィールドが1つのモジュールに並んでいる場合に、最後の値がすべてに適用されてしまう不具合を修正。
- GUI編集 で、コピー＆ペースト操作時に、誤った操作ができてしまう不具合を修正。
- GUI編集 で、データ上のエラーで、誤ったモジュールが混入した場合に異常終了しないように修正。
- プレビューサーバーにPHPのパス設定が効いていない不具合を修正。
- ウィンドウサイズを変更したときに、GUIエディタの表示が崩れる不具合を修正。
- その他幾つかの細かい修正。

### Pickles 2 Desktop Tool 2.0.0-beta.12 (2016年6月23日)

- コンテンツ編集UIを pickles2-contents-editor に差し替えた。(broccoli-html-editorをラップするUIライブラリ)
- コンテンツをコミットする機能を追加。
- コンテンツ別のコミットログを表示する機能を追加。
- コンテンツ別にコミットログからロールバックする機能を追加。
- サイトマップをコミットする機能を追加。
- サイトマップのコミットログを表示する機能を追加。
- サイトマップをコミットログからロールバックする機能を追加。
- editWindow 上で、moduleフィールドとloopフィールドの並べ替えができるようになった。
- editWindow 上の loop appender をダブルクリック操作した後に表示が更新されない問題を修正。
- ソース編集で、CSS と JS が空白なときにも、外部ファイルが作られてしまう問題を修正。
- コンテンツの編集モードをHTMLに変更したいときに、GUI編集モードになってしまう不具合を修正。
- モジュールの詳細ダイアログ上で説明文のコピーに失敗する問題を修正。
- その他の細かい修正とチューニング。

### Pickles 2 Desktop Tool 2.0.0-beta.11 (2016年4月27日)

- broccoli-html-editor
  - ソース編集欄が高機能エディタ(Ace Editor) に対応。
  - hrefフィールドのサジェスト機能が常に表示されるように変更。
  - imageフィールドに、ローカルディスク上の画像ファイルをドラッグ＆ドロップで登録できるようになった。
  - imageフィールドに、画像のURL指定で登録できるようになった。
  - editWindowで、 moduleフィールド と loopフィールドの内容をリスト表示するようになった。
  - editWindowで、最初のフィールドにフォーカスが当たるようになった。
  - editWindowで、アンカーのinputの前に # の表示をつけた。
  - 1行のフィールドを `textarea` ではなく `input[type=text]` に変更。
  - appender に mouseover, mouseout したときの不自然な挙動を修正。
  - コンテンツのCSSで `html,body{height:100%;}` がセットされているときに、プレビュー画面の高さ設定に失敗する問題を修正。
  - loopモジュール内に別のモジュールが入る場合にデータが破損する問題を修正。
- express-pickles2
  - パラメータ THEME をセッションに記憶するようになった。
- その他の細かい修正とチューニング

### Pickles 2 Desktop Tool 2.0.0-beta.10.1 (2016年3月24日)

- broccoli: tableフィールドが、変換後のHTMLソースを表示できないことがある不具合を修正。

### Pickles 2 Desktop Tool 2.0.0-beta.10 (2016年3月23日)

- PHPコマンドを内蔵
- 「他のページから複製して取り込む」が失敗することがある不具合を修正
- パブリッシュ対象外のパスを指定できるようにした。 (pickles2/px-fw-2.x@2.0.17〜 の新機能に対応)
- broccoli-html-editor
    - モジュールパレットにフィルター機能を追加
    - クリップモジュール機能追加
    - コピー＆ペーストでリソースをセットで扱えるようになった
    - その他操作性の向上
- Pickles 2 サーバーエミュレータを express-pickles2 に変更
- その他複数の不具合の修正

### Pickles 2 Desktop Tool 2.0.0-beta.9.2 (2016年2月18日)

- broccoli: 新規のリソース登録ができない不具合を修正。

### Pickles 2 Desktop Tool 2.0.0-beta.9.1 (2016年2月13日)

- PxServerEmuratorが、GETパラメータを.px_execute.phpにバイパスするようになった。
- broccoli: editWindowで、ビルトインフィールドをデフォルトで隠すようにした。
- broccoli: resourceMgrでファイルのsizeが記録されていない(古いバージョンのデータ)場合に、リソースを扱えない不具合を修正。

### Pickles 2 Desktop Tool 2.0.0-beta.9 (2016年2月5日)

- GUI編集のエンジンを刷新した broccoli-html-editor を標準実装した
  - Pickles2 の config.php に、plugins.px2dt.guiEngine を設定すると、GUI編集エンジンを切り替えることができます。(legacy=旧エンジン、broccoli=新エンジン)
  - モジュールにマウスを重ねたときに表示される簡易プレビューを拡張
  - モジュールの仕様に description, default, finalize.js機能を追加
  - ウォークスルー編集 追加
  - 保存して閉じる処理を、保存せず閉じるに変更
  - instanceTreeViewがサイドバーとして表示されるようになった
- HTML編集モードの編集画面にプレビューボタンを追加
- コンテンツ画面右下のページ一覧を、フリーワード検索で絞込表示ができる機能を追加
- コンテンツ画面右下のページ一覧の表示モード切り替え機能 追加 (path と title を切り替え可能)
- コンテンツのソースコードを表示する機能 追加
- デベロッパーツールを開く機能を追加
- 絶対パスのどこかに日本語を含むディレクトリにインストールされようとした場合に、警告を表示するようにした
- \*.htm の場合に、GUIコンテンツ編集画面を起動できない不具合を修正
- Mac OSX 向けのビルドで、32bit版を廃止し、64bit版を追加した
- issueの投稿先URLを変更
- その他、UIの調整、不具合の修正など

### Pickles 2 Desktop Tool 2.0.0-beta.8 (2015年11月20日)

- デフォルトのインストールパッケージを pickles2/pickles2 に変更
- input[type=text], textarea にて、Backspace と Delete キーが無効化される問題を修正
- アプリケーション・サーバーのポート番号設定が反映されない不具合を修正
- GUI Editor: ドラッグ＆ドロップ操作時の追加・移動先を示すガイド機能を追加
- GUI Editor: hrefフィールドでサジェストされたリンク先候補をクリックしても反映されないことがある問題を修正
- GUI Editor: cmdキーを伴うキーバインドがWindowsで無効になる不具合を修正
- Windows版にて、画像のパスが、src属性にちゃんと出力されない不具合を修正
- Windows版にて、サイトマップ画面からcsvやxlsxをクリックしても標準アプリが開かない問題を修正
- Windows版にて、「Pickles2 Desktop Tool 設定」のコマンドのパス選択を、パスコピペではなくファイル選択で入力できるようにした
- その他いくつかの細かい修正


### Pickles 2 Desktop Tool 2.0.0-beta.7 (2015年10月1日)

- Pickles2 の新しい設定項目 `$conf->path_files` に対応した。
- コンテンツエリアのセレクタをPickles2のコンフィグ `$conf->plugins->px2dt->contents_area_selector`, `$conf->plugins->px2dt->contents_bowl_name_by` に設定できるようになった。
- GUI Editor: 編集中にバックスペースキーを押すと前の画面に戻ってしまうことがある問題を修正。
- GUI Editor: moduleフィールドの「ここにモジュールをドラッグしてください」の色とサイズで階層の深さが分かるように調整した。
- GUI Editor: 隣接するモジュールのパネルを密接するようにした。
- GUI Editor: 画像アップ済みのimageフィールドを複製すると、複製元と複製先の画像が連動してしまう不具合を修正。
- GUI Editor: tableフィールドにExcelを初回アップすると、正常に処理されない問題を修正。
- GUI Editor: モジュールのパッケージおよびカテゴリごとの `info.json` から `name` を読み込んで反映するようになった。
- GUI Editor: モジュールパッケージとカテゴリ内の並び替え指定 sort に対応。
- GUI Editor: instance Path View のUI改善。
- GUI Editor: instanceTreeView にフィールドのプレビューが付くようになった。
- 画像ファイルなどをドロップするとアプリに復帰できなくなる問題を修正。
- プレビュー用サーバーで `*.pdf` へのリクエストに対して application/pdf MIMEタイプを返すように修正。
- ファイルの検索機能追加。
- その他、細かい表示の調整、不具合の修正など。


### Pickles 2 Desktop Tool 2.0.0-beta.6 (2015年8月3日)

- HOME画面に README.md を表示するようになった。
- 部分パブリッシュができるようになった。対象のパスを指定して実行します。
- GUI編集: ビルトインDECフィールドを追加。
- GUI編集: ビルトインアンカー(ID)フィールドを追加。
- GUI編集: インスタンスパスビューを追加。
- GUI編集: インスタンスツリービューを追加。
- GUI編集: multitextフィールドを追加。
- GUI編集: imageフィールドで、出力するファイル名を指定できるようになった。
- GUI編集: リソースマネージャが、使われていないリソースを自動的に削除するようになった。
- GUI編集: Twigテンプレートで実装されたモジュールが利用可能になった。
- その他GUI編集画面のUI改善。
- モジュールテンプレートの実装に問題がある場合に、異常終了せず、エラーを報告するようになった。
- Px2の稼動状態が不完全な場合に、プロジェクトを選択しても落ちないようにした。
- その他、不具合の修正など。


## ライセンス - License

MIT License


## 作者 - Author

- Tomoya Koyanagi <tomk79@gmail.com>
- website: <http://www.pxt.jp/>
- Twitter: @tomk79 <http://twitter.com/tomk79/>
