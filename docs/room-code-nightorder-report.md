# 5 碼房號、夜序與覺醒女巫表決｜實作、部署與測試報告

日期：2026-11-06。使用者已授權部署。Supabase migration `20261106071704` 與 room Edge Function v5 已發布；網站已成功發布，部署後 UI／離線檢查完成；真實雲端測試逐輪結果另列。未修改 main、Google Drive、角色圖片、遊戲數值或既有用戶／對局。

## 工作目錄與回退基準

所有程式及本文位於：
`C:/Users/laptop/.codex/.chatgpt-projects/g-p-6ab7d6c1ce448191aa4864889419a846/walf/`

原始測試輸出／手機截圖位於同層上級的 `output/room-code-nightorder/`；可隨儲存庫交付的結果與截圖副本位於 [room-code-nightorder-evidence](room-code-nightorder-evidence/)。

- 分支：`feat/eclipse-host-app`，開始時工作樹乾淨；本機與 GitHub 基準一致。
- 基準 SHA：`f70cdde48b1af4547ca6676f91cdac43ef13af20`。
- 已建立並查證遠端備份：[backup/pre-room-code-nightorder-20261106](https://github.com/jia0796/wolf_Emcee/tree/backup/pre-room-code-nightorder-20261106)。
- 功能提交：[`195714c49793e0838242484a5ebaa8abe500b6d6`](https://github.com/jia0796/wolf_Emcee/commit/195714c49793e0838242484a5ebaa8abe500b6d6)。[Pages build／deploy 均成功](https://github.com/jia0796/wolf_Emcee/actions/runs/42182565423)。以上 f70cdde 是施工前基準。
- 存檔仍 v22，發布 cache `council-v22-34`。

## 已實作

1. **首頁加入房間**：開始主持 → 加入房間 → 角色圖鑑；沿用原背景、按鍵大小／行距。房號欄有標籤、錯誤、加入中與防重複提交；可貼上、大小寫混用、去除前後空白。5 碼字元排除 I／L／O／0／1，例 `A78B2`。
2. **後端短房號**：另外保存短碼與 UUID 對照，不截斷／替換原 UUID、12 碼房號或邀請憑證。新／舊活動房都有短碼，建立衝突重試，原連結／QR 可用。未發牌且有空位才接受新成員；既有玩家以原 Auth 身分恢復。解散級聯刪除短碼，結束／過期不能再加入。角色仍依個人座位 lease 查詢。
3. **機通字幕**：首夜刪除額外學獵人手勢句，第二晚起刪除獵人閉眼後額外三句；學習、狼刀、技能資格不變。舊局及上一步取回已移除階段時安全映射到閉眼步驟；不刪歷史、不提前提交行動或結算。
4. **AKW 夜序顯示**：守衛 → 狼人 → 覺醒黑狼王親傳 → 覺醒女巫 → 預言家 → 獵人 → 協助者集體表決 → 天亮。僅補齊顯示，實際階段未調整。
5. **覺醒女巫紀錄表決**：移除模式／上一位下一位，先選協助者再選意見；自動跳下一位未填者，全部填完才能完成統計，仍需主持下一步正式結算。×／Escape 保留草稿，不紀錄表決清除個別票型。修改、取消、刷新及儲存失敗皆保留原安全語意。
6. **間距**：協助者按鍵相隔 10px，意見按鍵與底部按鍵相隔 12px；48px 觸控高度、全藍色系／米白字，視窗按內容縮短。移除舊版粉紅意見字色及 8px 的覆寫樣式。

## 實際測試結果

| 執行內容 | 通過 | 失敗 | 跳過 | 證據 |
|---|---:|---:|---:|---|
| 根目錄 `npm test` | 1185 | 0 | 0 | [完整輸出](room-code-nightorder-evidence/npm-test.txt) |
| backend `npm test` | 30 | 0 | 0 | [完整輸出](room-code-nightorder-evidence/backend-test.txt) |
| 新加入／表決／夜序 UI | 17 | 0 | 0 | [結果](room-code-nightorder-evidence/new-ui-results.json) |
| 既有覺醒黑狼王／女巫 UI | 13 | 0 | 0 | [結果](room-code-nightorder-evidence/akw-results.json) |
| 既有登入恢復 UI | 9 | 0 | 0 | [結果](room-code-nightorder-evidence/auth-results.json) |
| 既有線上卡／角色圖片 UI | 41 | 0 | 0 | [結果](room-code-nightorder-evidence/art-results.json) |
| 死亡技能／機通／狼弟 UI | 30 | 0 | 0 | [結果](room-code-nightorder-evidence/dsk-results.json) |
| Service Worker／離線主持 | 3 | 0 | 0 | [結果](room-code-nightorder-evidence/offline-results.json) |

共 **113 組瀏覽器檢查**；用獨立無頭 Edge，手機視窗包含 320×568、390×844、430×932，以及 844×390 橫向。既有 AKW 測試另含 375×667／1024×768。截圖已人工檢查，DOM 量測確認按鍵間距、縮短高度及按鍵未超出可視區。

後端 30 項包含 11 項 PGlite 真實 PostgreSQL SQL 檢查、9 項新 Edge 輸入／路由／429 檢查，以及原 10 項測試。SQL 實際套用既有 migration、虛構目錄及新 migration，驗證舊資料保留、撞碼重試、10／12 座位發牌、角色權限、限流、過期／解散與回退。Auth／Realtime 使用介面替身；PGlite 的排程不是多資料庫連線競爭測試。

第一次無頭 Edge 啟動受到 Windows 沙箱限制，第一次既有 UI 回歸因沙箱內外 localhost 不互通而未執行完成；改以隔離無頭瀏覽器與同權限本機伺服器後重跑通過。視覺檢查另修正原 CSS 的自動高度撐滿與 input 160px 限寬。以上中斷沒有計入通過數。離線腳本沿用的「actual deployed SW」結果標籤，本輪 URL 是 localhost，**不是正式站測試**。

## 安全驗收與待測

已通過：匿名身分仍需 Auth；後端不信任前端 roomId 覆蓋短碼；對照與限流表啟用 RLS 並禁止客戶直接讀寫；短碼加入不回傳邀請憑證／其他人角色；非成員不能只用 UUID 加入；成員重連不需公開邀請；原主持權限、私人角色 lease、一次發牌、原連結保持有效；新 RPC 每身分每分鐘 6 次、每小時 30 次的交易內限流，無效輸入亦計數；Edge 回 429。

限制與未驗收：
- **完整本機 Supabase Docker 整合未驗收**：Docker Desktop Linux engine 管道沒有啟動。部署後另用自建匿名帳號／房間實測，沒有使用正式玩家帳號或房間。雲端測試逐輪中斷與最終範圍見下節。
- 限流按 Auth 身分，不能宣稱阻擋換身分的分散式猜碼。既有匿名註冊／CAPTCHA／IP 限制設定沒有修改或重新驗收；5 碼本質上比原長邀請憑證更易猜中。
- **iPhone Safari／iOS PWA／Android 真機未驗收**；桌面手機尺寸模擬不等於實機。
- 雲端及網站均已發布；[11 個前端檔案雜湊](room-code-nightorder-evidence/deployed-hashes.json) 全部一致。Edge v5 程式核對一致，僅上傳工具省略檔案末尾換行。

## 檔案清單

- 首頁／線上：`public/index.html`、`data.js`（僅 HOME_ACTIONS）、`app.js`、`online.js`、新增 `join-room.js`、`online.css`、`sw.js`。
- 夜序／表決：`public/engine.js`、`akw-ui.js`、`liquid-glass.css`、`recap-ui.css`（移除被取代的 AKW 專用樣式）。
- 後端：`backend/supabase/functions/room/index.ts`、`backend/supabase/migrations/20261106071704_short_room_codes.sql`、`backend/rollback/20261106-short-room-codes.sql`。
- 新測試：`test/room-code-nightorder.test.js`、`backend/tests/short-room-code.test.mjs`、`backend/tests/short-code-edge.test.mjs`、`scripts/room-code-nightorder-ui.mjs`。
- 更新既有定向測試：`test/dsk-mec-bro.test.js`、`test/takeover.test.js`、`scripts/dsk-mec-bro-ui.mjs`，以新裁定取代舊字幕預期，保留技能與回退檢查。
- 文件：`README.md`、`DESIGN.md`、`AGENTS.md`、`backend/README.md`、`docs/current-rules.md`、`docs/akw-spec.md`、本文及 evidence。歷史報告不覆寫。

## 發布與安全回退方式

實際發布順序：追加 migration `20261106071704` → room Edge Function v5 → 前端 Pages。已保留 UUID、原長邀請、原發牌與舊局相容；未合併 main。回退優先還原前端，避免新前端配舊後端。

回退應比對備份基準並保留後續使用者變更，不用 `reset --hard` 或強制推送。發布後以新的 revert 提交回退相應功能；回退網站時優先保留相容的追加後端。**不要清除使用者、房間或對局來回退。**

[SQL 回退草稿](../backend/rollback/20261106-short-room-codes.sql) 有活動房間保護，尚有 waiting／dealt 房就拒絕執行；PGlite 實測阻擋有效，房間不活躍後僅移除新增短碼／限流結構，原房間與 Auth 數量不變。正式需要回退 DB 時，用 CLI 建立新的回退 migration，不修改已執行歷史；保留舊網址／原邀請兼容。回退後短碼入口停用，不承諾原短碼可繼續使用。

## 預覽

![覺醒女巫表決](room-code-nightorder-evidence/ballot-390.png)

![加入房間](room-code-nightorder-evidence/join-390.png)

## 三間雲端測試房：實際結果與未通過項目

- 已實際驗證建立房間重試保留同一 UUID／短碼、拒絕陌生成員只用 UUID 加入，以及 12 個匿名身分以小寫短碼／原邀請連結並行加入。
- 第一輪 Realtime 訂閱失敗時，服務日誌顯示初始化與 MissingPartition；第二輪已訂閱成功，但 1.2 秒內未收到通知。資料庫確認已產生 25 筆私有 changed 訊息。不能據此宣稱端到端即時通知通過。測試已改等待實際通知，最長 15 秒，保留 SDK 自動重連。
- 再次批量建測試身分時收到 Auth 429；停止大量建立身分，沒有提高匿名註冊限額。待額度恢復後沿用同一組測試身分完成第三間房，總計只建立三間測試房。三間皆為覺醒黑狼王／覺醒女巫 12 人房；10 人雲端房未執行。單測與本機 UI 通過不替代此驗收。第一次、第二次及註冊限流中斷各自保留結果，不計為完整通過。

## 部署後正式站檢查

| 檢查 | 通過 | 失敗 | 跳過 | 證據 |
|---|---:|---:|---:|---|
| GitHub CI 完整 npm test（發布前關卡） | 1185 | 0 | 0 | [CI 摘要](room-code-nightorder-evidence/ci-summary.txt) |
| 正式站加入／夜序／表決 | 17 | 0 | 0 | [結果](room-code-nightorder-evidence/deployed-ui-results.json) |
| 正式站 AKW 原流程 | 13 | 0 | 0 | [結果](room-code-nightorder-evidence/deployed-akw-results.json) |
| 正式站認證恢復 | 9 | 0 | 0 | [結果](room-code-nightorder-evidence/deployed-auth-results.json) |
| 正式站角色卡 | 41 | 0 | 0 | [結果](room-code-nightorder-evidence/deployed-art-results.json) |
| 正式站 DSK／MEC／BRO | 30 | 0 | 0 | [結果](room-code-nightorder-evidence/deployed-dsk-results.json) |
| 正式站 Service Worker／離線 | 3 | 0 | 0 | [結果](room-code-nightorder-evidence/deployed-offline-results.json) |

部署後共 113 組瀏覽器檢查通過。線上 UI 檢查仍採傳輸替身，不能冒充真實房間測試；離線檢查實際使用正式站 `council-v22-34`。iPhone Safari／安裝 PWA／Android 真機未驗收。

## Supabase 權限檢查

新增兩表 RLS 開啟且 authenticated 無 SELECT 權限，僅限受驗證 RPC。安全 Advisor 新增兩筆 [RLS 無政策 INFO](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)，符合私有表禁止直接讀寫的設計。既有 [匿名存取政策提醒](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins) 保留成員／座位限制；cron schema 沒有授予 authenticated 使用權。既有 [洩漏密碼保護未開啟提醒](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) 未於此輪改動。未開放新公開表，也未調低 Auth 註冊限流。

### 最後一間房（部署後真實 Supabase）

[原始結果](room-code-nightorder-evidence/live-api-final-attempt.json)：**3 組通過、1 組失敗、6 組因前置失敗未執行**。

- 通過：併發建房重試得到同一 UUID／短碼；陌生成員只用 UUID 被拒絕；12 個獨立匿名身分以小寫短碼／原邀請併發加入，回傳不含邀請憑證或主持角色表。
- 失敗：選座請求全部完成，但私有 `changed` 通知在 15 秒內沒有到達 Node SDK 訂閱端。資料庫確認該房已產生 25 筆私有訊息；不能將寫入訊息當作客戶端已收到。
- 未執行：無憑證成員重連、併發發牌、個人角色 lease 隔離、已發牌重入／正式結束、短碼 API 429、直接 RPC 限流六組。對應本機 SQL／Edge 測試已通過，**不宣稱真實雲端整段發牌通過**。
- App 既有 SDK 自動重連與每 8 秒狀態輪詢仍保留；本輪沒有改 Realtime 政策、通知 trigger 或頻道協定。通知未到達的原因尚未確定，不能只歸因於冷啟動，也不能宣稱已修復。
- 依使用者「三組房間」限制停止加房；後續應先在同一組獨立身分／同一房觀察 SDK 訂閱權限與 WebSocket 訊息，再定位 Realtime 傳輸，不降低 Auth 限額。

### 測試資料清理

三間測試房均以原解散 API 關閉。所有測試工作階段先登出，之後依程式記錄的精確 ID 清理本輪 49 個測試 Auth 帳號及 51 筆測試房通知，沒有依時間範圍或全表刪除。前兩間合計 26 筆訊息、第三間 25 筆；原始未公開 ID 清單不放入 Git。

清理後查核：原有 Auth **1 位保留**；活動房間、角色資料、復盤暫存、短碼及限流紀錄均為 0；板子目錄 **28 款保留**。不重跑 2026-11-02 的全體用戶清除操作。真機測試仍標「未驗收」。
