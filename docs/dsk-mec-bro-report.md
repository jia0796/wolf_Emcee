# WolfCue｜2026-10-23 實作與測試報告

本輪完成 DSK-01、MEC-HUNTER-01、BRO-REVENGE-01，以及使用者施工中追加的縮小計時器直接拖曳／重置後開始。已依使用者後續明確授權推送 `feat/eclipse-host-app` 並部署 GitHub Pages，正式站驗收完成。保留以下本機結果，並補充部署後結果；未合併 main 或修改遠端資料服務。

## Git 基準與版本

- 工作分支：`feat/eclipse-host-app`，原工作樹乾淨，已快轉至最新 README 定案。
- 原始 Commit：`b4b7a3d9584698a6600dde74a840c91a89ec5ad3`。
- 遠端備份：`backup/pre-dsk-mec-bro-20261023`，`git ls-remote` 已確認指向原始 Commit。
- 實作 Commit：`af34f209a51d98918e378f680c7d8fda89b28c9d`。
- 實際發布 Commit：`83fd353f2efa272ba50f8f69388893b8d9aebf83`。
- [GitHub Pages 發布成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39889689411)：CI 的 `npm test`、build、deploy 均成功。
- 正式網址：[WolfCue](https://jia0796.github.io/wolf_Emcee/)。
- 存檔仍為 v22；未刪除歷史快照、角色資料或正式復盤資料。
- Service Worker、快取版本及策略未改動。既有 JavaScript 網路優先／離線回退機制仍適用。

## 逐項結果

| 項目 | 實作及驗證結果 |
|---|---|
| DSK-01 | 新流程直接進入 `lastWords`／`eliminated` 操作槍，不再建立獨立 `skill` 轉場。後續夜晚公告已略過個別通知時，合法槍仍會進入對應無遺言頁。 |
| 明確決策 | 預設開槍、不預選目標；未決定時 Next 阻擋。選取、取消目標、明確不開槍、切回開槍均由原 action／choice 驅動，只有 Next 提交後消耗。 |
| 多槍及死亡鏈 | 原生槍、機械學獵人、幸運兒槍沿用 `gunSources` 與原結算；每個來源分別決定，保留槍擊死亡、獵人／黑狼王鏈、警徽及即時終局判定。無槍與禁止技能玩家不新增操作頁。 |
| 舊技能頁 | 載入時把目前的舊 `skill` 頁映射至適用的死亡頁，保留待處理 queue、source、target、choice。歷史陣列不整批重寫；回退實際取出舊頁時再映射。舊引擎步驟 alias 保留作相容用途，UI 不再顯示獨立啟動技能字幕。 |
| MEC-HUNTER-01 | mechanical12 首夜新增固定第三句；第二晚起每晚在獵人閉眼後追加固定三句。沒有學獵人、學其他職業及死亡時仍保留字幕，只有適用者顯示可／不可開槍提示。首夜尚未閉眼的學習選擇只供手勢預覽，不提早提交。mechanical10 無新增段落。 |
| BRO-REVENGE-01 | 只在 brothers12 設定及摘要加入開關，預設 OFF，缺欄位舊局按 OFF。ON 只讓 `source: revenge` 略過守衛、盾與解藥，保留惡靈騎士、攝夢及共舞保護。基本狼刀與其他來源維持原判定。 |
| 計時器追加需求 | 時間／非按鈕區 pointerdown 即可拖曳；暫停、重置、展開按鈕不啟動拖曳。重置後縮小視窗按鈕顯示開始，可直接呼叫原 `timerStart`。原 `timer.js` 狀態機、秒數與存檔行為未改。 |

## 實際執行結果

環境：Windows、Node.js 24.21.0、Playwright＋Microsoft Edge headless。本機網站為 `http://127.0.0.1:5173/`；全站腳本另開本機服務。沒有對 Supabase 或線上房間寫入資料。正式站測試只在獨立瀏覽器儲存虛構測試局，雲端連線以路由封鎖。

| 指令 | 通過 | 失敗 | 跳過 |
|---|---:|---:|---:|
| `npm test` | 939 項 | 0 | 0 |
| `node scripts/dsk-mec-bro-ui.mjs` | 26 組 | 0 | 0 |
| `node scripts/host01-03-ui.mjs` | 41 組 | 0 | 0 |
| `node scripts/ui-regression.mjs` | 38 組 | 0 | 0 |
| `node scripts/host01-03-offline.mjs` | 3 組 | 0 | 0 |

### 正式站部署後驗收

- `UI_BASE=https://jia0796.github.io/wolf_Emcee/ node scripts/dsk-mec-bro-ui.mjs`：**26 通過、0 失敗、0 跳過**。
- 同網址 `node scripts/host01-03-ui.mjs`：**41 通過、0 失敗、0 跳過**。
- 同網址 `node scripts/host01-03-offline.mjs`：**3 通過、0 失敗、0 跳過**。
- 六個正式站檔案 `engine.js`、`app.js`、`night.js`、`data.js`、`b3-ui.js`、`index.html` 均 HTTP 200，SHA256 與發布 Commit 完全一致。證據：[deployment.json](dsk-mec-bro-evidence/deployment.json)。
- 實際擷取首夜「若學獵人，今晚的開槍手勢」及第二晚「今晚的開槍手勢」；正式站手勢提示正確。截圖為虛構測試存檔，沒有建立線上房間。
- 未把本機 38 組全站 UI 算成部署後重跑；發布後實際重跑的是以上 70 組。

上述各套件有重疊涵蓋範圍，不把組數視為互不重複的獨立案例。瀏覽器輸出均有最終結果檔，錯誤清單為空。

- 939 項包含原有 881 項及新增 58 項定向測試。既有完整隨機對局維持 **28 板 × 18 seeds＝504 局**，驗證終局、回退、重整及重新開局。
- 全站 UI 38 組包含 **28 款板子完整實際點擊流程**，另含圖鑑、候選／投票、版面、素材及離線等檢查。
- 新 UI 檢查覆蓋 320、375、390、430px，含 320×568 短螢幕；驗證死亡頁兩模式、選取／取消、Next、重整、回退、舊 skill 頁、機械狼不同夜晚／學習狀態、房規設定與規則摘要。
- HOST UI 涵蓋觸控模擬直接拖曳、快速移動、放開位置、按鈕操作、重置後開始、時間到、縮放、模擬安全區、200% 字級、Reduce Motion、一般放逐／警長及兩種 PK。計時器重置後，縮小視窗從 01:10 開始並實際遞減至 01:08。
- 防護測試沿用正式 brothers12 配置；盾牌／特殊免疫以抽出的原防護函式做隔離輸入測試，沒有在正式板子加入守衛、機械狼或改變人數。

### 測試過程中的失敗與處理

首輪完整測試為 848 通過、33 失敗。主要原因是舊測試仍要求獨立技能頁、首夜機械狼直接閉眼，以及 R16 的歷史房規快照不含新增開關。依新定案修改測試導航與相應字幕／房規斷言，保留原有角色、死亡結果、票權、勝負、警徽、回退及復盤斷言；未刪除測試。第二輪 880／881 通過，修正另一處仍多走一次死亡頁的測試操作。補上舊流程首夜字幕相容後，另修正其舊「-」字幕預期。最終為表列的 939／939。

更新 HOST 測試時曾因區域變數重複命名而無法啟動，已修正並完整重跑至 41 組通過，沒有把啟動失敗算成通過。

## 修改檔案及原因

| 檔案 | 用途 |
|---|---|
| `public/engine.js` | 死亡頁共用槍資格／提交、舊 skill 頁恢復；機械獵人固定步驟及手勢判定。 |
| `public/app.js` | 在死亡頁沿用既有槍控制、模式回饋；新增機械手勢呈現與兄弟房規讀寫／摘要；縮小計時器接原開始事件。 |
| `public/data.js` | brothers12 唯一新增 `revengeInvincible: false` 預設及 adjustable 項。 |
| `public/index.html` | 特殊房規區新增兄弟板專屬開關，其他頁面結構不變。 |
| `public/night.js` | 原攻擊防護條件抽為 `attackProtection` 供隔離測試，只新增限定復仇刀的 bypass 分支；保留原防護順序和逐次消耗。 |
| `public/b3-ui.js` | 移除縮小計時器的長按等待，重置後可直接開始。 |
| `test/dsk-mec-bro.test.js` | 新增 58 項針對死亡頁、固定夜序、手勢、房規及防護的測試。 |
| `test/boards.test.js`、`brothers.test.js`、`engine.test.js`、`mechanical.test.js`、`fragrance-e2e.test.js`、`fragrance-followup.test.js`、`stress.test.js`、`takeover.test.js` | 適配移除的額外技能轉場、新固定字幕及合法死亡頁決策，保留其結果驗證。 |
| `test/b3-r10-r16.test.js` | 僅將已核准的 brothers12 新房規獨立驗證，再比較其餘原始配置快照。 |
| `scripts/dsk-mec-bro-ui.mjs` | 新功能真實 DOM 操作、手機尺寸截圖與結果輸出。 |
| `scripts/host01-03-ui.mjs` | 將長按驗收改成直接拖曳，新增重置後縮小視窗開始與遞減驗證。 |
| `scripts/ui-regression.mjs` | 槍操作測試查找目前正式「不開槍」按鈕，其他驗證不變。 |
| `README.md`、本報告、`docs/dsk-mec-bro-evidence/` | 本機實作狀態、測試證據、截圖與回退說明。 |

## 範圍與尚未驗收

- 比對基準：26 個技能 SVG、人物插畫、背景、`takeover.js`、`records.js`、`recap.js`、`timer.js`、`votes.js`、`vote-ui.js`、線上發牌檔案、backend、Service Worker 與快取清單均無修改；詳見 [scope.json](dsk-mec-bro-evidence/scope.json)。
- 原要求不動 HOST-02，之後使用者明確追加直接拖曳與縮小視窗開始，因此本輪包含這兩項呈現／操作修正；HOST-03 投票邏輯未修改。
- **iPhone Safari、安裝版 iOS PWA、Android、低階裝置真機：未驗收**。尤其直接拖曳與 Safari 網址列伸縮、真實雙指手勢仍需實機確認；桌面觸控模擬不代表真機通過。
- **正式站已部署並完成 70 組驗收**。後續使用者明確授權部署，取代原本等待發布的狀態；未合併 main 或變更 Supabase／Google Drive。
- 未發現本輪已執行測試仍失敗的項目。未執行所有歷史專項腳本，不能宣稱所有未執行腳本也通過。

## 證據與畫面

- [完整 npm test 日誌](dsk-mec-bro-evidence/npm-test.txt)
- [新功能 26 組結果](dsk-mec-bro-evidence/ui/results.json)
- [HOST 41 組結果](dsk-mec-bro-evidence/host/results.json)
- [全站 38 組結果](dsk-mec-bro-evidence/full-ui/council-ui-results.json)
- [離線 3 組結果](dsk-mec-bro-evidence/host/offline-results.json)
- [390px 無遺言開槍頁](dsk-mec-bro-evidence/ui/death-390-2.png)
- [320px 遺言開槍頁](dsk-mec-bro-evidence/ui/death-320-1.png)
- [狼弟當局房規摘要](dsk-mec-bro-evidence/ui/brothers-rule.png)
- [縮小計時器觸控模擬](dsk-mec-bro-evidence/host/mini-touch.png)

### 正式站證據

- [新功能 26 組](dsk-mec-bro-evidence/live-ui/results.json)
- [計時器／投票 41 組](dsk-mec-bro-evidence/live-host/results.json)
- [離線 3 組](dsk-mec-bro-evidence/live-host/offline-results.json)
- [首夜機械狼新字幕](dsk-mec-bro-evidence/live-ui/mechanical-night-1.png)
- [第二晚機械狼手勢字幕](dsk-mec-bro-evidence/live-ui/mechanical-night-2.png)

## 安全回退

先保存其他尚未提交工作，確認所在分支，再以新增反向提交回退本輪程式，不覆寫任何後續歷史：

```powershell
git status --short
git switch feat/eclipse-host-app
git revert af34f209a51d98918e378f680c7d8fda89b28c9d
npm test
```

若之後有相依修改產生衝突，逐檔保留後續工作再完成 revert；不要使用 reset hard 或 force push。備份可用 `git show backup/pre-dsk-mec-bro-20261023:public/engine.js` 唯讀比較。回退程式不會刪除使用者存檔；新增房規在原版本不生效，新增夜間步驟存檔回退前應先完成當晚或匯出保存，舊程式不認識新增步驟，不能宣稱可無條件降版續局。
