# HOST-01～03 實作、部署與測試報告

> **歷史版本報告**：目前主持介面與測試結果請以[最新報告](host02-03-current-report.md)及根目錄 README 為準；以下保留原版本實測紀錄，不作為現行功能規格。

狀態：**HOST-01～03 已實作、已部署、部署後測試完成**；真機待驗收。

## 版本與回退保護

- 儲存庫：`jia0796/wolf_Emcee`。
- 開始時實際分支：`feat/room-dissolve-20261021`；工作樹乾淨，且與遠端 `feat/eclipse-host-app` 同為 `dec4fea4ad9729f8aeb431b510e1009ff406d78c`，未覆蓋其他修改。
- 實作前完整 Commit：`dec4fea4ad9729f8aeb431b510e1009ff406d78c`。
- 遠端備份：`backup/pre-host01-03-20261022`，已用 `git ls-remote` 核對指向上述 Commit。
- 獨立施工分支：`feat/host01-03-20261022`。
- 程式 Commit：`c87e0ae97febf8e06afaad00ee7b7212e8061c04`，已正常推送施工及 `feat/eclipse-host-app` 分支。未修改 main、既有備份或 Git 歷史。
- 需求來源：README「主持操作 2.0」全部 HOST-01、HOST-02-01～20、HOST-03-01～07；本次依使用者後續明確授權實作與部署。DESIGN.md 只讀，沿用既有 B3 冰藍玻璃。

## 實際修改檔案

| 檔案 | 用途 |
|---|---|
| `public/app.js` | 直接讀原 `selectable()` 結果顯示禁選；將既有計時器接到縮小列；跟隨主持頁／同局生命週期。 |
| `public/b3-ui.js` | 技能選人畫面分類、縮小列呈現、長按拖曳、可視區／安全區限位、同局位置、轉場與一次歸零提示。只保存記憶體 UI 狀態。 |
| `public/b3.css` | 禁選外觀、冰藍縮小列與圖示按鈕、可單筆取消的既有分組呈現。 |
| `public/index.html` | 原完整計時器右上角加入獨立縮小入口。 |
| `public/vote-ui.js` | 由既有選票草稿與 `tallyVotes` 推導可見投票者；重用 `voteGroups` 呈現可取消紀錄。 |
| `test/host01-03.test.js` | 新增 24 個精準單元測試：目標畫面分類、隱藏／取消、全員完成、棄票與缺票、非法舊值及加權資料不變。 |
| `scripts/host01-03-ui.mjs` | 可對本機／正式站執行的 41 組瀏覽器專項與截圖。 |
| `scripts/host01-03-offline.mjs` | Service Worker 接管與斷網刷新後 3 組實際操作。 |
| `README.md`、本報告與 `docs/host01-03-evidence/` | 部署後補記完成狀態、測試事實、限制與證據；不改已定案規則。 |

## HOST-01 驗收

- 已實作：角色技能非法目標暗沉並顯示「不可選取」；不增加鎖頭或「不可連選」。尺寸、座位順序、標記、角色身分與原按鈕事件保持。
- 合法性只取原引擎 `selectable()`；新增函式只辨識是否為技能選人畫面，不產生另一套目標規則。
- 瀏覽器逐張比對守衛、恐懼、攝夢、獵魔、石像鬼查驗、魅惑、綁定、普通查驗、機械技能、自爆的 disabled 與引擎結果；討論／一般投票不誤加技能禁選標示。

## HOST-02-01～20 驗收

