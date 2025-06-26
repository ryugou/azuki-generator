### DB 用途

- 各ユーザーの画像合成回数を制限
- 履歴情報（いつ、どんな item で合成したか）を記録

---

### 使用サービス

- Supabase（PostgreSQL）
- Prisma による ORM 利用（Node.js からの操作）

---

### テーブル設計案

#### users

| カラム名   | 型        | 説明            |
| ---------- | --------- | --------------- |
| id         | UUID      | Auth0 のサブ ID |
| email      | TEXT      | メールアドレス  |
| created_at | TIMESTAMP | 登録日時        |

#### generations

| カラム名   | 型        | 説明                     |
| ---------- | --------- | ------------------------ |
| id         | UUID      | 主キー                   |
| user_id    | UUID      | users テーブルの外部キー |
| base_url   | TEXT      | base.jpg の保存 URL      |
| item_url   | TEXT      | item.jpg の保存 URL      |
| result_url | TEXT      | 合成後画像の URL         |
| created_at | TIMESTAMP | 合成日時                 |
