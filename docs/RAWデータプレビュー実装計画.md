# RAWデータプレビュー実装計画

## 現在の課題

先ほどの構成では、WebAssembly側の処理（`wasm-processor/src/lib.rs`）が仮の実装（100x100の赤い四角形を返すのみ）となっており、実際のRAW画像のプレビューデータをパースして表示するフローが未完成です。
ユーザーがアップロードした実際のRAWファイル（CR2, NEF, ARWなど）のプレビューを表示するためには、以下の2段階のアプローチが推奨されます。

## 実装アプローチ

### 1. 高速なプレビュー表示（EXIF情報の活用）

RAWデータには通常、高速表示用のJPEGサムネイル（プレビュー画像）が埋め込まれています。これをTypeScript側（`exifr` ライブラリ等）で即座に抽出し、待たせることなくプレビューとして表示します。

- **TypeScript側の修正:**
  - `utils/mediaProcessor.ts` またはコンポーネント内で `exifr.parse()` もしくは `exifr.thumbnail()` を使用。
  - 抽出したバイナリからBlob URL（`URL.createObjectURL`）を生成し、`<img src={url} />` として画面に表示。

### 2. リニアRAWデータ（実データ）のデコード展開（WASM）

本格的な「RAWリニアデータの表示・操作（ガンマ補正等）」を実現するためには、WASM側で実際にRAWフォーマットの解析を行う必要があります。

- **Rust側の修正 (`wasm-processor`):**
  - `Cargo.toml` にRAW画像処理用のRustクレート（例: `rawloader` や `image` のRAW対応feature）を追加。
  - `src/lib.rs` の `process_raw_data` 関数内で、受け取ったバイナリ列（`&[u8]`）を `rawloader::decode` 等を使ってデモザイク（RGB変換）し、`Uint8Array` または `Float32Array` として返すよう改修。
- **注意点:**
  - 本格的なデモザイク処理（bilinear, VNG等）をブラウザ上で行うと計算コストがかかるため、軽量な補間アルゴリズムを選択するか、非同期Workerを活用（実装済み）してUIをブロックしないようにします。

## UIコンポーネントの表示フロー

`RawDataViewer.tsx` を以下のワークフローへアップデートします。

1. **ファイル選択直後:**
    - `exifr` を用いてJPEGプレビューを抽出し、`<img className="preview-fast">` として即座に表示（ローディング待ちを回避）。
2. **バックグラウンド処理:** 
    - 同時にWeb Worker経由でWASMへRAWバイナリを渡し、リニアデータの解析を開始。
3. **WASM処理完了後:** 
    - プレビュー用の `<img>` を非表示にし、WASMから返ってきたリニア配列を描画した `<canvas>` へとシームレスに切り替える。
    - ここで初めて、ユーザーはガンマ補正などのシビアなリニアデータ操作が可能となります。

## 今後のステップ

1. TS側での `exifr` によるサムネイル抽出ロジック（高速プレビュー）の実装
2. `wasm-processor` でのRust製 `rawloader` クレートの導入とデモザイク関数の実装
3. `RawDataViewer.tsx` にプレビュー画像とCanvasの切り替えUIを追加
