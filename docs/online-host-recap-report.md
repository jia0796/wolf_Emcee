# 線上主持身分與玩家復盤、淺色文字及縮小計時器測試報告

日期：2026-10-24。儲存庫 jia0796/wolf_Emcee；施工分支 feat/eclipse-host-app。網站發布及發布後驗證結果於本報告末尾補記。

## 範圍與完成事項

1. **主持身分自動帶入**：發牌交易正式確認後，後端只對該房經 Auth 驗證的主持人提供 seat／role 表。前端驗證板子、容量、座號唯一與角色組成，填入原本 confirm 頁；不重新洗牌。刷新與上一步保留身分。
2. **玩家正式終局復盤**：同一資料庫交易保存主持人的復盤投影、通知終局並刪除活動房間。原已入座玩家透過另一個受權限控制的命令取得同一份資料，使用原 renderRecap 元件，底部只留「回首頁」。主持頁仍有原兩個按鈕與確認流程。
3. **按鈕白／米色字**：主按鈕、繼續／取消採 #F4F1E9 與較深冰藍玻璃底色、柔光及深色文字陰影，保留警示玫紅語意。沒有改寬高、行距、字級、內外距或按鍵位置。
4. **縮小計時器紅字**：直接使用原 timerProgress 色調，剩餘 10 秒（含）與大視窗同為 #E9A095。開始／暫停／重置／拖曳及時間運算不改。

使用者撤回的 bug 房間連結未用於本輪測試。沒有使用真實對局角色資料；本機使用虛構資料，發布後測試只會建立新的專用測試房間。

## 修改檔案與原因

