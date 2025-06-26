## 🦀 Rust 実装による画像合成 API（Cloud Run）

---

### 処理概要

1. base 画像（base.jpg）と item 画像（item.png）を受け取る
2. CLAUDE.md の Step 1. Step 2. に従い、item 画像を加工する
3. 指定の座標位置に 2.で加工した item を貼り付ける
4. 合成後の画像を GCS (Google Cloud Storage) にアップロードする
5. 4. でアップロードしたファイルにアクセスする URL をレスポンスとして返す

---

### 使用予定ライブラリ（Rust）

- `image`：画像処理（読み込み・貼り付け）
- `base64`：フロント ⇔API 間の画像転送用
- `actix-web`：API 構築（POST /merge）
- `serde` / `serde_json`：リクエスト構造体解析

---

### API 仕様（Cloud Run 側）

| メソッド | パス      | 入出力形式                                |
| -------- | --------- | ----------------------------------------- |
| POST     | /generate | JSON + Base64 画像 or multipart/form-data |

---

### /generate リクエスト構造（JSON）

```json
{
  "base_image": "<base64_png>",
  "item_image": "<base64_png>",
  "position": { "x": 100, "y": 250 }
}
```

---

### /generate レスポンス構造（JSON）

```json
{
  "result_image": "URL"
}
```

### 注意点

- 負荷が高い場合のために Cloud Run の CPU 上限とタイムアウトを長めに設定