| 編號 | 完成內容與實測 |
|---|---|
| 01／03／05 | 橫向剩餘時間＋三個純圖示按鈕；暫停／繼續、重置、還原，具有無障礙名稱，觸控區至少 44×44px。原重設保留。 |
| 02 | 縮小重置保持縮小並還原原時長；原狀態機的重置會回設定模式，因此須還原完整視窗後再開始，不另造啟動語義。 |
| 04 | 初次顯示於底部工具列上方；拖曳／轉向後仍限位，保留工具及上／下一步可操作空間。 |
| 06 | 到時保持原縮小位置與 00:00，不自動展開。 |
| 07～09 | 約 200ms 長按後拖曳；放手不貼邊；同局記住位置。依 visualViewport 與安全區校正。 |
| 10 | 下一步、上一步、畫面渲染不另建計時器、不重設時間或位置。 |
| 11～12 | 三按鈕外皆可長按；長按前開始滑動會取消候選拖曳。滑鼠與 Chromium 觸控事件均實測。 |
| 13 | 原生 dialog 位於縮小列之上並優先接受操作；計時持續。 |
| 14 | 離開主持到圖鑑即隱藏，返回同局還原位置與狀態。 |
| 15 | 不假造可恢復倒數。**原 App 計時器不持久保存**，刷新後沿用原設定模式，沒有縮小列；同局頁內切換可保留。存檔／歷史沒有新增欄位。 |
| 16～17 | 設定模式沒有縮小入口；開始後在原 × 旁顯示獨立 －；暫停／到時可縮小，底部按鈕順序不變。 |
| 18 | 長按冰藍輪廓與輕微浮起；Reduce Motion 無浮起動畫。 |
| 19 | 歸零邊框柔亮一次，無音效、不反覆閃；Reduce Motion 不播放。 |
| 20 | 原「發言計時器」入口還原同一實例；剩餘時間、暫停、重置及設定保持。 |

實測尺寸：320×568、375×667、390×844、430×932、844×390、768×1024；另有 200% 根字級、1.5 倍可視視窗縮放、模擬安全區、觸控長按／早滑，以及原有平板／電腦回歸。這些是桌面瀏覽器模擬，**不是 iPhone／Android 真機驗收**。

## HOST-03-01～07 驗收

- 一般放逐、警長選舉、警長 PK、放逐 PK 均驗證；保留兩套原有對話框布局。
- 01～04：其他對象已記票者隱藏；原對象保留已選可再次取消；剩餘可選格按原座號緊湊補位，取消後恢復。
- 05：只有 `tallyVotes().recorded === total` 且有合資格選民才收起可選格。有效票、顯式棄票、尚未紀錄三者維持原定義；非法值不視為完成。沒有自動統計或推進。
- 06～07：沿用 `voteGroups()` 的實際加權分組、同票排序及組內原座號；把每筆顯示紀錄接回原 `setBallot(..., null)` 取消路徑。取消後立即展開選項。
- 四種投票均驗證完成統計、刷新、重開、取消草稿不毀損已正式提交票型；原 50 組 UI 同時驗證逐人自動前進、警長 1.5 票、隱式棄票、原 PK、回退與復盤。
- 未修改 `public/votes.js`、投票資格、權重、同票規則、正式提交／復盤判定或舊存檔遷移。

## 實際執行的測試

| 指令／項目 | 本機結果 | 證據 |
|---|---:|---|
| `npm test` | **899 通過、0 失敗、0 跳過**；原 875＋新增 24。含 28 板×18種子＝504 完整對局壓力測試。 | [完整輸出](host01-03-evidence/npm-test.txt)、[摘要](host01-03-evidence/unit-summary.json) |
| `node scripts/host01-03-ui.mjs` | **41 組通過、0 失敗、0 page error** | [本機結果](host01-03-evidence/local/results.json) |
| `node scripts/host01-03-offline.mjs` | **3 組通過、0 失敗** | [本機離線](host01-03-evidence/local/offline-results.json) |
| `node scripts/b3-r10-r16-ui.mjs` | **50 組通過、0 page error** | [既有 UI](host01-03-evidence/existing-ui/results.json) |
| `node scripts/ui-regression.mjs` | **38 組通過**，含全部 **28 板**對局／刷新／回退／重新一局、31 角色圖鑑、4 種額外尺寸及 56 項離線資源。 | [完整回歸](host01-03-evidence/boards/council-ui-results.json) |
| 三個修改 JavaScript `node --check`、`git diff --check` | 通過 | `app.js`、`b3-ui.js`、`vote-ui.js` |
| 保護範圍與 26 SVG 比對 | **26／26 原始位元組不變**；引擎、資料、傷害／接刀、復盤、計時器、SW、線上發牌、backend、DESIGN 均無差異。 | [SHA256 與原有問題證據](host01-03-evidence/invariants.json) |
| `node scripts/update-cache-manifest.mjs --check` | **失敗，已確認為修改前既有差異**：manifest 額外保留 `art/backgrounds/online-coastal-v2.png` 鍵。原基準與本次的 manifest／SW 均完全相同。 | 本輪不擴充修改快取策略；實際離線操作另有通過證據。 |

