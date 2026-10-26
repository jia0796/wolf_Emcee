# WolfCue｜第二版技能圖示與 AKW 新板更新報告

日期：2026-10-26。工作分支 `feat/eclipse-host-app`。本文件依實際執行結果維護；正式站驗證完成前不將部署標為完成。

## 完成範圍

- 新增獨立 12 人特殊板 `awakenedKingWitch12`：覺醒黑狼王 1、普通狼人 3、覺醒女巫／預言家／守衛／獵人各 1、平民 4。現在共 30 傳統板、28 線上板、35 角色。
- 親傳每晚最多一次、扣除當晚生效、每位普通狼限一次；繼承技能不隨狼王死亡消失。合法放逐／基本狼刀死亡可逐次選擇狼槍，有效毒殺／自爆不能發動；每爪獨立，第一爪跳過仍可用第二爪。多人按原死亡批次、座號與持有者剩餘次數處理，正式終局立即停止。
- 覺醒女巫一瓶解藥、三次調毒，需要 1／2／3 名整局不重複協助者；可自選、可選毒殺目標。正式確認才消耗機會，否決也消耗；不足不提交、不消耗。每晚一種藥。可選填完整票型，沿用共用投票函式及逐人自動前進；手動結果矛盾時提醒並省略個別票型。
- 當晚協助者名稱加「（協）」，下一晚清除；受贈者保持「狼人（繼承）」至終局，最終身分仍為狼人。
- 新板調毒單卡中央始終使用毒藥 SVG，上方「成功／失敗」，下方協助者及有效 O／X（均冰藍）。無票型不補造。
- 身分回顧不再收合；其下「完整復盤」長條按鈕開獨立原生 dialog，保留固定橫列天數、事件捲動、Esc／關閉及焦點返回。
- 28 個核准第二版 SVG 以顯示層映射套用操作、座位及復盤；原 26 SVG 不覆寫。紅色狼槍、親傳、屠邊刀及復仇刀有各自映射，原警徽／投票圖示保留。原事件技能 ID、順序與圖示尺寸不變。
- 新角色使用核准正式插畫與使用者逐字定稿文字；未重新生成圖片。首頁、背景、計時器、原 29 板角色配置／規則、票權與存檔版本 v22 維持。

完整定案：[AKW 規格](akw-spec.md)；[圖鑑原文](akw-catalog-copy.json)；[SVG 來源及 SHA256](skill-v2-assets.json)；[新插畫清單](akw-art-assets.json)。

## Git 基準及回退

- 開工原始 SHA：`375ae3c9af23cdf9f4395c829f94e99f2fa79657`。
- 遠端備份：`backup/pre-skill-v2-awakened-20261026` → 上述原始 SHA，推送後已核對。
- 正式規格提交及第二備份：`6e369159df420b9831bb4f29b236328ec94aa875`；`backup/pre-akw-spec-20261026` 指向該 SHA，已核對遠端。
- 原分支、全部備份與歷史保留；未合併 main、未 force push、未 reset。
- 功能提交／Pages 執行／正式站驗證：待本輪發布後填入下節。

## 測試結果（部署前）

| 實際指令 | 通過 | 失敗 | 跳過 | 備註 |
|---|---:|---:|---:|---|
| 根目錄 `npm test` | 1154 | 0 | 0 | 30 板各 18 種子完整流程，共 540 局；含舊局、死亡、票權、回退及新板邊界 |
| backend `npm test` | 1 | 0 | 0 | Realtime 權限快取／競爭測試 |
| backend `npm run test:integration` | 45 | 0 | 0 | 實際本機 Auth／PG／REST／Edge／私有 Realtime；含 28 板目錄及新板全員角色隔離／終局 |
| backend `node scripts/local-cli.mjs dbtest` | 10 | 0 | 0 | pgTAP：RLS、GRANT、EXECUTE、固定 search_path、28 板 |
| `node scripts/ui-regression.mjs` | 40 組 | 0 | 0 | 30 板真實點擊完整主持流程；圖鑑／警上／回退／重開／離線 89 資產等 |
| `node scripts/akw-ui.mjs` | 12 組 | 0 | 0 | 親傳、助手自選、完整表決、第一槍跳過、失敗保存回滾、復盤視窗與 O／X |
| `node scripts/recap-identity-days-ui.mjs` | 13 組 | 0 | 0 | 320／375／390／430／橫向／平板／桌面、固定頁籤、舊局、離線、巡獵替死兩卡 |
| `node scripts/catalog-v2-ui.mjs` | 111 組 | 0 | 0 | 35 角色、大圖／縮圖／正反翻卡／無障礙／缺圖 fallback |
| `node scripts/online-card-art-ui.mjs` | 41 組 | 0 | 0 | 35 角色正面、卡背、蓋牌、權限拒絕與 fallback；API 為攔截的虛構房間 |
| backend `node scripts/akw-online-smoke.mjs` | 21 組 | 0 | 0 | 本機十二獨立虛構身分，真實發牌、雙新角色正面／圖鑑、全員同一終局復盤 |
| `node scripts/akw-release-check.mjs` | 215 檔 | 0 | 0 | 原 26 SVG＋189 舊圖檔；文字型 SVG 僅正規化 CRLF 後核對，Git 中原檔無修改 |
| `node scripts/update-cache-manifest.mjs --check` | 230 項 | 0 | 0 | 漸進快取來源雜湊完整 |

