# WolfCue 線上發牌整合與測試報告

日期：2026-10-20。此報告涵蓋本機後端、指定 Supabase 雲端、App 接線及線上發牌視覺；不代表真機驗收。

## 基準與回退

- 原 App／遠端備份基準：`31beb7787ddecad6c607c00133f230a55519fba2`。
- 已推送備份：`backup/pre-online-deal-20261020`。
- 實作分支：`feat/online-deal-20261020`。
- 開始程式修改前 HEAD：`15f1c27d79e9e897b1062e9aa0d71f07a7305df5`；與備份之間是既有 README／DESIGN 文件更新。
- 未合併 main、未覆寫舊分支、未 force push。
- 回退使用 `git revert <本次程式提交>` 建立新提交，再發布該提交；不要 reset／刪除資料庫。若後續已有修改，先檢查 revert 衝突，保留其他提交。

## 完成功能

- 開始主持新增傳統／線上模式；沿用原人數、板子與房規。線上模式滿員後人工開始發牌，立即進入原主持確認流程，未改首夜認角色。
- 26 款角色配置由現有 `data.js` 匯出至後端；伺服器交易鎖定座位與一次性發牌，重試不重新洗牌。
- 主持 QR 邀請、複製連結、恢復房間、清除座位、解散；玩家選座、換座、離座及多分頁同步。
- 私有頻道只傳安全狀態；角色須重新驗證自己的身分和座位 lease。角色頁初始蓋牌、350ms 翻牌、圖鑑／切背景／刷新立即蓋牌。
- 正式終局通知後端撤銷角色存取；失敗保留待通知資料，連線／前景恢復時重試。
- QR 縮為 208px 並加裝飾框。環形保持 1 號在上、順時針；席位改為透景冰藍議會牌，保留原色彩與文字辨識。
- 卡背加月相、細邊裝飾；新增透明狼徽衍生檔，原品牌圖、角色原畫與技能 SVG 不覆寫。
- 原主持引擎、角色配置、夜間／死亡、投票、計時器、回退與復盤模型未修改。線上資料使用獨立 localStorage keys，不加入遊戲快照。

## 修改檔案

| 檔案 | 用途 |
|---|---|
| `public/online.js` | Auth、房間、選座、發牌、角色隱私與終局接線 |
| `public/online.css` | 模式、QR、席位、卡背、翻牌與響應式 |
| `public/online-vendor.js` | 鎖定版本 Supabase SDK／QR 本機 bundle |
| `public/wolfcue-mark.svg` | 原狼徽去除矩形底色的衍生檔 |
| `public/art/backgrounds/online-plaza-v3.png` | 本輪依原海邊村莊製作的線上發牌背景 |
| `public/app.js`、`public/index.html` | 模式入口及最小主持整合 |
| `public/b3-ui.js` | 線上頁背景來源 |
| `public/sw.js`、`public/cache-manifest.js` | 新資產清單與版本；漸進快取策略不變 |
| `backend/` | Migration、Functions、權限、板子目錄及本機測試 |
| `package.json` | 原 App 測試明確限定 test/，避免自動混入需 Docker 的後端測試；原斷言保留 |
| `scripts/b3-r10-r16-ui.mjs`、`scripts/ui-regression.mjs` | 測試經新增模式入口選擇傳統主持 |
| `.github/workflows/deploy.yml` | 允許本次實作分支發布 GitHub Pages |

## 實際測試

| 測試 | 結果 |
|---|---|
| App `npm test` | 824 通過、0 失敗 |
| 後端 `npm run test:integration` | 19 組通過、0 失敗 |
| 後端 `npm test` | 1 通過、0 失敗 |
| 本機 pgTAP `node scripts/local-cli.mjs dbtest` | 10 項；退出碼 0 |
| B3 `scripts/b3-r10-r16-ui.mjs` | 50 項通過、瀏覽器錯誤 0 |
| 線上 10 人實際瀏覽器 + 本機 Supabase | 27 項通過 |
| 線上 12 人實際瀏覽器 + 本機 Supabase | 27 項通過 |
| 已部署 Supabase，虛構 10 人雲端測試 | 29 項通過；測試房間已正式結束 |