專案沒有獨立 build／TypeScript script，未宣稱執行不存在的建置或型別檢查。初期專項中斷曾由測試虛擬時鐘遮蔽 navigation entry、動畫尚未結束時取樣，以及未先選合法技能目標造成；已修正測試環境與操作，再**完整重跑**產出最終結果，沒有削弱遊戲規則／投票／回退斷言。

## 正式站部署與部署後驗證

- 正式站：[https://jia0796.github.io/wolf_Emcee/](https://jia0796.github.io/wolf_Emcee/)。
- [GitHub Pages 發布工作成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39698872094)，開發／施工兩分支的 Host flow tests 也成功。
- 正式站 `app.js`、`b3-ui.js`、`b3.css`、`index.html`、`vote-ui.js` HTTP 200，**五檔 SHA256 全部與程式 Commit 完全相同**，不是以部署狀態代替實際內容確認。[證據](host01-03-evidence/deployment.json)。
- 部署後 `UI_BASE=https://jia0796.github.io/wolf_Emcee/ node scripts/host01-03-ui.mjs`：**41 組通過、0 失敗、0 page error**。[結果](host01-03-evidence/live/results.json)。
- 部署後既有 `scripts/b3-r10-r16-ui.mjs`：**50 組通過、0 page error**。[結果](host01-03-evidence/live-existing-ui/results.json)。
- 部署後 `scripts/host01-03-offline.mjs`：**3 組通過、0 失敗**，包括實際 Service Worker 接管及斷網刷新。[結果](host01-03-evidence/live/offline-results.json)。
- 以上正式站共 **94 組檢查通過**。只在獨立測試瀏覽器建立虛構本機對局，沒有對真實線上房間或 Supabase 寫入。

正式站截圖：[技能禁選](host01-03-evidence/live/skill-unavailable.png) · [縮小計時器](host01-03-evidence/live/mini-touch.png) · [完成票型／單筆取消](host01-03-evidence/live/batch-exileVote.png) · [離線](host01-03-evidence/live/offline-mini.png)。

## 限制、未驗收與未擴充修復

1. iPhone Safari、iOS 安裝 PWA、Android、低階裝置、真實動態網址列／瀏海／Home Indicator／雙指縮放／長按手感：**待真機驗收**。不能以桌面模擬替代。
2. 刷新後原計時器不能持久恢復：依 HOST-02-15 條件處理，不憑 UI 製造倒數，也沒有擅改存檔格式。
3. 原快取 manifest 檢查腳本差異已列出，未藉本輪變更舊索引或 SW；實際離線成功不等於該靜態校驗通過。
4. 本輪沒有修改 Supabase、正式線上房間資料、Google Drive、人物插畫、26 技能 SVG、正式字幕或 main。線上真人多玩家連線未在本輪重新測試；原線上功能檔案保持不變。

## 截圖

[禁選座位](host01-03-evidence/local/skill-unavailable.png) · [縮小計時器／觸控](host01-03-evidence/local/mini-touch.png) · [一般放逐完成記錄](host01-03-evidence/local/batch-exileVote.png) · [警長記錄](host01-03-evidence/local/batch-sheriffVote.png) · [320px／Reduce Motion](host01-03-evidence/local/mini-reduced-320.png)

## 安全回退

原始完整版本仍在遠端 `backup/pre-host01-03-20261022`，未刪除或覆蓋。需要撤銷本輪程式時，使用新提交反向撤銷，保留其後所有提交及歷史：

```powershell
git switch feat/eclipse-host-app
git pull --ff-only origin feat/eclipse-host-app
git revert c87e0ae97febf8e06afaad00ee7b7212e8061c04
git push origin feat/eclipse-host-app
```

有後續同檔修改時先審查並解決 revert 衝突，不能 force push／reset --hard。回退後同步更正 README 狀態；該 push 依原工作流重新發布。此回退不操作任何 Supabase 房間／資料，也不刪除已存在的本機對局或回退歷史。
