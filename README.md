# wediRoll
結婚式すごろく

## 開発
### 準備物
docker環境
linux-> [Docker Engine](https://docs.docker.com/engine/install/)
Windows->[Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/)

### ビルド方法
```bash
docker compose up -d --build
```
### 開発サーバーアクセス方法
ビルド後、ブラウザで `http://localhost:5173` にアクセス

### 本番デプロイ環境アクセス方法
ブラウザで `https://wedi-roll-frontend.vercel.app/` にアクセス

（定期的に@milky1210がvercel上へデプロイを実施）

### 操作説明
#### マウス
- マウスドラッグでカメラ移動ができます
- マウスホイールでズームイン・ズームアウトができます
- コマを触って、マウスドラッグでコマを移動できます。
- マスをクリックしてマスの説明を開きます
- マスの説明欄の閉じるや、説明欄外部をクリックすると説明欄が閉じます
- コマに対して右クリックをすると、コマの画像が切り替わります（一回休みの表現）

#### キーボード
- `d` キーを押すとサイコロを振ります。3秒後消えます。
- `m` キーを押すとメモウィンドウがでます。もう一度押すと消えるトグルです。