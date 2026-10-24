# 覺醒狼美人／覺醒獵人：實作與部署驗收報告

日期：2026-10-24。專案：jia0796/wolf_Emcee，分支：feat/eclipse-host-app。

## 版本、來源與回退保護

- 正式規格：README AWB 章，原提交 `5a14fb8d947499388cd5787673b7cef66aa29692`，加上本次使用者後續裁定；DESIGN 保留原 B3 液態玻璃設計。
- 本機接手時為 `0a9ad3b10189bcf97fd97f39361a5348e7f0306a`；確認工作樹乾淨後，快轉至使用者新增規格提交 `5a14fb8…`，未覆寫任何程式。
- 修改前 HEAD／遠端備份基準：`5a14fb8d947499388cd5787673b7cef66aa29692`。
- 新備份：`backup/pre-awb-20261024`，已推送並以 `git ls-remote` 核對相同完整 SHA。其他備份、main 及 Git 歷史保留。
- 實作提交：`940acf4a27a384f59a2076e07737f5d53b723819`。
- [GitHub Pages 發布成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40085542457)；[同版 CI 成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40085542443)。
- Supabase 正式 migration：`20261024101833_awakened_beauty_board`，僅追加板子目錄，未部署新 Edge Function。

## 已解決的規格邊界

1. 巡獵的日／夜依**原死亡來源**判定：狼刀死亡即使天亮才操作，仍走夜間巡獵；正式放逐走白天巡獵。
2. 被連者同夜較早批次已死，仍可消耗一次替死；不增加實際死者、不覆蓋原死因。白天觸發時目標已死，不能替死。
3. 替死不受守衛／解藥阻擋，不改一般狼刀與既有防護。
4. 放逐／合法槍殺轉移給替死者時，遺言沿致命來源繼承，只有實際死者說一次。
5. 使用者核准兩張覺醒紫框插畫。覺醒狼美人保留原銀髮、紅眼及人物建模，改姿勢、服裝、紫色絲線／水晶；覺醒獵人使用核准稿。
6. 巡獵按鈕簡化為「從X號」，相鄰號碼依實際座位動態產生；無障礙名稱保留「從X號開始巡獵」。同列顯示預計命中，選擇不會立即結算。

Google Drive 以角色名稱及 AWB 搜尋未找到交接原稿，本輪以成功讀取的 GitHub 完整定案及上述對話裁定實作；未宣稱已讀取不存在於搜尋結果的 Drive 文件，未修改 Drive。

## 完成矩陣

| 規格 | 實作／驗證 |
| --- | --- |
| AWB-01、21、35～36 | 新增獨立 `awakenedBeauty12`，12 人特殊板，3 普通狼＋覺醒狼美人、預女守覺醒獵、4 民。原 28 板配置／順序保留；不繼承普通狼美人專屬房規。 |
| AWB-02～08、20 | 合法魅惑、自／死者禁選、狼隊友可選、空過不冷卻、隔夜冷卻、翌日連結、下夜失效、一次替死、用後永久禁魅惑、死後固定字幕。 |
| AWB-09～19、23～24 | 狼刀／放逐合法巡獵；毒殺／替死不得巡獵。相鄰方向、循環掃描、跳過好人與死者、首名狼、白天追有效連結、已死連結例外、夜間直接命中狼美人。 |
| AWB-14、17、19 | 同死亡頁選方向／不巡獵、未選阻擋下一步、預覽最終目標、下一步才提交；新死亡插入原隊列前，遺言按來源，正式終局停止。 |
| AWB-26～29 | 原票型與原放逐對象保留；公告實際出局者。原傷害／替死各一筆、實死去重、同批一次抵擋／另一批正常死亡；已用 receipt 只可回放原批次。 |
| AWB-31～34 | 沿用提交／回退機制、既有三種技能 SVG；替死／巡獵標籤正確。兩張核准插畫、圖鑑逐字文案、線上角色卡接入。 |
| AWB-37 | 26 項定向測試與完整回歸；桌面多尺寸已測，真機未驗收。AWB-25、30 保持取消，不新增無命中流程。 |

## 修改檔案與原因

