# 石像鬼／守墓人及同批修復驗收報告

日期：2026-10-21。規格：`62d1171d199aa43b8138ccf6829ef328a105644c` README SK-01～SK-17。警長方向採使用者後續裁定「警長情況暫留原字幕」。

## 發布狀態

**已統一部署並完成正式站驗證**。程式提交 `a6939aa20543c2cafdbd0a5aa29562820cf296b8`，發布分支 `feat/eclipse-host-app`。[GitHub Pages 發布成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39560547407)；工作分支與發布分支的 CI 全部成功。使用者要求部署後才更新 README，本報告與 README 的後續提交不再發布 App 程式。石像鬼人物圖採使用者後續指定的灰岩普通版，改為參考圖蹲踞姿勢；已替換 Drive 原檔並回讀核對 SHA256。已完成的冷啟背景修復仍保留在線上，詳見 [冷啟報告](cold-start-background-report.md)。

## 基準與回退保護

- 原線上程式基準：`3c519f280cda4fb2c2a4210e2c1be83711ebfb6a`。
- 遠端備份 `backup/pre-sk-online-20261021` 指向上述基準。
- 遠端備份 `backup/pre-sk-eclipse-20261021` 指向規格提交 `62d1171d199aa43b8138ccf6829ef328a105644c`。
- 本機實作分支：`feat/sk-gargoyle-20261021`。先整合最新線上程式與規格，再保留冷啟修復；未以舊開發分支覆蓋線上發牌成果。
- 不修改 main、不強推、不重置既有歷史、不修改既有備份。

## 實作與檔案

| 檔案 | 修改用途 |
| --- | --- |
| `public/data.js` | 獨立 `stoneGargoyle` 角色、10／12 人一般板子、原文圖鑑、排序、首夜／次夜順序；原 `gargoyle` 保持覺醒石像鬼。 |
| `public/takeover.js` | 新角色接入共用每夜基本刀資格、刀／技能切換及閉眼提交；排除普通狼人計數。 |
| `public/engine.js` | 首夜身分登記、固定字幕、查驗與具體職業快照、紅色查驗標記；無警長白天發言字幕採已保存的抽籤資料。 |
| `public/records.js` | 在閉眼提交新角色查驗、接刀狀態，與原基本狼刀事件共用保存方式。 |
| `public/recap.js` | 新石像鬼接刀名稱及純狀態卡呈現，不推算不存在的刀口或死亡。 |
| `public/app.js` | 新角色操作、獨立結果畫面；抽籤完成核對可推進狀態後僅推進一次；線上選板仍限制為原後端支援板子。 |
| `public/sw.js`、`cache-manifest.js` | 新人物圖片漸進快取與資源版本，核心策略未改。 |
| `public/art/catalog/stoneGargoyle-crouch-v3.png`、`docs/sk-stone-art.json` | 使用者指定姿勢編修的角色圖、來源、授權文字、完整提示詞與雜湊。 |
| `public/b3.css` | 僅抽籤「完成」改冰藍；首頁、開局入口按鈕增加原創冰晶細節，保留原色與透明玻璃。 |
| `test/stone-gargoyle.test.js` | 新板子、查驗、接刀、結算、復盤、回退與白天字幕精準測試。 |
| `scripts/cold-start-background-ui.mjs` | 部署後驗證使用本次快取 v22-14，保留原背景／離線斷言；可用環境變數指定版本。 |
| `scripts/stone-gargoyle-ui.mjs` | 新板子操作、窄手機／橫向、刷新、回退、抽籤防重複推進瀏覽器驗收。 |
| `test/b3-r10-r16.test.js`、`test/council.test.js`、`test/readme48.test.js`、`test/stress.test.js`、`test/ui54.test.js`、`scripts/ui-regression.mjs` | 加入兩個新板子、保留原 26 板子的規則基準；抽籤自動推進後仍執行原有刷新／回退檢查。 |

本輪沒有修改 `night.js`、`identity.js`、投票／計時器引擎、線上發牌程式或 Supabase。26 份原技能 SVG 已逐檔比對原始位元組，全部相同。原角色資料及 26 個舊板子非顯示設定亦與既有測試基準一致。

## SK-17 驗收矩陣

