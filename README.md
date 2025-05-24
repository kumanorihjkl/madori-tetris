# 間取りテトリス・プロ ライト版

TypeScript + React + Viteで実装された革新的なブラウザゲームです。テトリスの要素と建築設計を組み合わせ、制約の中で最適な間取りを作成することを目指します。

## 🎮 ゲーム概要

### 基本ルール
- **敷地**: 10列 × 16行のグリッド（1マス = 0.5m四方相当）
- **目標**: 建蔽率80%以内で効率的な間取りを作成
- **操作**: テトリス風の落下ピース配置システム

### ピース種類（全8種）

#### 建物ピース（建蔽率計算対象）
- **LDK**: 5×4マス（回転不可）
- **寝室**: 4×3マス（回転不可）
- **浴室**: 2×2マス（回転不可）
- **トイレ**: 2×1マス（回転可能）
- **廊下**: 1×4マス（回転可能）
- **収納**: 2×1マス（回転可能）

#### 屋外ピース（建蔽率計算対象外）
- **庭**: 2×2マス（レベル7以降必須）
- **駐車場**: 3×2マス（レベル4以降必須）

## 🎯 ゲーム終了条件

1. **衝突死**: 新ピースが初期位置で重なる
2. **建蔽率オーバー**: 建物面積が敷地の80%を超過
3. **採光ゼロ居室**: LDKまたは寝室が外周壁に接していない

## 🏆 得点システム

### 基本得点
- 建物ピース着地: `10 × マス数`
- 屋外ピース着地: `5 × マス数`

### ボーナス得点
- **ゾーン完成**: LDK・寝室・浴室・トイレが互いに隣接し閉ループ → `+1000点`
- **スリム廊下**: ゲーム終了時、廊下総マス ≤ 8 → `+500点`
- **景観ボーナス**: 庭マスが4連続以上で接続 → `+300点`

## 🎮 操作方法

| キー | 動作 |
|------|------|
| ← → | ピース移動 |
| ↑ | ピース回転（90°単位） |
| ↓ | ソフトドロップ |
| Space | ハードドロップ |
| C | ホールド（1個まで） |

## 🚀 セットアップ

### 必要環境
- Node.js 18以上
- npm または yarn

### インストール手順

```bash
# リポジトリをクローン
git clone <repository-url>
cd my-madori-tetris

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### 利用可能なスクリプト

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# ビルド結果をプレビュー
npm run preview

# ESLintでコード検査
npm run lint

# テスト実行
npm run test

# テストUI起動
npm run test:ui
```

## 🏗️ 技術スタック

### フロントエンド
- **React 18**: UIライブラリ
- **TypeScript**: 型安全な開発
- **Vite**: 高速ビルドツール
- **Tailwind CSS**: ユーティリティファーストCSS

### 状態管理
- **Redux Toolkit**: 予測可能な状態管理
- **React Redux**: React統合

### 描画
- **HTML5 Canvas**: 高性能な2D描画

### テスト
- **Vitest**: 高速テストランナー

### 開発ツール
- **ESLint**: コード品質管理
- **Prettier**: コードフォーマット
- **TypeScript ESLint**: TypeScript対応リンター

## 📁 プロジェクト構造

```
my-madori-tetris/
├── public/                 # 静的ファイル
├── src/
│   ├── components/         # Reactコンポーネント
│   │   ├── GameCanvas.tsx  # ゲーム描画
│   │   └── SidePanel.tsx   # UI情報パネル
│   ├── hooks/              # カスタムフック
│   │   ├── useGameControls.ts  # キーボード操作
│   │   └── useGameLoop.ts      # ゲームループ
│   ├── logic/              # ゲームロジック
│   │   ├── types.ts        # 型定義
│   │   ├── pieces.ts       # ピース管理
│   │   ├── grid.ts         # グリッド操作
│   │   └── scoring.ts      # 得点計算
│   ├── store/              # Redux状態管理
│   │   ├── index.ts        # ストア設定
│   │   └── gameSlice.ts    # ゲーム状態
│   ├── App.tsx             # メインアプリ
│   ├── main.tsx            # エントリーポイント
│   └── index.css           # グローバルスタイル
├── vite.config.ts          # Vite設定
├── tsconfig.json           # TypeScript設定
├── tailwind.config.js      # Tailwind設定
└── package.json            # プロジェクト設定
```

## 🧪 テスト

主要なユーティリティ関数に対してVitestを使用した単体テストを実装：

- 建蔽率計算の正確性
- 採光チェックロジック
- ゾーン完成判定
- グリッド操作の整合性

```bash
# テスト実行
npm run test

# テストカバレッジ確認
npm run test -- --coverage
```

## 🎨 UI/UX特徴

- **レスポンシブデザイン**: デスクトップ環境に最適化
- **リアルタイム情報**: 建蔽率、必須ピース状況を常時表示
- **視覚的フィードバック**: ピース種別の色分け表示
- **直感的操作**: テトリス経験者にとって自然な操作感

## 🔧 カスタマイズ

### ピース追加
`src/logic/pieces.ts`でピース定義を追加可能：

```typescript
export const PIECE_DEFINITIONS: Record<PieceType, PieceDefinition> = {
  // 新しいピースを追加
  '新ピース': {
    type: '新ピース',
    category: 'building',
    size: { width: 3, height: 2 },
    rotatable: true,
    color: '#ff6b6b',
    points: 60,
  },
  // ...
};
```

### 得点調整
`src/logic/scoring.ts`でボーナス得点を調整可能。

### UI改善
Tailwind CSSクラスを使用してスタイルを簡単にカスタマイズ可能。

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 🐛 バグレポート・機能要望

GitHubのIssuesページでバグレポートや機能要望をお寄せください。

---

**間取りテトリス・プロ ライト版** - 建築とゲームの新しい融合体験をお楽しみください！
