# 霜月司儀｜B3 北極冰霜 UI 改版與發布報告

日期：2026-10-19。正式站：https://jia0796.github.io/wolf_Emcee/ 。本輪為現有 App 的視覺增量修改，沒有重建 App。

## 版本與回退保護

- 修改前完整 Commit：`03ef62447d710c113e973ee1359a861a274b4915`。
- 遠端備份：`backup/pre-b3-arctic-ui-20261019`，建立後及發布前均以 `git ls-remote` 確認指向上述 Commit。
- 獨立實作分支：`feat/b3-arctic-ui-20261019`。
- 最終程式：`ff4f39536b15a2f426dc75640c8fdd0bb1d7c55b`。
- 沒有合併、重置或強推 `main`／`feat/eclipse-host-app`；原開發分支仍為改版前基準。沒有修改任何舊備份或標籤。
- 最終發布：[GitHub Pages workflow 39234142073](https://github.com/jia0796/wolf_Emcee/actions/runs/39234142073)，來源為上述程式 Commit，狀態成功。第一次品牌發布 `e8cfd7d` 亦成功，後續依使用者要求提高按鈕通透度後再次發布。
- Pages 原先僅允許四個既有分支；每次發布僅新增本次 B3 分支的精確權限，完成後刪除該新增項目，已核對原四項限制恢復。未修改工作流程或合併分支來繞過限制。

## 使用者後續確認的調整

1. 品牌改為「霜月司儀」，同步首頁、瀏覽器標題、PWA 名稱與 Apple 安裝標題。儲存鍵、App id、start_url、scope、儲存格式保留，避免更名形成另一份對局資料。
2. 新製原創 SVG 圖標：冰藍弦月與六角霜星，匯出 192／512 PNG，供 favicon 與 PWA 使用。原三份 icon 檔保留；沒有修改角色原畫或技能 SVG。
3. 復盤插圖、職業、技能、目標保持原本分欄；撤回初步整張融合背景的排法。事件維持「插圖／職業／技能／職業／插圖」，最終身分保留插圖與資訊分區。此項依最新對話優先於 DESIGN C24/C25 的融合建議。
4. 按鈕增加細緻漸層、上緣反光與內陰影，再提高通透度。主操作保留冰藍 70% 底色與深色文字，次要操作為深藍 44% 底色及亮字陰影；原位置、狀態與事件保留。投票內部及技能按鈕語意色維持原樣。

## 素材與實作邊界

完整閱讀開發分支 README、DESIGN，以及 Drive 正式 README 第 0～16 章。三張正式背景原檔已取得，沒有重畫、裁切替換或修改原檔。檔案來源、位元組數及 SHA256 見 [b3-assets.json](b3-assets.json)。

- 非主持頁統一大廳背景；主持依原階段顯示白天／夜晚圖。
- 日夜轉場 1000ms，不新增字幕、不等待動畫、不鎖住主持操作。快速切換以最新階段為準；重整與恢復不重播；支援減少動態效果。
- 寬螢幕中央保留原圖比例，兩側同圖模糊延伸。兩張日夜原圖不是像素級對位，沒有宣稱精確對齊。
- 大廳優先，日夜背景靜默準備；缺圖保持既有可用背景或深藍底。裝飾層不接受點擊。
- 存檔仍為 v22，原 `eclipse-host-v1` 鍵及完整歷史不變。快取由 `council-v22-3` 升至 `council-v22-6`，只更新版本與資源名單／雜湊；既有 Service Worker 核心快取、分批下載、前景暫緩與離線機制保留。
- 124 個事前保護檔案逐位元組核對未改，含全部 26 技能 SVG 與角色素材／業務模組。另以 Git 比對確認 `recap.js`、`style.css`、引擎、投票、計時器原碼未變；`data.js` 只改背景映射與品牌。
- `app.js` 僅接入裝飾背景／捲動提示、板名 tooltip，及將原有「完整復盤」標題移到最上方勝負區之後；沒有更動 next、previous、canNext 或資料結算。
- DESIGN.md 與 Drive 文件維持原檔；依最後明確要求，發布與報告完成後更新本分支 README 的現況及歷史視覺說明，沒有更新 main 文件。

## B3-C01～C30 驗收矩陣

桌面瀏覽器實作與自動驗證如下。所有涉及實體裝置的結果均另列為未驗收，不以模擬取代。

| 編號 | 定案與結果 |
|---|---|
| B3-C01 | A 純冰霜藍；桌面自動驗證通過 |
| B3-C02 | C 極光透明玻璃；桌面自動驗證通過 |
| B3-C03 | C 極光雙層玻璃；桌面自動驗證通過 |
| B3-C04 | B 冰霜調和陣營色；桌面自動驗證通過 |
| B3-C05 | 原始 26 SVG 全保留；桌面自動驗證通過 |
| B3-C06 | C 極光漸層卡；桌面自動驗證通過 |
| B3-C07 | C 月光舞台；桌面自動驗證通過 |
| B3-C08 | B 冰晶資訊膠囊；桌面自動驗證通過 |
| B3-C09 | B 冰晶階層懸浮；桌面自動驗證通過 |
| B3-C10 | B 極光月幕；桌面自動驗證通過；依最新指示改名霜月司儀 |
| B3-C11 | A 柔霧淡入淡出；桌面自動驗證通過 |
| B3-C12 | A 同場景同步切換；桌面自動驗證通過；原圖非像素對位，真機場景切換未驗收 |
| B3-C13 | A 白天淺／夜晚深；桌面自動驗證通過 |
| B3-C14 | A 完整階段同步；桌面自動驗證通過 |
| B3-C15 | B 智慧適應背景；桌面自動驗證通過 |
| B3-C16 | B 智慧分階段預載；桌面自動驗證通過 |
| B3-C17 | A 冰霧字現；桌面自動驗證通過 |
| B3-C18 | C 依頁面智慧遮罩；桌面自動驗證通過 |
| B3-C19 | B 極光雙層浮卡；桌面自動驗證通過 |
| B3-C20 | B 極光陣營雙卡；桌面自動驗證通過 |
| B3-C21 | A 冰霧簡約卡；桌面自動驗證通過 |
| B3-C22 | A 冰霧雙面卡；桌面自動驗證通過 |
| B3-C23 | B 極光勝負舞台；桌面自動驗證通過 |
| B3-C24 | 依最新對話保持插圖與資訊分欄；配色、事件模型與順序保留；桌面通過 |
| B3-C25 | 依最新對話保持插圖與資訊分欄；配色、事件模型與順序保留；桌面通過 |
| B3-C26 | B 月光垂直時間軸；桌面自動驗證通過 |
| B3-C27 | A 冰霧並排按鈕；桌面自動驗證通過 |
| B3-C28 | B 深霧聚焦玻璃；桌面自動驗證通過 |
| B3-C29 | B 極光微動回饋；桌面自動驗證通過 |
| B3-C30 | B 冰霧漸層邊界；桌面自動驗證通過 |

## 分階段提交與檔案

| Commit | 階段 | 檔案 |
|---|---|---|
| `ce7fc85056d6be03dcb4305436d649c358f472af` | feat(b3): add approved backgrounds and non-blocking day-night transitions | `docs/b3-assets.json`, `public/app.js`, `public/art/backgrounds/host-day.png`, `public/art/backgrounds/host-night.png`, `public/art/backgrounds/lobby-shared.png`, `public/b3-ui.js`, `public/b3.css`, `public/cache-manifest.js`, `public/data.js`, `public/index.html`, `public/sw.js`, `scripts/b3-ui.mjs`, `test/b3-ui.test.js`, `test/complete-recap.test.js` |
| `fff69745fda0dd72b7e15b14ce2935e847716570` | feat(b3): apply arctic tokens and frosted host surfaces | `public/app.js`, `public/b3.css`, `scripts/b3-ui.mjs` |
| `826d2789cd79e50ef36a069bc1755065b6e464c9` | fix(b3): preserve a scrollable judge area on short screens | `public/b3.css` |
| `0ca6822651bbf8c209989b7ec1397813d8df8c01` | feat(b3): frost common pages, library and dialog shells with passive scroll hints | `public/app.js`, `public/b3-ui.js`, `public/b3.css`, `scripts/b3-ui.mjs` |
| `7154c367ac07dfab91f6fd508718e84e2f79a23b` | feat(b3): fuse recap art and add a passive day-night timeline | `public/app.js`, `public/b3-ui.js`, `public/b3.css`, `scripts/b3-ui.mjs`, `scripts/complete-recap-ui.mjs` |
| `ee5b4fc4c5a51bc6dc20e29306988b378a53babe` | test(b3): align recap placement and offline checks with approved theme | `scripts/fv57-ui.mjs` |
| `e8cfd7de3b239c0af93d9ddf6b4df8e4e5f02b83` | feat(brand): launch Frost Emcee with crystal glass controls and separate recap illustrations | `public/b3.css`, `public/data.js`, `public/frost-emcee-192.png`, `public/frost-emcee-512.png`, `public/frost-emcee.svg`, `public/index.html`, `public/manifest.webmanifest`, `public/sw.js`, `scripts/b3-ui.mjs`, `scripts/ui-regression.mjs`, `scripts/verify-deployment.mjs`, `test/b3-ui.test.js` |
| `ff4f39536b15a2f426dc75640c8fdd0bb1d7c55b` | refine(b3): increase glass translucency while retaining readable labels | `public/b3.css`, `public/sw.js`, `scripts/b3-ui.mjs`, `scripts/fv57-ui.mjs`, `scripts/takeover-ui.mjs` |
| `8d5b6a4acd8f700072d122eca8d26906927e68b7` | test(b3): wait for viewport synchronization and remote navigation | `scripts/b3-ui.mjs` |

逐檔用途：

- `README.md`：發布後現況、報告連結與舊視覺說明修訂。
- `docs/b3-assets.json`：三張正式 PNG 與原26SVG的來源雜湊。
- `docs/b3-ui-report.md`：本報告與回退操作。
- `docs/b3-ui-validation.json`：逐項實際結果與保護核對證據。
- `public/app.js`：最小呈現掛接、復盤標題位置；原遊戲事件不改。
- `public/art/backgrounds/host-day.png`：正式 Drive 原始 PNG，直接接入未改原檔。
- `public/art/backgrounds/host-night.png`：正式 Drive 原始 PNG，直接接入未改原檔。
- `public/art/backgrounds/lobby-shared.png`：正式 Drive 原始 PNG，直接接入未改原檔。
- `public/b3-ui.js`：純顯示背景切換、恢復與捲動提示。
- `public/b3.css`：冰霜 Token、玻璃漸層、頁面視覺與 fallback。
- `public/cache-manifest.js`：正式背景 SHA256 資源名單。
- `public/data.js`：背景映射與品牌常數；角色／板子／規則不改。
- `public/frost-emcee-192.png`：原創弦月霜星圖標 SVG／PWA PNG；保留原圖標。
- `public/frost-emcee-512.png`：原創弦月霜星圖標 SVG／PWA PNG；保留原圖標。
- `public/frost-emcee.svg`：原創弦月霜星圖標 SVG／PWA PNG；保留原圖標。
- `public/index.html`：視覺 CSS、背景預載、新品牌及安裝圖標連結。
- `public/manifest.webmanifest`：新安裝名稱、色彩及圖標，App identity 不變。
- `public/sw.js`：版本與核心／可選資源名單；核心機制不改。
- `scripts/b3-ui.mjs`：新增分階段黑箱測試及遠端／resize 同步。
- `scripts/complete-recap-ui.mjs`：背景新規格斷言與輸出位置參數。
- `scripts/fv57-ui.mjs`：新版標題位置／動態快取名、遠端導頁等待。
- `scripts/takeover-ui.mjs`：遠端導頁等待設定；功能斷言不變。
- `scripts/ui-regression.mjs`：新品牌離線頁面標題斷言。
- `scripts/verify-deployment.mjs`：新品牌及動態快取版本核對。
- `test/b3-ui.test.js`：正式圖／26SVG／映射／新品牌與圖標測試。
- `test/complete-recap.test.js`：新背景分頁規格斷言。


## 實際測試

執行環境為 Windows、Node 與 Playwright headless Edge；GitHub Actions 使用 Node 22。沒有獨立 TypeScript 或 build 腳本，未宣稱執行不存在的檢查。數字是各腳本自己的案例群組，不能把它們全部視為等量的單元測試。

| 指令／檢查 | 結果 |
|---|---|
| `STRESS_SEEDS=18 npm test`（B3 主功能版） | 807 通過、0 失敗；26板各18局，共468局 |
| `STRESS_SEEDS=2 npm test`（最終程式） | 808 通過、0 失敗；26板各2局，共52局；含新增品牌測試 |
| `scripts/ui-regression.mjs`（local） | 36 組通過，0 頁面錯誤 |
| `B3_STAGE=final node scripts/b3-ui.mjs`（local） | 32 組通過，0 頁面錯誤 |
| `scripts/complete-recap-ui.mjs`（local） | 5 組通過，0 頁面錯誤 |
| `scripts/takeover-ui.mjs`（local） | 15 組通過，0 頁面錯誤 |
| `scripts/fv57-ui.mjs`（local） | 7 組通過，0 頁面錯誤 |
| `UI_BASE=<正式站> B3_STAGE=final node scripts/b3-ui.mjs`（live） | 32 組通過，0 頁面錯誤 |
| `UI_BASE=<正式站> node scripts/vote62-ui.mjs`（live） | 32 組通過，0 頁面錯誤 |
| `UI_BASE=<正式站> node scripts/ui56-ui.mjs`（live/e8cfd7d） | 13 組通過，0 頁面錯誤 |
| `UI_BASE=<正式站> node scripts/fv57-ui.mjs`（live） | 7 組通過，0 頁面錯誤 |
| `UI_BASE=<正式站> node scripts/takeover-ui.mjs`（live） | 15 組通過，0 頁面錯誤 |
| `node scripts/timer-review-ui.mjs`（local/7154c36） | 6 組通過，0 頁面錯誤 |
| `node scripts/verify-deployment.mjs`（live/e8cfd7d） | 5 組通過，0 頁面錯誤 |
| `node scripts/update-cache-manifest.mjs --check` | 94項資源雜湊吻合 |
| `node --check public/app.js`、`node --check public/b3-ui.js`、`git diff --check` | 通過 |
| 正式站檔案 SHA256 對 Git blob | 47／47相同，含新圖標、正式背景、26 SVG與核心模組 |
| GitHub Pages build 的 `npm test` | 成功；發布來源 ff4f39536b15a2f426dc75640c8fdd0bb1d7c55b |


涵蓋 320×568、375×667、390×844、430×932、320×480 短螢幕、844×390 橫向、768×1024 平板及桌面，大字體 150%／200%、模擬安全區、Reduce Motion、完整長局復盤、底列可點擊、背景失敗與離線。相關原始結果彙整於 [b3-ui-validation.json](b3-ui-validation.json)。

### 發現並處理的問題／重跑原因

- 短螢幕含投票結果時，提示區曾被壓為 0 高度，阻擋原票型入口：已增加可捲動提示區最低高度，原投票腳本不改答案後通過。
- 捲動裝飾最初放在計時器內並帶 aria-hidden，與原可及性斷言衝突：改為不介入清單排版的空 presentation／inert 裝飾，不更動計時器狀態機。
- 復盤最上方與重新一局後的標題位置：保留單一原標題節點並在勝負區之後重用，確認第二次結束不缺標題、不重複。
- 舊視覺測試要求全頁同一背景、勝負區後立即接事件、硬編碼舊快取名／品牌；僅依新定案更新這些呈現斷言，沒有改遊戲答案。新測試的第二次結束 fixture 補齊有效角色登記，未改正式玩法。
- 曾在完整瀏覽器測試期間調整快取版號，26 局都走完但最終離線檢查等候舊版號逾時；該次不計完整通過，固定最終版本後重跑。
- 部署後的兩組技能腳本初次在 page.goto 的 30 秒網路載入期限逾時，未取得成功結果；只將 UI_BASE 遠端導頁期限延至 90 秒後重跑，功能斷言保留。最終結果見測試表；接刀曾另遇 Service Worker controller 等待90秒逾時，保留該次失敗紀錄。
- 線上 B3 版面測試曾在 resize 事件處理前讀到上一個視窗高度；測試改為等待既有 --app-height 與 innerHeight 同步後檢查原斷言，沒有修改 App 的 resize 行為。
- 早期階段曾中斷一輪完整對局腳本以等候最終版本，未計入成功總數。不同版本、未跑完及失敗首輪均不混入最終通過數。

## 未驗收、限制與可優化處

- **未驗收**：iPhone Safari 真機動態網址列／瀏海／Home Indicator、iOS 安裝 PWA、實際雙指縮放、Android 及低階裝置。模擬 viewport、安全區與 reduced-motion 已測，不能視為真機通過。
- **未驗收**：既有已安裝 PWA 名稱與圖標在不同 iOS／Android 版本上的更新時機；manifest 與三種圖標檔已驗證，裝置更新體驗待確認。
- 20px 模糊與多層玻璃在低階裝置的耗電／掉幀尚未量測；保留無 backdrop-filter 的深色 fallback，沒有擅自加入效能設定或修改遊戲功能。
- 深層捲動及大字體桌面可用，iOS 慣性捲動與最後一列手勢仍需真機觀察。沒有禁用縮放。
- 日夜圖並非精確對位，已用淡入淡出減少視覺跳動，沒有改正式原圖。
- 其餘歷史腳本並非全部執行，例如硬編碼更舊快取版本的舊檢查；本報告只列本輪實際執行的適用腳本，不宣稱儲存庫所有腳本皆通過。
- 在本輪通過的案例範圍內未發現尚未修復的遊戲功能回歸；這不代表所有裝置與所有可能對局都已驗證。

## 安全回退

原始版本永久保留於 `backup/pre-b3-arctic-ui-20261019`。快速網站回退可從該基準建立新的還原分支並在 Pages 精確允許該分支後，手動執行既有 deploy.yml；成功後移除本次新增權限。當前未變動的 `feat/eclipse-host-app` 也仍指向同一基準，且原 Pages 規則允許，可直接以 workflow_dispatch 選取該分支發布。兩種方式都不刪除任何提交。

程式碼回退應在另一條分支建立反向提交，**不要 reset／force push**：

```powershell
git fetch origin
git switch -c revert/b3-arctic-ui origin/feat/b3-arctic-ui-20261019
git revert ff4f395 e8cfd7d ee5b4fc 7154c36 0ca6822 826d278 fff6974 ce7fc85
npm test
```

這會反轉本輪 App／測試改動並保留其後提交；報告與 README 是另一筆文件提交，若要同步撤回現況說明，單獨回退該文件提交。若之後已有其他修改導致衝突，逐檔保留後續功能後重測，不強制覆蓋。需要只檢視原版時，可 `git switch -c inspect/pre-b3 backup/pre-b3-arctic-ui-20261019`，不修改備份分支。