| 檔案 | 原因 |
|---|---|
| public/online-state.js | 主持人發牌匯入驗證、最小復盤投影及本地核准插畫 URL 對應 |
| public/online.js | 玩家終局載入／重試／刷新復盤、主持端安全上傳及原房間刪除相容 |
| public/app.js | 原主持頁帶入身分；玩家獨立顯示原復盤元件及單一回首頁，不覆寫本機對局 |
| public/b3-ui.js | 縮小計時器沿用原色調 |
| public/liquid-glass.css | 米白字與對比、玩家專屬單欄 footer、縮小計時器紅字 |
| public/sw.js | 新核心模組與資源版 council-v22-18；策略不變 |
| backend/supabase/migrations/20261024082212_host_roles_player_recap.sql | 授權主持人完整表、原子終局／復盤隔離表、RLS／權限及原清理排程相容 |
| backend/supabase/functions/room/index.ts | 新 recap 命令；先驗證身分再讀有上限的請求 |
| test/online-state.test.js | 28 板角色匯入、投影一致、無效資料與圖片 URL 安全 |
| backend/tests/integration/host-recap.test.mjs | 真實本機 SQL／Auth 的身分、隔離、終局、並發及清理測試 |
| scripts/host-recap-ui.mjs | 12 個獨立玩家瀏覽器與真實 Supabase 端到端驗證；可明確選擇正式站專用測試 |
| backend/rollback/20261024-* | 發布前雲端 SQL 定義及 room v2 原始碼，供非破壞性回退 |
| README.md、DESIGN.md、backend/README.md | 現行狀態、淺色文字及新權限契約，移除已過期的「主持人不取得分配表」敘述 |
| backend/reports/*、docs/host-recap-evidence/* | 實際測試結果與畫面證據 |

public/engine.js、night.js、data.js、identity.js、records.js、recap.js、timer.js 均未修改。原始角色插畫、背景及全部 26 個技能 SVG 零差異。main、Google Drive 未修改。主存檔格式仍 v22；完整本機回退歷史不刪除。只有網路傳輸投影排除重複巢狀歷史，不影響原局保存。

## 實際本機測試

| 指令／測試 | 通過 | 失敗 | 跳過 |
|---|---:|---:|---:|
| 根目錄 npm test | 955 | 0 | 0 |
| backend：npm test | 1 | 0 | 0 |
| backend：npm run test:integration | 41 | 0 | 0 |
| node scripts/ui-regression.mjs | 38 組 | 0 | 0 |
| node scripts/host-recap-ui.mjs | 12 組 | 0 | 0 |
| node scripts/update-cache-manifest.mjs --check | 128 筆一致 | 0 | 0 |

- 真實本機 Supabase：Auth、Postgres、Edge Runtime、私有 Realtime，不以假 API 代替。CLI 本機 reset 成功重建 migration 與 seed；其後驗證主持人 FK 索引。雲端 migration 與檔案版本統一為 20261024082212。
- 全站瀏覽器回歸包含 28 板完整既有遊戲、刷新／上一步／重開、圖鑑、選人與投票，以及窄／短畫面及離線資源。結果共 38 組，不能把組數視為每項細節都已真機驗收。
- 新連線介面驗證：12 位獨立 Auth 身分入座／個別角色、主持匯入／刷新／回退、淺色字、大小計時器同紅、全部玩家即時取得相同復盤、玩家只留回首頁、刷新恢復及不覆寫另一局存檔；主持原兩個按鈕與確認保留。
- 新後端 10 項定向測試包含 10／12 人、發牌前不公開復盤、未入座／跨房／偽造身分阻擋、錯誤復盤原子拒絕、重複／同時終局冪等、六張活動表級聯刪除、原角色 API 終局拒絕、手動解散不補復盤、過期與直接讀表／RPC 阻擋。
- 新功能測試的 finished 狀態是專用測試房間的**傳輸用 fixture**，不是宣稱真人跑完整局獲勝；完整玩法回歸由原 28 板腳本另行執行。
- 截圖與 JSON：host-recap-evidence/local/、host-recap-evidence/regression/。使用桌面 Edge／Playwright，不是真機 Safari。

## 安全與相容

- 新 finished_recaps 位於非公開 schema，RLS 開啟，public／anon／authenticated／service_role 均無直接表權限。安全函式固定空 search_path、限制 EXECUTE；主 RPC 以 auth.uid() 判權。匿名 Auth 帳號是 authenticated，並不是無登入公開存取。
- 終局前完整角色只提供給房間真正主持人；玩家 state、私有廣播不含完整角色。廣播只通知 room／status／version，收到後再讀權威資料。
- 復盤僅原主持人與該次已完成發牌的玩家可讀；未入座訪客不可讀。房號及舊邀請連結不能代替授權。重新載入仍須原匿名登入身分；清除瀏覽器資料後不保證恢復。
- 活動房間、座位、角色、邀請及成員資料仍於終局刪除；復盤另存 **24 小時**，過期立即拒絕，由原每分鐘清理排程刪除。沒有新增排程或重新開啟公開 Channel。
- 解散房間不產生復盤；舊客戶端終局沒有上傳復盤時維持原本行為，不為已刪歷史房間補造資料。
- 復盤請求最多 2 MiB，其餘操作仍限 4096 bytes；超限原子拒絕，不截斷、不視為成功。主持人的本機完整復盤與歷史仍保留，待送通知留存供恢復連線重試。
- 主持人權威終局資料不由後端重新判狼人殺勝負。這延續原主持端決定終局的架構，不代表伺服器可驗證真人是否依規則操作。
- 線上後端原目錄仍 26 板，離線主持 28 板；本次不擴增線上板子配置。
- 發布後 advisor：既有 4 表「RLS 無 policy」是刻意拒絕直接讀；匿名 Auth 政策與密碼保護提醒原已存在。新復盤 policy 同樣被列為 anonymous-access WARN，但需要原入座帳號且沒有直接 SELECT grant，並非公開資料。新索引初期 unused INFO 保留。沒有為消除提示而放寬權限或更改無關設定。[RLS 提示說明](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)、[匿名 Auth 提示說明](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins)。
- 首次雲端 Migration 工具回覆 requestState 過期；確認未套用後重試成功，沒有重複建表。快取檢查首次使用錯誤腳本名稱未執行，改用實際 update-cache-manifest 後 128 筆通過。初期單元測試 fixture 曾未真的改變原角色而失敗，修正 fixture 後完整測試重跑成功；未弱化權限或遊戲斷言。

## 未驗收與限制

iPhone Safari、安裝版 iOS PWA、Android／低階手機、動態網址列、實機縮放與觸控仍**待真機驗收**。自動化瀏覽器不替代真機結論。跨地區弱網、超過 2 MiB 的實際超長真人局與 24 小時真實等待亦未做人為長時間驗收；過期／大請求以本機定向測試及限額檢查為準。

## 基準與安全回退

- 施工前完整 Commit：e0bea8cb60cb2c8593611fe7ec946b66eb91e376。
- 遠端備份：backup/pre-online-host-recap-20261024，重新 ls-remote 核對相同 SHA。
- 不重置分支、不覆蓋後續提交。回退本輪 App 可對本輪實作 Commit 執行 git revert，再正常 push 同一發布分支；先處理衝突並跑測試。文件結果提交可另行 revert，不影響後續其他提交。
- 新後端向後相容，**通常僅回退 App 即可，後端可暫時保留**。如確需完整回退，先發布舊 App，再以 rollback/20261024-room-v2.ts 還原 room；透過新 migration 套用 rollback/20261024-pre-host-recap.sql，恢復原 command／close_room／snapshot。保留 finished_recaps 表與已存資料，不 DROP、不清空使用者資料；expire_rooms 保留本輪的過期清理，直至暫存清理完成。不要把歷史 migration 刪除或標成未執行。
- 後端回退檔案只供明確需要時使用，本輪未實際執行回退。

## 發布紀錄

- Supabase wolfcue-online：migration 20261024082212 host_roles_player_recap 已成功；room Edge Function **v3 ACTIVE**，保留既有 verify_jwt=false 並由 auth.getUser() 驗證真正使用者。
- GitHub Pages：發布中，部署後測試結果待補。