詳細結果：[新板 UI](akw-evidence/akw-ui-local.json)、[全站 UI](akw-evidence/full-ui-local.json)、[復盤](akw-evidence/recap-ui-local.json)、[圖鑑](akw-evidence/catalog-ui-local.json)、[線上卡](akw-evidence/cards-ui-local.json)、[十二玩家](akw-evidence/online-local.json)、[原素材核對](akw-evidence/original-hashes.json)。後端各組結果在 `backend/reports/`。

十二玩家終局傳輸測試使用專屬虛構房間及空歷史 fixture，明確標示非真人對局；它驗證發牌及復盤傳送，不以假造事件宣稱引擎跑完整局。完整引擎流程由 540 局規則測試與 30 板瀏覽器操作另行驗證。

## Supabase 發布

- 雲端 `wolfcue-online`（`cnseutkrrjkdkpikjcdz`）已以正式 migration `20261026072534_awakened_king_witch_board` 追加一筆新板。
- 已重查全部目錄：28 款，原 27 筆 ID、容量、角色順序及 hash 完全不變。
- 新板容量 12，角色數 12；目錄 hash `6bdd990146c8000f2337ba4771ac66771ebfa2816203ef942786a088054795bb`。
- 不修改既有房間、玩家分配、Auth 設定、RLS、Realtime Settings、Edge Functions、Cron 或存檔版本。
- 發布前後安全 advisor 相同：4 筆刻意 deny-direct 的無政策 RLS INFO；7 筆匿名 Auth 政策 WARN 及 1 筆密碼外洩防護未開 WARN，皆為既存。匿名玩家仍是 authenticated，房間授權與 own-role 限制由既有政策及安全函式執行；本輪不將既存警告列成已修復。
- [RLS advisor 說明](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)、[匿名政策說明](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins)、[密碼保護說明](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)。

## 過程問題與修正

- 初次完整測試有 9 項失敗：舊板／圖鑑計數及壓力測試操作器未認識新階段。已更新預期數與新板操作；原投票、傷害、回退、角色斷言保留，最終完整結果為 1154／0／0。
- 原 SQL 安全測試仍期待 7 表、26 板，最初 2 項失敗；現有復盤檔案表使總表數為 8，本輪新板使目錄為 28，修正後原安全限制全數保留、10／10 通過。
- 本機既有 migration 歷史（包括 AWB）與 repo 時戳已不同，CLI `migration up --local` 被拒。未清空／修復舊歷史；僅以 loopback 驗證及交易追加本輪新板，核對原 27 筆不變。本輪新 migration 時戳已對齊雲端回傳值，較早差異保留於 [本機報告](../backend/reports/akw-local-migration.json)。日後完整 reset 只能於明確的拋棄式本機環境執行，不能對正式服務使用。
- 首次十二玩家 UI 測試用 5304 來源，遭既有 CORS 拒絕；測試改回正式允許的 localhost:5173，未放寬 CORS，完整重跑後通過。
- 素材核對最初將 Windows checkout 的 CRLF 與 Git LF 直接比較而誤報；現只對文字型 SVG 正規化換行，二進位原圖仍逐 byte SHA256 核對。未改動原圖或原 SVG。

## 主要檔案

| 範圍 | 檔案 |
|---|---|
| 新板資料／邏輯 | `public/data.js`、`akw.js`、`engine.js`、`night.js`、`records.js`、`recap-deaths.js` |
| 主持／表決 | `public/app.js`、`akw-ui.js` |
| 復盤呈現 | `public/recap.js`、`recap-ui.css` |
| 圖示／插畫 | `public/skill-art.js`、`skills/v2/*.svg`、`catalog-v2.js`、`catalog-art.js`、兩角色 PNG／WebP；`docs/*assets.json` |
| 快取 | `public/sw.js`、`cache-manifest.js`（CORE 優先、每批兩資產策略不變） |
| 後端 | 單筆 catalog migration、`supabase/seed.sql`、`references/board-catalog.json`，不改 Edge 原始碼 |
| 定向／回歸測試 | `test/akw*.test.js`、`skill-v2.test.js`；相關既有數量斷言與壓力操作器；`scripts/akw-*.mjs`、圖鑑／復盤／主持 UI 腳本、後端整合與 pgTAP |
| 文件 | README、DESIGN、AGENTS、現行 AKW 規格及核准圖鑑文字；被取代內容保留在 `docs/archive/`，不作現行施工要求 |

## 尚待驗收

- **待真機驗收**：iPhone Safari、iOS 安裝 PWA、Android／低階裝置、真實動態網址列、安全區、雙指縮放、相機掃描 QR。
- 本輪桌面 Edge 模擬含短螢幕／橫向及 reduced motion；不代表上述真機通過。
- Drive 的 SVG 系統預覽在不同手機仍可能有縮放／背景差異；本輪核對來源 bytes 與 App 實際渲染，未宣稱 Drive 手機預覽已驗收。

## 安全回退

1. 先保存現在對局並停止建立此新板。以新的 `git revert` 回退本輪功能提交，重跑測試後再發布；不得 reset／force push 或覆寫備份。
2. 舊 App 不認識新板存檔；新板進行中應先完成本局，避免將 v22 的新角色存檔交給舊版本。原 29 板資料及存檔未遷改。
3. Supabase 目錄為追加式，可先保留不使用的新板，舊 App 不會列出它；既有房間仍按原目錄快照發牌。不應為回退刪除進行中房間或角色資料。
4. 如確定新板已無活動房間，才以另一次經審查 migration 移除該單筆目錄；不逆轉其他六次 migration、不刪歷史紀錄。Google Drive 原素材與所有備份分支保留。

## 正式站驗證

待 Pages 發布完成後補記執行連結、提交、發布檔案雜湊、正式站 UI 與十二玩家新板測試結果。未完成前不列為通過。
