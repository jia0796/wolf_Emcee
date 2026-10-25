# 覺醒狼美人單狼狼刀修復與全板子核對

2026-10-25（台北）；分支 `feat/eclipse-host-app`。

## 原因與修正

`ROLE_DATA` 已把覺醒狼美人列入狼人陣營，身分登記與勝負也認得她；但 `public/night.js` 的 `ordinaryWolves()` 基本狼刀參與名單漏列 `awakenedBeauty`。普通狼人全部出局時，`basicActor()` 取不到施刀者，導致原襲擊頁不能選目標、沒有實際基本狼刀。其他狼人尚在時，原新局共同狼刀參與快照也少記她。

修正只將 `awakenedBeauty` 加回該名單。她原本便與狼隊共同行動，因此在原狼人襲擊頁操作，沒有新增接刀階段或字幕；魅惑冷卻、替死已使用不影響基本狼刀。原禁止自刀／自爆、守衛／解藥、空刀、魅惑／替死、勝負、存檔及回退全部保留。

修復不改寫已保存的事件、不補回歷史施刀者、不把已確認的空刀補成攻擊；目前停在可操作頁的對局讀取後依新資格操作，可沿原回退歷史重新選擇。

## 全板子檢查

已核對 29 款板子、59 種單一剩餘狼人／接刀情境。其他 28 板在這些情境中未發現同類名單遺漏；修正後 59 種均符合預期。此為定向資格與結算檢查，不宣稱窮盡所有可能的對局組合。

- 原生狼隊角色可沿原襲擊頁操作，且只有一次基本狼刀。
- 機械狼、假面、尋香魅影、石像鬼依原本的夜初接刀資格與專屬頁操作。
- 狼弟在符合加入夜時才參與；隱狼單獨剩餘仍不可帶刀，沿原勝負規則。
- 種狼實際提交時保留是否感染的確認步驟；未繞過感染介面或改感染規則。
- 覺醒狼美人現在同時通過共同狼刀、單狼、魅惑冷卻、替死已用、死亡及防護情境。

逐項資料：[29 板／59 情境矩陣](awb-knife-evidence/all-board-matrix.json)。

## 修改檔案

| 檔案 | 差異 |
| --- | --- |
| public/night.js | 基本狼刀名單新增一個角色 ID；不更改其他條件與結算。 |
| public/sw.js | 快取識別 council-v22-28，確保更新的 night.js 被安裝；策略不變。 |
| test/awb-wolf-attack.test.js | 67 項：59 情境、共同參與者、三種魅惑狀態、空刀、自刀／自爆、守救、死亡、刷新、回退及舊紀錄不回補。 |
| scripts/awb-solo-knife-ui.mjs | 實際襲擊頁、空刀切換、刷新、取消、上一／下一步、女巫刀口與離線恢復。 |
| README.md、DESIGN.md、本報告與證據 | 現況、快取識別、測試與回退；介面設計不變。 |

已比較修改前 SHA：engine.js、awakening.js、identity.js、data.js、records.js、recap.js、recap-ui.css、app.js、votes.js、vote-ui.js、online.js、online-state.js、原人物插畫、技能 SVG 及 backend 全部未修改。main、Google Drive、Supabase 未修改。

## 實際測試

| 指令 | 通過 | 失敗 | 跳過 |
| --- | ---: | ---: | ---: |
| npm test（最終完整重跑） | 1108 | 0 | 0 |
| node --test test/awb-wolf-attack.test.js（包含於完整測試） | 67 | 0 | 0 |
| node scripts/awb-solo-knife-ui.mjs | 7 組 | 0 | 0 |
| node scripts/ui-regression.mjs | 39 組（29 板） | 0 | 0 |
| node scripts/update-cache-manifest.mjs --check | 196 資產一致 | 0 | 0 |

新 UI 定向檢查使用 320×568、390×844、844×390；全站腳本另保留圖鑑、主持、刷新、回退、重開及原資產離線檢查。測試均用虛構對局，不操作真人線上房間。

最初測試先重現漏列問題；測試初稿另修正了解藥回傳空字串、種狼感染確認、未結算紀錄時點及舊紀錄 fixture 的假設。只調整測試以符合既有介面契約，沒有改動其他引擎邏輯或刪減原有規則斷言。未完成／失敗的初稿不列為最終通過；以上以最終完整重跑為準。

原始證據：[完整測試摘要](awb-knife-evidence/unit-results.json) · [67 項輸出](awb-knife-evidence/targeted-tests.txt) · [本機 UI](awb-knife-evidence/local-results.json) · [全站 UI](awb-knife-evidence/regression-results.json)。

截圖：[僅剩覺醒狼美人仍可選刀](awb-knife-evidence/local-solo.png) · [替死用完仍可刀](awb-knife-evidence/local-spent.png) · [女巫接收原狼刀目標](awb-knife-evidence/local-witch.png)。

## 未驗收

iPhone Safari、安裝式 iOS PWA、Android、低階裝置的實際操作仍為 **待真機驗收**。未重新進行真人多玩家連線；此修復不變更線上後端。既有舊紀錄維持原樣，不回推遺失資料。

## 備份與回退

- 修改前完整 SHA：`72b2fd4ab82e2939ca200a9dae091c281588149d`。
- 遠端備份：`backup/pre-awb-solo-knife-20261025`，已推送並核對指向上述 SHA，沒有覆寫既有備份。
- 功能提交：`6bf4a1edf08557d3356431b0b906221eca7d80ef`。使用 `git revert 6bf4a1edf08557d3356431b0b906221eca7d80ef` 建立回退提交，先重測再正常 push／部署，不 reset、不 force push、不清空使用者存檔。若後續報告提交使 README 套用衝突，可先回退該報告提交。

## 部署

已發布至 [WolfCue](https://jia0796.github.io/wolf_Emcee/)。台北時間 2026-10-25 22:04 觸發的 [Pages 40200531579](https://github.com/jia0796/wolf_Emcee/actions/runs/40200531579) 已完成且成功；[GitHub 主持測試 40200531576](https://github.com/jia0796/wolf_Emcee/actions/runs/40200531576) 亦成功。

正式站 night.js、sw.js、engine.js、awakening.js、records.js、app.js 共六個檔案，已核對與功能提交逐位元組及 SHA-256 相同。單狼 UI 正式站完整重跑結果如下。


部署後 `UI_BASE=https://jia0796.github.io/wolf_Emcee/ node scripts/awb-solo-knife-ui.mjs`：**7 組通過、0 失敗、0 跳過**。三種魅惑狀態均能選刀，女巫取得 9 號基本刀口；取消、空刀切換、刷新、回退、共同參與者、已死停用與 SW 離線重開均通過。

[正式站原始結果](awb-knife-evidence/live-results.json) · [六個檔案雜湊](awb-knife-evidence/live-integrity.json) · [單狼可刀截圖](awb-knife-evidence/live-solo.png) · [替死用完可刀](awb-knife-evidence/live-spent.png) · [女巫刀口](awb-knife-evidence/live-witch.png)。

README 已記錄本輪部署，近期核對紀錄共 19 次。最後文件及證據以獨立提交保存，不再變更已驗證的遊戲程式；工作分支及完整回退歷史保留。