| 檔案 | 差異與原因 |
| --- | --- |
| `public/awakening.js`（新增） | 新板子獨立魅惑狀態、純替死批次投影、一次性 receipt、巡獵方向與目標規劃。 |
| `public/data.js` | 兩角色資料／核准圖片／逐字介紹、一張特殊板子與原固定夜序。 |
| `public/engine.js` | 新角色身分登記、固定字幕、目標資格、冷卻／消耗、死亡技能併頁、巡獵提交、實際死亡隊列、來源遺言與重新開局；新板子才附加 awb 狀態。 |
| `public/night.js` | 在既有狼刀及後續傷害批次接入替死投影、正確實死／勝負，保留原批次優先。 |
| `public/app.js` | 既有技能列接入魅惑、巡獵方向短按鈕／最終目標提示、合法手勢與死者提示；未改按鈕大小或間距。普通獵人手勢依本次 README 同時呈現。 |
| `public/records.js`、`public/recap.js` | 真實魅惑、原傷害、替死及巡獵方向／目標／放棄的獨立事件與正確技能標籤；復盤卡版型不變。 |
| `public/online-state.js` | 正式玩家復盤投影保留新板子的 awb 快照，不改主持介面。 |
| `public/catalog-art.js` | 新兩角色直接使用核准透明原檔；舊 31 張映射不變。 |
| `public/art/catalog/awakenedBeauty-v1.png`、`awakenedHunter-v1.png`（新增） | 1060×1484 RGBA 覺醒紫框角色插畫；框外透明、框內背景完整。 |
| `public/sw.js`、`public/cache-manifest.js` | 新核心模組／兩張選用圖加入既有漸進快取，識別 `council-v22-19`，130 個素材修訂雜湊。 |
| `backend/supabase/migrations/20261024101833_awakened_beauty_board.sql`（新增） | 追加唯一 12 人板子，衝突配置拒絕；不改原資料表結構、權限、函式或已存在房間。 |
| `backend/references/board-catalog.json`、`backend/scripts/seed.mjs` | 線上 27 板清單、新角色與本機 seed 相容；舊 26 筆 hash 保留，新板使用獨立 hash。 |
| `test/awakening.test.js`（新增） | 新板子及邊界的 26 項定向測試。 |
| `test/stress.test.js`、`b3-r10-r16.test.js`、`readme48.test.js`、`special-boards.test.js`、`ui54.test.js` | 壓力流程支援新角色；在保留原配置／舊素材雜湊斷言下追加新板，更新總數，未弱化舊規則斷言。 |
| `backend/tests/integration/backend.test.mjs`、`host-recap.test.mjs` | 真實本機 27 板發牌配置；新增 AWB 的主持取得全部身分、玩家只看自己、終局復盤資料隔離驗證。 |
| `scripts/awb-ui.mjs`、`awb-release-check.mjs`（新增） | 新技能、圖鑑、七種尺寸、恢復／回退、正式站雜湊與真實 SW 離線驗證。 |
| `scripts/ui-regression.mjs`、`host-recap-ui.mjs` | 原全站回歸支援新板；12 玩家腳本可選板子／輸出目錄，預設測試保留。 |
| `docs/awb-assets.json`、`docs/awb-evidence/**`、`backend/reports/*.json` | 核准素材雜湊、實際截圖、測試／部署證據；不是遊戲資料。 |
| `README.md`、`DESIGN.md`、`backend/README.md`、本報告 | 更新已完成狀態、後續裁定、33 角色／29 離線板／27 線上板、回退與真機限制。 |

原 `public/skills/` 26 個 SVG、原 31 張角色原圖均逐檔 SHA256 與備份相同。未修改 `identity.js`、`takeover.js`、`votes.js`、`online.js`、`online-vendor.js`、HTML、CSS、背景與 HOST-02/03；原投票、計時器與線上權限引擎保留。

## 已執行測試

執行環境：Windows、Node、桌面 Edge／Playwright、Docker 本機 Supabase。數量為各套件的斷言／測試群組，不將重疊案例加總成不重複功能數。

