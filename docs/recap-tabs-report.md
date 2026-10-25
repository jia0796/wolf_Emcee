# 完整復盤視窗、投票配色與巡獵替死報告

日期：2026-10-25（台北）。分支：`feat/eclipse-host-app`。

## 本輪完成

1. 復盤投票紀錄的舊色來自 b3.css 的紫色／古金區域變數，以及 style.css 的 vote-highest 紫色底。僅在 finished 範圍覆寫為共用冰藍、深藍玻璃與月光白文字，保留最高票區別；涵蓋警長、警長 PK、放逐與放逐 PK，不修改編輯器及計票。
2. 完整復盤是內嵌玻璃視窗；標題與天數列位於固定的上方區域，下方事件內容獨立垂直捲動。第一天、第二天、第三天同列，超出可左右滑動，不換行。每次只顯示選中天數，預設第一個實際紀錄日；切換時事件區回頂端。
3. 頁籤具有 tablist／tab／tabpanel、選中狀態與可見焦點，支援方向鍵、Home／End、Enter／Space。無紀錄不補造天數；月亮／太陽、當晚結果與既有事件順序保留。
4. 身分回顧以原生 details／summary 收合，預設展開；原四欄、勝方排序、死因、角色融合與外層頁面捲動保留。收合及切換僅為當次畫面狀態，不寫存檔。
5. 覺醒獵人白天巡獵命中覺醒狼美人並觸發替死：原事件仍保存實際死亡目標；呈現時核對 encountered、緊接的正式替死事件、同一實際目標及覺醒狼美人當時快照，顯示「覺醒獵人 → 覺醒狼美人」「覺醒狼美人替死 → XX號」兩張卡。原始資料、實際死亡及遺言不改。夜間巡獵仍依原規則直接命中；不新增替死。缺少可靠相遇／快照的舊局保持原紀錄。
6. 最終核准精修採「細線分頁＋深藍液態玻璃」：減少厚日期按鈕、投票內外多重套框及當晚結果的重框；保留白字、冰藍選中細線與月亮／太陽。視窗比核准預覽向下延伸約 78px（390×844 時約 658px）；高度取 680px、可用高度 78%、可用高度減 112px 最小值，短螢幕不侵入底部操作。

## 修改檔案與範圍

| 檔案 | 差異 |
| --- | --- |
| public/recap.js | 身分收合、固定視窗、同列天數頁籤、純呈現的巡獵命中投影。 |
| public/recap-ui.css | 視窗及內部捲動、頁籤選中與焦點、身分收合、限定復盤票型配色。 |
| public/app.js、public/index.html | 移除外置完整復盤標題，由共用復盤元件產生視窗內標題；主持及玩家共用。 |
| public/sw.js | 初版 council-v22-26、精修 council-v22-27；只更新快取識別，存檔仍 v22、快取策略不變。 |
| test/recap-window.test.js | 真實巡獵結算、兩卡顯示、資料不變、回退／恢復、玩家投影與缺資料情境。 |
| scripts/recap-identity-days-ui.mjs | 保留四欄、死因、排序及存檔斷言，將舊收合天數更新為頁籤，新增固定標題、四種票型顏色、12 天橫列與巡獵兩卡驗收。 |
| scripts/ui-regression.mjs | 僅更新天數切換／視窗邊界斷言；29 板規則、結果、回退與刷新斷言保留。 |
| README.md、DESIGN.md、本報告及證據 | 更新現行規格；舊版本留在 Git 歷史及原報告，不作現況。 |

engine.js、night.js、records.js、awakening.js、votes.js、vote-ui.js、data.js、online.js、online-state.js、全部角色插畫／技能 SVG、Supabase、Google Drive 均未修改。

## 測試

| 指令 | 通過 | 失敗 | 跳過 |
| --- | ---: | ---: | ---: |
| npm test | 1041 | 0 | 0 |
| node --test test/recap-window.test.js（已包含於完整測試） | 8 | 0 | 0 |
| node scripts/recap-identity-days-ui.mjs | 13 組 | 0 | 0 |
| node scripts/ui-regression.mjs | 39 組（29 板） | 0 | 0 |
| 精修後重跑 node scripts/recap-identity-days-ui.mjs（含視窗高度、細線頁籤斷言） | 13 組 | 0 | 0 |
| node scripts/update-cache-manifest.mjs --check | 196 資產一致 | 0 | 0 |

