# 線上角色卡正面同步新版插畫

2026-10-26（台北）；工作分支 `feat/eclipse-host-app`。

## 原因及修正

線上翻牌原本仍呼叫 catalogImage()，讀取舊 catalog-clear 圖源；新版圖鑑及復盤已使用 catalog-v2，因此正面人物停留在上一套插畫。這不是 Supabase 替角色指定了舊圖片。

透過使用者標記的 Supabase 連線唯讀核對：`room` Edge Function 為 ACTIVE／version 3，將操作傳給 wolfcue_command；實際 wolfcue_private.command 的 my_role 分支確認房間已發牌、當前使用者及座位 lease，回傳 seat、role、dealId、boardId，沒有插畫 URL。本輪只讀取函式定義，沒有修改資料、角色分配、Auth、RLS、Realtime、Edge Functions 或部署後端。

修正 online.js 的正面圖源為 libraryImage()，依伺服器已確認的職業 ID 使用 catalog-v2 的 33 張完整插畫。保留原線上卡框、底色、尺寸、90% 圖片區、contain、職業文字、卡背與翻牌；沒有新增或重畫人物、沒有改 CSS／卡片布局。新圖載入失敗時沿原機制只退回一次既有原圖。

權限確認、請求票號、背景蓋牌、重新同步與角色隔離邏輯不變；只有 my_role 成功後才建立正面。蓋牌仍清空正面，未確認權限不顯示人物或名稱。既有房間、座位與發牌結果不重建、不重發；仍在對局的頁面於重新整理後載入新圖源。

## 修改檔案

| 檔案 | 差異 |
| --- | --- |
| public/online.js | 新增 catalog-v2 匯入，只更換角色圖片解析式。 |
| public/catalog-v2.js、public/catalog-art.js | 註解分清新版共用圖源與舊素材 fallback；映射與檔案未改。 |
| public/sw.js | council-v22-29；核心與素材清單、漸進策略不變，存檔仍 v22。 |
| scripts/online-card-art-ui.mjs | 全 33 位角色核對新版 full 圖源，保留原卡框／卡背與隱私斷言，缺圖測試改為阻擋新版 WebP。新增兩位覺醒角色截圖。 |
| test/catalog-v2.test.js | 測試名稱改為「保留原畫及歷史透明素材」；所有原始雜湊、映射及 fallback 斷言保留。 |
| README.md、DESIGN.md、本報告與證據 | 新現況、測試與回退；歷史報告不覆寫。 |

已比較修改前 SHA：online.css、liquid-glass.css、style.css、b3.css、engine.js、night.js、records.js、recap.js、data.js、online-state.js、全部 art／skills、backend 均未修改；main 與 Google Drive 未修改。

## 實際測試

| 指令 | 通過 | 失敗 | 跳過 |
| --- | ---: | ---: | ---: |
| npm test | 1108 | 0 | 0 |
| node scripts/online-card-art-ui.mjs | 39 組 | 0 | 0 |
| node scripts/update-cache-manifest.mjs --check | 196 資產一致 | 0 | 0 |

39 組包含：390px 全 33 位角色、320／430px 的預言家、新圖可解碼、來源／名稱／陣營色與原卡框／尺寸不變、蓋牌清空、三種尺寸的權限拒絕維持蓋牌，以及缺圖 fallback。完整測試仍涵蓋現有規則、存檔、回退及角色圖源雜湊。

UI 使用隔離瀏覽器及虛構 Auth／Realtime／API adapter，只針對已部署前端的角色呈現作驗證，不寫入雲端房間；為核對全部角色而輪換虛構 role，不代表任一板子的實際配牌配置。未重新執行全站 29 板 UI 或真人多玩家發牌，不將先前結果列為本次重測。

原始結果：[完整測試摘要](online-card-v2-evidence/unit-results.json) · [本機 39 組](online-card-v2-evidence/local-results.json)。

截圖：[原卡背](online-card-v2-evidence/local-back.png) · [預言家](online-card-v2-evidence/local-seer.png) · [狼人](online-card-v2-evidence/local-wolf.png) · [覺醒狼美人](online-card-v2-evidence/local-awakenedBeauty.png) · [覺醒獵人](online-card-v2-evidence/local-awakenedHunter.png)。

## 待驗收

iPhone Safari、安裝式 iOS PWA、Android、低階裝置仍為 **待真機驗收**。本輪沒有重新操作真實房間或發牌。先前已開啟的頁面需要重新整理才會載入新 JavaScript；不需要清除存檔或重新發牌。

## 備份與回退

- 修改前完整 SHA：`2875b9b485bf904b20ee4b89d86d1ae3b9482c00`。
- 遠端備份：`backup/pre-online-card-v2-20261026`，已重新核對指向相同 SHA，既有所有備份保留。
- 功能提交：`673ca6e9bfd6c64b59747d4f8c30b3acfc92ad1a`。使用 `git revert 673ca6e9bfd6c64b59747d4f8c30b3acfc92ad1a` 建立回退提交，重測後正常推送部署；不 reset、不 force push、不清除房間或玩家資料。後續報告提交若造成 README 套用衝突，可先回退該報告提交。

## 部署

已發布至 [WolfCue](https://jia0796.github.io/wolf_Emcee/)。台北時間 2026-10-26 00:16 觸發的 [Pages 40210924534](https://github.com/jia0796/wolf_Emcee/actions/runs/40210924534) 已成功；[GitHub 主持測試 40210924528](https://github.com/jia0796/wolf_Emcee/actions/runs/40210924528) 亦成功。

正式站 online.js、catalog-v2.js、catalog-art.js、sw.js、online.css、app.js 與兩張覺醒插畫，共八個檔案已逐位元組及 SHA-256 核對與發布提交一致。同一套正式站 UI 已完整執行，結果如下。


部署後以 `UI_BASE=https://jia0796.github.io/wolf_Emcee/ node scripts/online-card-art-ui.mjs` 執行：**39 組通過、0 失敗、0 跳過**，包括全 33 角色、原卡樣式、三種寬度、蓋牌／權限拒絕及新圖失敗 fallback。此為正式前端搭配隔離測試 adapter，不宣稱重做真人發牌。

[正式站原始結果](online-card-v2-evidence/live-results.json) · [八個檔案及插畫雜湊](online-card-v2-evidence/live-integrity.json)。

正式站截圖：[原卡背](online-card-v2-evidence/live-back.png) · [新版預言家](online-card-v2-evidence/live-seer.png) · [新版覺醒狼美人](online-card-v2-evidence/live-awakenedBeauty.png) · [新版覺醒獵人](online-card-v2-evidence/live-awakenedHunter.png)。截圖使用虛構授權資料。

README 已補入本輪發布，近期核對紀錄共 20 次；目前圖鑑、復盤與線上卡正面共用新版插畫。最後文件及證據以獨立提交保存，不再改動已驗證的 App。