| 指令／驗收 | 通過 | 失敗／跳過 | 證據 |
| --- | ---: | --- | --- |
| `npm test` | 986 | 0／0 | 部署前及部署後均完整結束；含 29 板×18 種子＝522 局壓力對局。[部署後原始輸出](awb-evidence/release/npm-test.txt)，CI 同版亦成功。 |
| `node --test test/awakening.test.js` | 26 | 0／0 | 定向規則、批次、死亡、勝負、回退／JSON、文案與素材。已包含於 986 項。 |
| `node scripts/ui-regression.mjs` | 39 組 | 0；errors 空 | [全站結果](awb-evidence/regression/council-ui-results.json)，29 板各有完整主持流程、舊投票／圖鑑、離線 56 資源。 |
| `node scripts/awb-ui.mjs` | 20 組 | 0；errors 空 | [本機](awb-evidence/local/results.json)，七種 viewport／大字體、按鈕 44px、圖鑑、手勢、替死與回退。 |
| `ONLINE_TEST_BOARD=awakenedBeauty12 node scripts/host-recap-ui.mjs` | 14 組 | 0；errors 空 | [本機 12 玩家](awb-evidence/online-local/results.json)，真實 Auth／Edge／Postgres／Realtime。 |
| `AWB_LIVE=1 node scripts/awb-ui.mjs` | 20 組 | 0；errors 空 | [部署後正式站](awb-evidence/live/results.json)，本機合成存檔，不寫入人類房間。 |
| `HOST_RECAP_LIVE=1 ONLINE_TEST_BOARD=awakenedBeauty12 node scripts/host-recap-ui.mjs` | 14 組 | 0；errors 空 | [部署後 12 玩家](awb-evidence/online-live/results.json)，正式 Auth／Edge／Postgres／Realtime，新建專用測試房間。 |
| `npm run test:integration`（backend） | 43 | 0／0 | [資料庫](../backend/reports/database-results.json)、[Edge／Realtime](../backend/reports/edge-realtime-results.json)、[復盤](../backend/reports/host-recap-results.json)、[解散](../backend/reports/room-closure-results.json)。 |
| `npm test`（backend） | 1 | 0／0 | 私有頻道重新查詢權威狀態、過期回應忽略、背景／清理時蓋牌的單元測試。 |
| `node scripts/update-cache-manifest.mjs --check` | 130 素材 | 0 | 本機實檔 SHA256 對照清單。 |
| `node scripts/awb-release-check.mjs` | 13 發布檔＋3 離線組 | 0 | [正式站雜湊](awb-evidence/release/hashes.json)、[離線結果](awb-evidence/release/offline-results.json)。原 26 SVG＋31 人物原圖逐檔不變。 |

### 測試過程實際發現及處理

- 新資料區塊最初插在原角色宣告前，導致模組載入失敗；移至實際檔尾後重跑通過。
- 一開始 JSON 恢復比較發現未定義的死亡來源欄位；改為明確 null，確保存檔往返一致。
- 較早狼刀死亡與稍後替死重複來源一度覆蓋原死因；修正保留最早實死記錄，另留替死事件。
- 新巡獵 `canNext` 最初未選回傳 undefined；改為明確 boolean，測試未選／取消／選擇／放棄。
- 首次完整套件有 4 個舊總數／清單斷言未包含新板；保留舊規則與雜湊核對，追加新角色後全套重新完成 986／986。
- 首次新 UI fixture 在全新分頁等待主持頁逾時，因 App 冷啟動按原行為先回首頁。修正測試以重新整理還原存檔，沒有改 App 既有恢復流程；[原失敗記錄](awb-evidence/local/initial-fixture-failure.json)保留，最終 20 組完整重跑。
- 專用連線測試以真正發牌取得角色，但「正式終局」是專用房間中的傳輸 fixture，用於驗證復盤一致性；不宣稱該場由真人完整玩至勝利。規則與完整主持另由單元／壓力／全板 UI 驗證。

## Supabase 範圍與安全

正式資料庫只新增 `wolfcue_private.boards` 一列；原 26 板摘要在修改前後都是 `de49e38019cc0001d508cf7d16d71b6b`，新總數 27，角色陣列及獨立 hash 均核對。未改現有房間、玩家分配、Auth／Realtime 設定、RLS、GRANT、RPC、Cron 或 Edge Functions。