UI 尺寸為 320×568、375×667、390×844、430×932、844×390、768×1024、1440×900，另含 150% 根字級、Reduce Motion、鍵盤、離線重整、舊局缺日、12 天溢出、最後一天可點及無紀錄狀態。票型檢查包含 1.5 警長票權的原始總數，核對四種輪次最高票框與文字 computed style，操作前後存檔逐字相同。

最初在隔離環境啟動 Edge 失敗，未完成任何 UI 驗收，不計通過；改用本機瀏覽器權限後從第一組完整重跑。沒有因此修改遊戲邏輯或降低驗收斷言。

原始結果：[本輪 UI](recap-tabs-evidence/local-results.json) · [全站 29 板](recap-tabs-evidence/regression-results.json)。全站包含角色圖鑑、主持完整流程、刷新、回退、重新開局與 56 個原資產離線。

本機截圖：[完整復盤固定標題](recap-tabs-evidence/local-window.png) · [投票紀錄](recap-tabs-evidence/local-votes.png) · [橫列天數尾端](recap-tabs-evidence/local-days.png) · [巡獵及替死兩卡](recap-tabs-evidence/local-patrol.png) · [身分四欄](recap-tabs-evidence/local-identities.png)。全部使用虛構測試資料。

精修只修改 recap-ui.css、快取識別與驗收／文件；1041 項完整測試及 39 組全站為功能版執行結果，精修後另完整重跑 13 組有關 UI，不將未重跑的全站檢查宣稱為第二次通過。[精修 UI 原始結果](recap-tabs-evidence/polish-local-results.json) · [加高視窗](recap-tabs-evidence/polish-local-window.png) · [精修投票](recap-tabs-evidence/polish-local-votes.png) · [精修巡獵兩卡](recap-tabs-evidence/polish-local-patrol.png)。

## 真機與限制

iPhone Safari、安裝式 iOS PWA、Android、低階裝置、真實手指橫滑／慣性、動態網址列、安全區與雙指縮放：**待真機驗收**。本輪只使用獨立瀏覽器及虛構對局；未操作真人雲端房間。玩家復盤資料契約有自動測試，但未重做真人多人連線。

## 回退

- 修改前完整 SHA：`3d0089e9ef5a15d07cd6ea8190ca58b933b82e0d`。
- 已推送並重新核對遠端：`backup/pre-recap-tabs-20261025` 指向上述 SHA。
- 本輪功能提交：`961eeb6b9c3ee370cac90e2bc5fa3f0f8b09a721`。
- 所有舊備份完整保留；不改 main、不強制推送、不重置歷史。
- 使用 `git revert 961eeb6b9c3ee370cac90e2bc5fa3f0f8b09a721` 建立回退提交，執行 npm test／UI 後正常 push 重新部署。若後續報告提交影響 README 套用，可先回退報告提交，再回退功能提交。不可用 reset 或刪存檔處理。

## 部署

已發布至 [GitHub Pages](https://jia0796.github.io/wolf_Emcee/)，台北時間 2026-10-25 21:13 觸發 [Pages 工作流程 40196638842](https://github.com/jia0796/wolf_Emcee/actions/runs/40196638842)，狀態已完成且成功。發布提交為上述功能 SHA；正式站八個檔案與提交位元組完全一致，未誤用舊版快取。

[GitHub 主持測試 40196638841](https://github.com/jia0796/wolf_Emcee/actions/runs/40196638841) 亦已成功。本輪只更新指定分支，main、Google Drive 與 Supabase 均未修改。

初版正式站完整重跑同一 UI 腳本：13 組通過、0 失敗、0 跳過；[原始結果](recap-tabs-evidence/live-961eeb6-results.json)。細線玻璃與加高精修版獨立發布，正式站結果於完成後補入。