| 項目 | 目前結果與證據 |
| --- | --- |
| 1. 配置／素材 | 10／12 人數量、一般分類與新舊角色隔離通過。紅色查驗 SVG 已接入；人物 PNG 已按使用者指定姿勢編修，圖鑑／復盤／離線載入驗收通過。 |
| 2. 首夜／次夜 | 首夜只登記一次、最後查驗；次夜最先帶刀狀態／查驗。10 人無獵人，12 人有獵人；守墓結果沿用正式放逐快照。 |
| 3. 查驗 | 必選存活對象、可查自己、獨立具體職業結果、死亡禁止操作通過；保存當時結果，不從最終身分倒推。 |
| 4. 接刀 | 普通狼尚存不能接刀；白天全滅下一晚接刀；夜間中途全滅本晚不補刀；自刀、空刀、禁自爆及普通狼人固定字幕通過。 |
| 5. 結算／歷史 | 狼刀與查驗切換保留選擇，閉眼才提交；提交者同夜死亡不取消攻擊；解藥、守護、同守同救、提前終局、完整快照回退通過。守護測試為共用引擎的合成測試局，沒有往正式石像鬼配置加入守衛。 |
| 6. 復盤 | 查驗目標與當時職業、接刀資格／空刀、實際攻擊、唯一事件與回退資料通過；新人物圖片已在圖鑑、真實自刀終局的復盤卡及離線刷新驗證。 |
| 7. UI-01／02、DAY-01 | 競選及白天抽籤「完成」冰藍、揭曉不推進、完成推進一次、反覆觸發不重複、回退／刷新保留抽籤結果通過。無警長依原結果顯示順逆字幕；有警長保留原字幕。 |
| 8. 回歸／真機 | 完整自動化及瀏覽器回歸結果於下節記錄。實體 iPhone Safari、iOS PWA、Android、低階裝置未驗收。 |

## 測試紀錄

- 初輪完整 `npm test`：857 項，856 通過、1 失敗。原因為既有測試固定板子排序尚未列入新板子；更新為規格要求的位置，保留原規則斷言。
- 後續完整 `npm test`：857 通過、0 失敗。
- 再補四項夜間毒殺、正式終局、守墓快照與白天接刀測試後，完整 `npm test`：**861 通過、0 失敗、0 跳過**。其中 28 板各 18 個種子，共 **504 局、55,875 次操作**完成；詳見 [測試摘要](sk-evidence/node-tests.json)。此輪在接入新版圖片之前完成，接入圖鑑素材後另跑完整 862 項通過；本次採該完整卡面版本。
- 最終完整卡面版本 `npm test`：**862 通過、0 失敗、0 跳過**。取消去背後再驗證下列 64 項單元與 20 項瀏覽器測試；GitHub 發佈 CI 及兩個分支的 Host flow tests 皆已對實際提交版本重新執行 npm test 並成功。
- `node --test test/stone-gargoyle.test.js`：接入素材後與 `test/council.test.js` 合跑，64 通過、0 失敗（其中新板子 28 項）。
- `scripts/stone-gargoyle-ui.mjs`：接入素材後 **20 通過、0 瀏覽器例外**；320×568、375×667、390×844、430×932、844×390。
- `scripts/b3-r10-r16-ui.mjs`：50 通過、0 瀏覽器例外。涵蓋投票／PK、計時器、復盤及原玻璃介面回歸。
- `scripts/ui-regression.mjs`：第一次在血月 10 人的測試檢查點停止，原因是抽籤完成新增自動推進後，腳本提前 `continue` 漏執行第 18 次刷新檢查。已將檢查套用至兩條推進路徑，未刪除刷新斷言；完整重跑後 **38 個檢查組通過、0 瀏覽器例外**，包含全部 28 板完整對局、31 角色翻卡、四組響應式、素材載入及離線；離線段也補上現行「傳統主持」入口，原刷新及載入斷言保留。此套在新增人物圖接入前完成，新增圖片另由 20 項專項驗證。
- 本專案無獨立 build／TypeScript 檢查指令。

所有瀏覽器測試使用桌面 Edge／模擬 viewport，不能代替真機結論。沒有對 Supabase 生產房間執行測試或寫入。

## 存檔、快取及邊界

