# WolfCue 線上發牌後端

本目錄保存 Supabase migration、Edge Functions、26 款板子快照及本機安全測試。前端位於 `../public/online.js`，不向主持人或玩家公開完整角色分配表；主持人發牌後仍進入原有首夜身分辨識。

## 本機測試

需要 Node 22+、Docker Desktop（Linux containers）。目前輔助腳本使用 Windows CLI 路徑。

```powershell
npm ci
node scripts/local-cli.mjs start
node scripts/local-cli.mjs reset
node scripts/serve.mjs
```

另一個終端：

```powershell
npm test
npm run test:integration
node scripts/local-cli.mjs dbtest
```

`localConfig()` 拒絕非 loopback API／資料庫；本機 CLI 腳本拒絕 linked 專案。不輸出 CLI status 內的金鑰。測試資料全部為虛構帳號。

前端測試：先於儲存庫根目錄 `npm start`，再於本目錄執行 `node scripts/online-ui.mjs`；設定 `PLAYER_COUNT=12` 可驗證 12 人版。SDK／QR vendor 重建：`npm run build:vendor`。

## 權限與資料流

- 七張資料表位於非公開的 `wolfcue_private` schema，全面啟用 RLS。無政策的四張表刻意拒絕直接查詢。
- 玩家使用匿名 Auth 帳號（資料庫角色仍為 authenticated），邀請憑證與房號分開。
- 選座與發牌鎖定房間；座位、使用者及發牌交易都有唯一性約束。換座失敗保留舊座，重試發牌不重新洗牌。
- `room` Edge Function 使用 `auth.getUser()` 驗證 JWT，再以原使用者權限執行 RPC；不接受客戶端宣稱的角色或主持人身分。
- 私有 Realtime 僅廣播房間狀態與版本；成員收到事件後重新取得權威狀態。玩家不能偽造廣播；角色不進廣播。
- 角色 API 檢查房間、使用者與目前座位 lease，終局後拒絕讀取。角色回應不快取。
- 清理端點只接受資料庫驗證的 service_role。實際排程由 pg_cron 每分鐘直接執行私有清理函式，不保存 HTTP 管理憑證。
- 未發牌房間有效操作閒置兩小時關閉；輪詢和心跳不延長。已發牌房間等待正式終局。

## 部署與限制

雲端專案為 `wolfcue-online`；公開 URL／publishable key 可存在前端，service role、密碼及登入 token 不可寫入前端或文件。

首次空白雲端需依序執行 migrations，並匯入 `supabase/seed.sql` 的正式板子目錄。本機 reset 會自動匯入 seed；雲端不會自動執行 seed。請勿對既有正式資料庫盲目 reset 或重播初始化。

本次三個 migration 已在指定雲端執行。兩個 Edge Functions 的 gateway `verify_jwt=false` 是為了由函式／PostgREST 驗證身分，不代表開放匿名管理權限。

遊戲終局由授權主持人的原 App 通知，後端不重新執行狼人殺勝負引擎。主持人若在正式終局前手動丟棄本機對局，已發牌房間不會依兩小時規則清除；這是需另行定稿的房間生命週期限制。

完整測試與部署證據見 `../docs/online-deal-report.md`。真機 Safari／PWA、相機掃碼與低階 Android 尚未驗收。
