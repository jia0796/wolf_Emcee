# WolfCue 正式網域移轉與雲端資料清除

2026-11-02，工作分支 `feat/eclipse-host-app`。正式網站 https://wolfcue.runs-at.dev/；原 GitHub Pages 仍負責發布及託管，沒有合併 main、重設歷史或另建 Supabase 專案。

## 實際狀態

- 使用者已完成 runs-at.dev 的 CNAME `wolfcue → jia0796.github.io` 與 GitHub Pages 自訂網域設定。已唯讀核對 Pages `cname=wolfcue.runs-at.dev`、`build_type=workflow`、HTTPS 啟用及憑證 approved。
- 新網址 HTTP 200，舊 `https://jia0796.github.io/wolf_Emcee/` 會到新站根目錄；應用資源、manifest scope／start_url／id 及房間邀請均使用相對路徑或目前 location，毋須搬動靜態檔或改遊戲流程。
- `room` Edge Function v3 → v4，只加入新網域精確來源；保留原 GitHub 與兩個既有 localhost 來源。原 Auth.getUser、RPC／RLS、私有 Realtime、verify_jwt=false 設定不變。無效來源仍在驗證前拒絕。[函式來源雜湊](domain-migration-evidence/edge-release.json)。
- `public/online.js`：遇 401 先蓋牌，只有 Auth 明確確認登入無效後才登出該本機登入，再由匿名 Auth 確認新登入，完全相同的請求最多重試一次。requestId／房間／操作不改；403 不換身分／不重試。若另一分頁已換新 token，不登出該新登入。原房間權限不因重試而恢復或移轉。
- `public/sw.js`：cache council-v22-33，沿用 CORE 優先／每批兩資產漸進策略，存檔仍 v22。不修改圖片、背景、版型、板子、投票、計時、角色技能或勝負規則。

## 已核准並完成的資料清除

使用者在本對話明確選擇：「清除 Supabase 全部 Auth 用戶，以及所有房間與對局資料」。已在 `wolfcue-online`（`cnseutkrrjkdkpikjcdz`）先檢查表、外鍵及 Storage，於單一交易依相依順序刪除，撤除 refresh tokens／sessions，再刪除 Auth users；角色及房間資料先清除，未關閉 RLS、未更動 schema。

[清除前後核對](domain-migration-evidence/cleanup.json)：清除前快照為 116 用戶、116 sessions、20 房間、64 房間授權、238 座位、20 邀請機密、3 發牌交易、34 角色分配；復盤暫存原為 0。交易完成後上述資料全部為 **0**，identities／mfa_amr_claims／refresh_tokens 也為 0。保留 **28 款板子**及原資料庫約束、政策、函式與排程。Storage 原為空，未操作 Storage 物件。另清除 69 筆已不存在房間的私有 Broadcast，核對孤立訊息為 0；沒有刪除仍存在的新房間訊息。清除後觀察到一個新匿名登入，屬新站重新登入，刻意保留。

這是一次性已授權清除，**沒有加入 migration、seed 或一般部署流程**。沒有匯出、下載或提交任何用戶原始資料與 token；報告只保留彙總數。資料刪除無法用 Git 回退還原。供應商備份／平台操作日誌與其他裝置上的 localStorage 不在本次遠端刪除範圍；後續新訪客會建立新的匿名用戶，不能把新帳號當作舊資料殘留。

## 修改檔案

- `backend/supabase/functions/room/index.ts`：新增精確允許來源。
- `backend/tests/room-cors.test.mjs`：九項來源／驗證測試，執行原 TypeScript handler；加上既有 channel test 共十項。
- `backend/tests/integration/edge-realtime.test.mjs`：原 CORS 整合矩陣追加新來源，既有舊來源與惡意來源斷言保留。
- `backend/scripts/akw-online-smoke.mjs`：新站預設網址、ONLINE_BASE／ONLINE_OUT；只記錄測試自建用戶 ID 到儲存庫外，供精確清理，不提交 ID／登入資料。
- `public/online.js`、`public/sw.js`：失效登入安全恢復與新 cache；不清除離線主持存檔。
- `scripts/online-auth-recovery-ui.mjs`：九組隔離 UI 認證／隱私回歸。
- README、DESIGN、AGENTS、backend/README 及本報告：正式入口、版本、清除範圍與驗收。

## 已執行測試

| 指令／範圍 | 通過 | 失敗 | 跳過 |
|---|---:|---:|---:|
| 根目錄 `npm test` | 1178 | 0 | 0 |
| backend `npm test` | 10 | 0 | 0 |
| `node scripts/online-auth-recovery-ui.mjs` | 9 組 | 0 | 0 |
| `node scripts/online-card-art-ui.mjs` | 41 組 | 0 | 0 |
| 直接部署後 Edge OPTIONS／POST，無登入 | 6 | 0 | 0 |
| `node scripts/update-cache-manifest.mjs --check` | 244 項 | 0 | 0 |

[完整規則](domain-migration-evidence/npm-local.json) · [後端單測](domain-migration-evidence/backend-unit.json) · [認證 UI](domain-migration-evidence/auth-local.json) · [角色卡 UI](domain-migration-evidence/card-local.json)。來源檢查包含新／舊合法 origin、相似惡意後綴、其他子網域與 HTTP 拒絕；允許的無登入 POST 仍為 401，惡意來源為 403，沒有萬用 origin。

認證 UI 另驗證 Auth 服務中斷不登出／不換身分，Auth 確認有效時仍保留同一身分；覆蓋舊登入 401 恢復、別的分頁先更新、連續 401 僅重試一次、403 不重試、首次匿名登入、無 navigator.locks 降級、角色未確認前清空正面；原離線存檔逐字一致。初次新 UI 腳本在既有 350ms 翻牌動畫未結束時重點造成逾時，已補足動畫等待並完整重跑後再追加兩組 Auth 確認邊界，共九組，初次未完成結果不算通過。

## 發布與部署後結果

Edge v4 已部署並取回來源核對一致。前端功能提交、Pages 發布及正式新網域連線／離線驗證待本輪完成後補入，尚未執行的項目不列通過。

## 未驗收／限制

- 本機 Docker 未在 PATH 或既有安裝路徑找到，未執行 Docker Supabase 全套 integration／pgTAP；不以 handler 單測冒充資料庫／Realtime 整合測試。
- iPhone Safari、iOS 安裝 PWA、Android 與低階實體裝置：待真機驗收。新域 PWA 需重新安裝，舊域本機對局不會自動跨 origin 搬移，不應要求使用者清除離線遊戲存檔。
- 目前僅使用匿名登入，未新增 OAuth／Email redirect、未變更 Supabase Auth provider 或專案 URL／key。

## 程式備份與回退

施工前乾淨 HEAD `d8675992ce16c08ad1a977c7f0b9e7f11cac93f0`；已建立並推送唯一遠端 `backup/pre-custom-domain-20261102`，核對指向同一 SHA，所有舊備份保留。

程式可用新的 revert 提交回退，重新測試與發布；若回退至舊域，須另恢復 GitHub Pages 網域設定及保持 DNS 一致，且 SW 使用未用過的新 cache 名。Edge 可從此備份的 room 原始碼重新部署，但 v3 不允許新域，不能在新站使用期間直接回退。**Git 備份不含本次已刪除的用戶／對局資料，程式回退不會恢復它們。**