- 存檔繼續使用 v22；只為新局增加本夜查驗目標／結果欄位，新板子使用獨立 ID。既有 v22 存檔與歷史沿用原樣複製路徑，不強制補寫新欄位；原板子不依賴這兩欄。更舊版本繼續使用原升級路徑補預設值，不重算舊復盤。
- 舊程式不認識新板子 ID。若將來回退，應先讓正在主持的新板子完成；保留該局匯出存檔，避免以舊版開啟新板子存檔。
- 新板子先供傳統主持使用。線上後端角色白名單保持原 26 板，這輪不變更 Supabase；線上選板不展示尚未支援的新板子，避免可選但建房失敗。
- 快取更新為 `council-v22-14`，只將新圖加入既有 OPTIONAL 漸進清單及摘要，CORE 與快取核心策略不變。存檔版本不變。
- 既有快取摘要含歷史 `online-coastal-v2.png` 額外項，`update-cache-manifest.mjs --check` 因集合不完全一致而失敗；現行素材沒有缺漏、原摘要雜湊吻合。此為原有差異，未擴大修復。

## 安全回退

先備份正在使用的存檔；新板子需先完成，舊版不認識新 ID。從當時最新遠端建立唯一回退工作分支：

```powershell
git fetch origin
git switch -c revert/sk-gargoyle-20261021 origin/feat/eclipse-host-app
git revert a6939aa20543c2cafdbd0a5aa29562820cf296b8
npm test
```

若已有同名回退分支，改用新名稱；若後續提交造成衝突，先審查並保留其他後續修改，再完成 revert，不能 reset 或強推。確認測試與差異後才正常推送回開發分支發布。這個反向提交保留冷啟修復及完整歷史，不修改兩份遠端備份。報告後續補記可能產生文件衝突，保留最新驗收紀錄。

## 人物素材與畫面

使用內建 image_gen 編修，保留第一張灰岩造型、黑金卡面及「石像鬼」原字，僅改為第二張的低身蹲踞姿勢，不加入紅披風／金飾。1060×1484 PNG，2,068,077 bytes。完整提示詞及來源見 [素材紀錄](sk-stone-art.json)。

使用者追加授權替換 Drive 圖片後，已更新 [原 v01 檔案](https://drive.google.com/file/d/1s4HQg3vz0vBvS8RaD5Q33K3DDuveqD18/view)，保留 ID、檔名與父資料夾；雲端回讀 SHA256 為 `e9b95bde9a96ac40ee23603cc3cb998c262e84592c5487a97ae7871e19f15872`，與 App 相同。舊輸入原檔仍保留本機；原覺醒石像鬼與 v02 預覽檔未變。

[首頁按鈕](sk-evidence/ornamented-home.png) · [查驗操作](sk-evidence/stone-inspect-390.png) · [新圖鑑](sk-evidence/stone-catalog.png) · [新角色復盤](sk-evidence/stone-recap.png)

使用者最終裁定「不要去背好了」：復盤沿用完整蹲姿卡面與原裁切／融合版型，不接入透明圖片。

## 部署後驗收

- 程式提交：`a6939aa20543c2cafdbd0a5aa29562820cf296b8`。發布分支：`feat/eclipse-host-app`，實作分支：`feat/sk-gargoyle-20261021`。沒有更新 main 或 Supabase。
- [部署與檔案雜湊](sk-evidence/deployment.json)：15 個正式站檔案逐一比對提交內容，全部一致，包含 HTML、CSS、新角色 PNG、紅色 SVG、線上頁及新功能程式。
- 正式站執行 `UI_BASE=https://jia0796.github.io/wolf_Emcee/ node scripts/stone-gargoyle-ui.mjs`：**20 通過、0 例外**，[結果](sk-evidence/live-ui.json)。以隔離瀏覽器與虛構本機存檔驗證，不建立 Supabase 房間。
- 正式站執行 `COUNCIL_URL=https://jia0796.github.io/wolf_Emcee/ COUNCIL_BASELINE=0 node scripts/cold-start-background-ui.mjs`：**23 通過、0 例外**，[結果](sk-evidence/live-cold.json)。包含延遲初始化、快取舊 CSS、缺圖、日夜／回退／刷新與 SW 啟用後離線。
- 上述命令需設定 `COUNCIL_PLAYWRIGHT_MODULE` 指向已安裝的 Playwright；本環境使用桌面 Edge。
- [正式站復盤截圖](sk-evidence/live-recap.png)：完整蹲姿圖片、原裁切／融合樣式；使用者最後取消去背，透明變體未發布。
- 未完成真機驗收：iPhone Safari、iOS 安裝 PWA、Android、低階裝置與實際系統字級／動態地址列。桌面測試不能代替真機。
- 已知範圍限制：新板子僅傳統主持；線上後端白名單仍為 26 板。既有快取摘要多一筆歷史素材，專用 `--check` 集合檢查仍失敗，未混稱通過。