Migration 由 CLI 先建立，本機 reset／43 項整合測試使用相同 SQL 內容；正式 MCP 產生版本 `20261024101833` 後，檔名對齊正式版本，沒有改 SQL。原 [CLI reset 紀錄](../backend/reports/cli-reset.json)如實保留當時本機時間戳 `20261024095338`，不將測試歷史改寫成正式時間。下次本機重建依 repo 最終 migration 檔名；本輪未執行任何遠端 reset／db push。

已閱讀官方 changelog，近期 TLS／Postgres 相容變動不需要本次資料追加改動。安全 advisors 仍列既有 private 表 RLS 無 policy、匿名 Auth 相關 policy 與密碼外洩保護未啟用提示；未新加 policy 或擴權，沒有宣稱全專案零警示。[RLS 提示說明](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)、[匿名政策提示](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins)、[密碼保護](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)。未擅自修正無關設定。

## 存檔、快取與相容

存檔維持 **v22**，只在新板子帶可選 `awb` 狀態，保留原完整 history。舊板子不取得新角色行為；`upgradeGame`、舊版存檔及上一頁原規則沿用。新目標在下一夜清除，冷卻與永久消耗按快照恢復。玩家正式復盤額外允許 awb 欄位，未改傳輸模型或資料庫權限。

快取識別 **council-v22-19**：新 `awakening.js` 作核心，兩張核准圖共 5,535,389 bytes（約 5.28 MiB）為既有漸進選用下載；原歷史圖及 fallback 保留，沒有改下載策略。線上發牌本來就需網路，離線驗收只指傳統主持與已下載素材。

## 待真機驗收與限制

- **未驗收**：iPhone Safari 動態網址列／實際安全區、安裝 iOS PWA、Android、低階裝置、原生雙指縮放手勢及實際系統字級。
- 已測桌面 viewport：320×568、375×667、390×844、430×932、844×390、768×1024，及 390×844 根字級 150%。短螢幕操作區仍依原機制可獨立捲動，沒有縮小觸控熱區。
- 未聲稱枚舉所有隨機角色分配、所有排列或真人完整對局。長局容量與原 localStorage 限制仍沿用。
- 未再修改先前核准 UI、全站背景、任何既有插畫／技能 SVG；Google Drive 未寫入，main 未合併。

## 安全回退

先保存正在進行的新板子局與任何未提交修改；不要 reset、force push 或用備份覆蓋目前檔案。以新的反向提交保留其後歷史：

```powershell
git switch feat/eclipse-host-app
git pull --ff-only
git revert 940acf4a27a384f59a2076e07737f5d53b723819
npm test
git push origin feat/eclipse-host-app
```

若其後程式碰到相同段落，先人工解決反向提交衝突並重測；文件狀態另以新提交同步。備份分支只供讀取對照，不移動。回退前已有的新板子存檔應保存原文，舊程式不認得該 board ID，不能假稱可繼續操作該新局；原板子舊局仍保留。

Supabase 追加列可保留，不影響原板子與既有房間；前端回退不代表刪除雲端房間／角色／復盤。若將來確定撤下新板，須另作經審查的相容 migration，先核對相關外鍵與進行中房間；不要直接 DELETE、DROP 或反向重置正式資料庫。

## 畫面證據

- [320px 巡獵短按鈕](awb-evidence/local/patrol-320x568.png) · [390px 巡獵與預覽](awb-evidence/local/patrol-390x844.png)
- [覺醒狼美人圖鑑](awb-evidence/local/awakenedBeauty-front.png) · [覺醒獵人圖鑑](awb-evidence/local/awakenedHunter-front.png)
- [覺醒狼美人線上正面](awb-evidence/online-local/awakenedBeauty-online-front.png) · [覺醒獵人線上正面](awb-evidence/online-local/awakenedHunter-online-front.png)
- [離線巡獵](awb-evidence/release/offline-patrol.png) · [完整新板子結局](awb-evidence/regression/council-awakenedBeauty12-finished.png)
- **正式站截圖**：[巡獵操作](awb-evidence/live/patrol-390x844.png) · [覺醒狼美人線上正面](awb-evidence/online-live/awakenedBeauty-online-front.png) · [覺醒獵人線上正面](awb-evidence/online-live/awakenedHunter-online-front.png) · [玩家復盤](awb-evidence/online-live/player-recap.png)