後端涵蓋 26 配置、20 人搶座唯一成功、12 次發牌／離座並發競態、雙主持分頁冪等、換座失敗保留舊座、偽造／跨房／舊 lease 拒絕、RLS／GRANT、私有 Realtime 拒絕非成員及偽造廣播、清理權限與兩小時邊界。

瀏覽器涵蓋 320×568、375×667、390×844、430×932、844×390、1024×768。證據 JSON 在 `docs/online-evidence/`。這些是桌面 Edge 模擬尺寸，不能替代真機 Safari／PWA。

曾失敗並修正：QR canvas 查找方式、快取版本格式、底部 footer 繼承固定定位、切換 viewport 後測試過早讀取舊高度。重新執行後以上列最終結果為準。

## 雲端及安全

- 專案 `wolfcue-online`（`cnseutkrrjkdkpikjcdz`）。
- 已執行 `wolfcue_online_dealing_v1`、`wolfcue_expiry_schedule`、`wolfcue_deployment_hardening`。
- `room`、`cleanup` Edge Functions 已發布。JWT 由函式／PostgREST 驗證；沒有將 service_role 寫入前端。
- 每分鐘清理排程已查到 `succeeded`。只關閉閒置未發牌房間。
- 安全 Advisor 仍有提示：四張 RLS 無政策為刻意拒絕直接存取；匿名 Auth 政策仍要求房間權限；cron schema／表／函式已撤銷客戶端 GRANT，但 Advisor 仍顯示其原政策提示。不是「零警告」。
- 密碼洩漏防護未啟用；此流程使用匿名 Auth，不使用密碼登入。未擅自修改其他 Auth 設定。
- [RLS 無政策說明](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)、[匿名存取政策提示](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins)、[密碼防護](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)。

## 待驗收與限制

1. iPhone Safari、安裝版 PWA、Android 低階機、相機實際掃 QR：待真機驗收。
2. 網路完全中斷時不能新增房間、選座或讀取角色；不能將離線畫面視為成功。
3. 主持人正式終局由原 App 通知，後端不重新執行勝負引擎。
4. 正式終局前手動丟棄主持存檔，已發牌房間不會依兩小時閒置清除；房間生命週期需另行定稿，未偷偷新增清理規則。
5. 本輪未宣稱完整舊版 `ui-regression.mjs` 已執行；已執行的是上列 824 項 App 測試、50 項 B3 UI 與線上專用完整流程。
6. Realtime 權限快取不能保證撤銷瞬間斷線，因此廣播絕不攜帶角色；角色查詢每次由伺服器重新授權。

## 美術來源

線上背景以原 `lobby-shared.png` 為參考，透過內建 imagegen 編輯成 `public/art/backgrounds/online-plaza-v3.png`；原圖保留。提示重點：保留原有海邊村莊、藍瓦尖屋頂、右側會堂、山海、帆船、碼頭、繩欄與月旗構圖；視角移到村莊中央廣場，會堂與空席迎接玩家、遠處仍見海港；冰藍暮夜與暖窗燈，前景封蠟邀請函暗示議會將開始；無人物、文字、UI 或新標誌。新背景只用於線上發牌頁。

## 發布狀態

Supabase 已部署並完成上列雲端測試。網站程式已推送獨立分支，但 Pages 執行 [39443729796](https://github.com/jia0796/wolf_Emcee/actions/runs/39443729796) 的 build 通過、deploy 被環境保護拒絕：`feat/online-deal-20261020` 不在允許清單。尚未宣稱正式網站已更新；已詢問使用者是否允許只加入此發布分支。沒有擅自移除環境保護或合併 main。

後端提交：`46481fc`；前端整合提交：`4cd2c7f`。後續美術調整另以獨立提交保留。
