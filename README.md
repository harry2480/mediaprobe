# MediaProbe - メディア技術仕様解析エンジン

高精度なメディアプロファイラー。画像、動画、音声ファイルの技術メタデータを完全ローカル処理で抽出。

## 特徴

- 📊 **詳細な技術情報抽出** — ビットレート、解像度、圧縮率、DPI、サンプリング周波数など
- 🔒 **プライバシー保護** — 100% ブラウザ内処理。データはアップロードされません
- ⚡ **容量制限なし** — ローカル処理のため大容量ファイルにも対応
- 🎯 **複数フォーマット対応** — MP4, WebM, MKV, MP3, WAV, JPG, PNG, WebP など

## 開発環境での実行

### 必要な環境
- Node.js (v18+)

### セットアップ

1. 依存パッケージをインストール：
   ```bash
   npm install
   ```

2. 開発サーバーを起動：
   ```bash
   npm run dev
   ```

3. ブラウザで http://localhost:3000 を開く

## ビルドとデプロイ

### ローカルビルド
```bash
npm run build
```

`dist/` ディレクトリにビルド結果が生成されます。

### GitHub Pages でのデプロイ

このリポジトリは GitHub Actions で自動デプロイが設定されています。

1. **リポジトリ設定** (Settings > Pages) で Source を **"GitHub Actions"** に変更
2. `main` ブランチに push すると自動的にビルド・デプロイされます
3. デプロイ後、`https://[user].github.io/mediaprobe/` でアクセス可能

## 技術スタック

- **React 19** + TypeScript
- **Vite** — 高速ビルドツール
- **Lucide React** — UI アイコン
- **Web Audio API / HTMLMediaElement** — メディア情報抽出

## ファイル構成

```
├── src/
│   ├── App.tsx           # メインコンポーネント
│   ├── index.tsx         # エントリーポイント
│   ├── types.ts          # 型定義
│   ├── utils/
│   │   └── mediaProcessor.ts  # メディア解析ロジック
│   └── components/
│       └── InfoGrid.tsx   # 情報表示グリッド
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## ライセンス
MIT
